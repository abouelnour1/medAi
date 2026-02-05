import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined') return false;
  return true;
};

/**
 * وظيفة لتنظيف الكائنات بشكل عميق وتحويلها لبيانات أولية فقط
 * تمنع خطأ Converting circular structure to JSON
 */
const deepClean = (obj: any): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    // التعامل مع المصفوفات
    if (Array.isArray(obj)) {
        return obj.map(item => deepClean(item));
    }

    // إنشاء كائن جديد يحتوي فقط على الخصائص الخاصة (Own Properties) والقابلة للتسلسل
    const cleaned: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            
            // تجاهل الوظائف والـ Symbols والـ Prototypes
            if (typeof val === 'function' || typeof val === 'symbol') continue;
            
            // منع تسريب كائنات Firebase أو DOM
            if (val && typeof val === 'object' && val.constructor && val.constructor.name !== 'Object' && val.constructor.name !== 'Array') {
                cleaned[key] = String(val); // تحويل الكائنات المعقدة لنص بدلاً من كسر الكود
                continue;
            }

            cleaned[key] = deepClean(val);
        }
    }
    return cleaned;
};

// Comment: Changed return type to any[] to ensure compatibility with GenerateContentParameters.contents requirement
export const sanitizeParts = (parts: any[]): any[] => {
    if (!parts || !Array.isArray(parts)) return [];
    
    return parts.map(part => {
        const sanitized: any = {};
        
        if (part.text !== undefined && part.text !== null) {
            sanitized.text = String(part.text);
        }
        
        if (part.inlineData) {
            sanitized.inlineData = {
                mimeType: String(part.inlineData.mimeType),
                data: String(part.inlineData.data)
            };
        }
        
        if (part.functionCall) {
            sanitized.functionCall = {
                name: String(part.functionCall.name),
                args: deepClean(part.functionCall.args || {}),
                id: part.functionCall.id ? String(part.functionCall.id) : undefined
            };
        }

        if (part.functionResponse) {
            sanitized.functionResponse = {
                name: String(part.functionResponse.name),
                response: deepClean(part.functionResponse.response || {}),
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Comment: Explicitly typed contents as any[] to bypass strict Part/SerializablePart property mismatch errors
    const contents: any[] = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts)
    }));

    const config: any = {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
    };

    if (tools) config.tools = tools;

    let response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
    });

    let iterations = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && iterations < 5) {
        iterations++;
        const functionResponses: any[] = [];
        
        for (const call of response.functionCalls) {
            const implementation = toolImplementations[call.name];
            if (implementation) {
                const result = await implementation(call.args);
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: deepClean(result || {}),
                        id: call.id
                    }
                });
            }
        }

        if (functionResponses.length > 0) {
            const modelTurnParts = response.candidates?.[0]?.content?.parts;
            if (modelTurnParts) {
                contents.push({ role: 'model', parts: sanitizeParts(modelTurnParts) });
                contents.push({ role: 'user', parts: functionResponses });
                
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: contents,
                    config: config,
                });
            } else break;
        } else break;
    }

    return response;
};