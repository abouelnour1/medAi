
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined' || apiKey === 'null') return false;
  return true;
};

/**
 * دالة تطهير عميقة جداً (Deep Purge)
 * تقوم بتحويل أي كائن إلى كائن POJO بسيط ومنع المراجع الدائرية
 */
function flattenToPOJO(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== 'object') {
        return (typeof obj === 'function' || typeof obj === 'symbol') ? undefined : obj;
    }
    if (seen.has(obj)) return undefined; 
    seen.add(obj);

    if (Array.isArray(obj)) {
        return obj.map(item => flattenToPOJO(item, seen)).filter(i => i !== undefined);
    }

    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Uint8Array) return Array.from(obj);

    const cleanObj: any = {};
    try {
        Object.keys(obj).forEach(key => {
            if (key.startsWith('$')) return;
            const value = obj[key];
            const safeValue = flattenToPOJO(value, seen);
            if (safeValue !== undefined) cleanObj[key] = safeValue;
        });
    } catch (e) { return undefined; }
    return cleanObj;
}

/**
 * تضمن أن أجزاء الرسالة تتبع الهيكل الدقيق المتوقع من Gemini API فقط
 */
export const sanitizeParts = (parts: any[]): any[] => {
    if (!parts || !Array.isArray(parts)) return [];
    
    return parts.map(part => {
        const sanitized: any = {};
        if (part.text !== undefined && part.text !== null) sanitized.text = String(part.text);
        if (part.inlineData) {
            sanitized.inlineData = {
                mimeType: String(part.inlineData.mimeType || 'image/jpeg'),
                data: String(part.inlineData.data || '')
            };
        }
        if (part.functionCall) {
            sanitized.functionCall = {
                name: String(part.functionCall.name),
                args: flattenToPOJO(part.functionCall.args || {}),
                id: part.functionCall.id ? String(part.functionCall.id) : undefined
            };
        }
        if (part.functionResponse) {
            sanitized.functionResponse = {
                name: String(part.functionResponse.name),
                response: flattenToPOJO(part.functionResponse.response || {}),
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
    // CRITICAL: Obtain API Key exclusively from process.env.API_KEY
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key is missing");

    // CRITICAL: Initialize right before usage
    const ai = new GoogleGenAI({ apiKey });
    
    const contents: any[] = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts)
    }));

    const config: any = {
        systemInstruction: String(systemInstruction),
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
    };

    if (tools) config.tools = flattenToPOJO(tools);

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
                const rawResult = await implementation(call.args);
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: flattenToPOJO(rawResult || {}),
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
