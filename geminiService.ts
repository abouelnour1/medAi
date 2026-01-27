
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined') return false;

  let isAiEnabled = true;
  try {
    const settingsString = localStorage.getItem('mock_app_settings');
    if (settingsString) {
      const settings = JSON.parse(settingsString);
      if (typeof settings.isAiEnabled === 'boolean') {
        isAiEnabled = settings.isAiEnabled;
      }
    }
  } catch (e) {}
  
  return isAiEnabled;
};

const safeClone = (obj: any, seen = new WeakSet()): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return '[Circular]';
    seen.add(obj);

    if (Array.isArray(obj)) {
        return obj.map(item => safeClone(item, seen));
    }
    
    const clone: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if (typeof val === 'function' || key.startsWith('_')) continue;
            clone[key] = safeClone(val, seen);
        }
    }
    return clone;
};

export const sanitizeParts = (parts: any[]): SerializablePart[] => {
    return parts.map(part => {
        const sanitized: SerializablePart = {};
        if (part.text) sanitized.text = part.text;
        if (part.thought) sanitized.thought = part.thought;
        if (part.inlineData) {
            sanitized.inlineData = {
                mimeType: part.inlineData.mimeType,
                data: part.inlineData.data
            };
        }
        if (part.functionCall) {
            sanitized.functionCall = {
                name: part.functionCall.name,
                args: part.functionCall.args,
                id: part.functionCall.id
            };
        }
        if (part.functionResponse) {
            sanitized.functionResponse = {
                name: part.functionResponse.name,
                response: part.functionResponse.response,
                id: part.functionResponse.id
            };
        }
        return sanitized;
    });
};

export const runAIChat = async (
    history: ChatMessage[],
    systemInstruction: string,
    tools: any[] | null,
    toolImplementations: Record<string, Function>,
    modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contents = history.map(msg => ({
        role: msg.role,
        parts: msg.parts.map(part => {
            // إضافة التعامل مع الـ thought لضمان عدم ضياع التوقيع الفكري للموديل
            if (part.thought) return { thought: part.thought };
            if (part.text) return { text: part.text };
            if (part.inlineData) return { inlineData: part.inlineData };
            if (part.functionCall) return { functionCall: part.functionCall };
            if (part.functionResponse) return { functionResponse: part.functionResponse };
            return { text: "" };
        })
    }));

    const config: any = {
        systemInstruction: systemInstruction,
    };

    if (tools) {
        config.tools = tools;
    }

    let response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
    });

    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (response.functionCalls && response.functionCalls.length > 0 && iterations < MAX_ITERATIONS) {
        iterations++;
        const functionResponses: any[] = [];
        
        for (const call of response.functionCalls) {
            const implementation = toolImplementations[call.name];
            if (implementation) {
                try {
                    const result = await implementation(call.args);
                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { result: safeClone(result) },
                            id: call.id
                        }
                    });
                } catch (e) {
                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: { error: String(e) },
                            id: call.id
                        }
                    });
                }
            }
        }

        if (functionResponses.length > 0) {
            contents.push({
                role: 'model',
                parts: response.candidates[0].content.parts
            });
            contents.push({
                role: 'user',
                parts: functionResponses
            });

            response = await ai.models.generateContent({
                model: modelName,
                contents: contents,
                config: config,
            });
        } else {
            break;
        }
    }

    return response;
};
