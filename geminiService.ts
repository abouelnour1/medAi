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
 * تدعم الآن خاصية 'thought' بشكل صحيح لنماذج Gemini 3.
 */
export const sanitizeParts = (parts: any[]): SerializablePart[] => {
    if (!parts || !Array.isArray(parts)) return [];
    
    return parts.map(part => {
        const sanitized: SerializablePart = {};
        
        // دعم النص
        if (part.text !== undefined && part.text !== null) {
            sanitized.text = String(part.text);
        }
        
        // دعم التفكير (Thinking) - ضروري جداً لنماذج Gemini 3
        if (part.thought !== undefined && part.thought !== null) {
            sanitized.thought = String(part.thought);
        }
        
        // دعم الصور
        if (part.inlineData) {
            sanitized.inlineData = {
                mimeType: String(part.inlineData.mimeType),
                data: String(part.inlineData.data)
            };
        }
        
        // دعم استدعاء الوظائف
        if (part.functionCall) {
            sanitized.functionCall = {
                name: String(part.functionCall.name),
                args: JSON.parse(JSON.stringify(part.functionCall.args || {})),
                id: part.functionCall.id ? String(part.functionCall.id) : undefined
            };
        }
        
        // دعم ردود الوظائف
        if (part.functionResponse) {
            sanitized.functionResponse = {
                name: String(part.functionResponse.name),
                response: JSON.parse(JSON.stringify(part.functionResponse.response || {})),
                id: part.functionResponse.id ? String(part.functionResponse.id) : undefined
            };
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
    // إنشاء نسخة جديدة عند كل طلب لضمان استخدام المفتاح الأحدث
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contents = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts)
    }));

    const config: any = {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        // حل جذري لخطأ "missing a thought signature":
        // نقوم بتعطيل التفكير (Thinking) عند استخدام الأدوات لضمان استقرار العملية.
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

    // حلقة معالجة استدعاء الوظائف (Function Calling Loop)
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
                            response: { result: JSON.parse(JSON.stringify(result)) },
                            id: call.id
                        }
                    });
                } catch (e) {
                    console.error(`Error implementing function ${call.name}:`, e);
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
            // إضافة دور الموديل (الذي يحتوي على استدعاء الوظيفة) إلى التاريخ
            const modelTurnParts = response.candidates?.[0]?.content?.parts;
            if (modelTurnParts) {
                contents.push({
                    role: 'model',
                    parts: sanitizeParts(modelTurnParts)
                });
                
                // إضافة دور المستخدم (الذي يحتوي على نتائج الوظيفة)
                contents.push({ role: 'user', parts: functionResponses });
                
                // طلب الرد التالي من الموديل بناءً على النتائج
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