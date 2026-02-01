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

/**
 * وظيفة لتنظيف الأجزاء المرسلة للموديل لضمان عدم وجود مراجع دائرية أو كائنات معقدة.
 * تقوم بتحويل كل جزء إلى كائن بسيط (POJO) تماماً.
 */
export const sanitizeParts = (parts: any[]): SerializablePart[] => {
    if (!parts || !Array.isArray(parts)) return [];
    
    return parts.map(part => {
        const sanitized: SerializablePart = {};
        
        // دعم النص - تحويل صريح لسلسلة نصية
        if (part.text !== undefined && part.text !== null) {
            sanitized.text = String(part.text);
        }
        
        // دعم التفكير (Thinking)
        if (part.thought !== undefined && part.thought !== null) {
            sanitized.thought = String(part.thought);
        }
        
        // دعم الصور - نسخ البيانات الخام فقط
        if (part.inlineData) {
            sanitized.inlineData = {
                mimeType: String(part.inlineData.mimeType),
                data: String(part.inlineData.data)
            };
        }
        
        // دعم استدعاء الوظائف - تنظيف الـ args من أي مراجع دائرية
        if (part.functionCall) {
            try {
                sanitized.functionCall = {
                    name: String(part.functionCall.name),
                    args: JSON.parse(JSON.stringify(part.functionCall.args || {})),
                    id: part.functionCall.id ? String(part.functionCall.id) : undefined
                };
            } catch (e) {
                sanitized.functionCall = { name: String(part.functionCall.name), args: {} };
            }
        }
        
        // دعم ردود الوظائف
        if (part.functionResponse) {
            try {
                sanitized.functionResponse = {
                    name: String(part.functionResponse.name),
                    response: JSON.parse(JSON.stringify(part.functionResponse.response || {})),
                    id: part.functionResponse.id ? String(part.functionResponse.id) : undefined
                };
            } catch (e) {
                sanitized.functionResponse = { name: String(part.functionResponse.name), response: { error: "serialization_error" } };
            }
        }
        
        return sanitized;
    }).filter(p => Object.keys(p).length > 0);
};

export const runAIChat = async (
    history: ChatMessage[],
    systemInstruction: string,
    tools: any[] | null,
    toolImplementations: Record<string, Function>,
    modelName: string = 'gemini-3-flash-preview'
): Promise<GenerateContentResponse> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // تنظيف التاريخ قبل الإرسال لضمان عدم وجود مراجع دائرية
    const contents = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts)
    }));

    const config: any = {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        thinkingConfig: { thinkingBudget: 0 }
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
                    // تنظيف النتيجة قبل وضعها في التاريخ
                    const safeResult = JSON.parse(JSON.stringify(result || {}));
                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: safeResult,
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
            const modelTurnParts = response.candidates?.[0]?.content?.parts;
            if (modelTurnParts) {
                contents.push({
                    role: 'model',
                    parts: sanitizeParts(modelTurnParts)
                });
                
                contents.push({ role: 'user', parts: functionResponses });
                
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: config,
                });
            } else {
                break;
            }
        } else {
            break;
        }
    }

    return response;
};