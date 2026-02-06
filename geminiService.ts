import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined') return false;
  return true;
};

/**
 * وظيفة لتنظيف الكائنات بشكل عميق وتحويلها لبيانات أولية فقط
 * تستخدم WeakSet لتتبع المراجع ومنع خطأ Converting circular structure to JSON
 */
const deepClean = (obj: any, seen = new WeakSet()): any => {
    if (obj === null || typeof obj !== 'object') return obj;
    
    // منع الحلقات الدائرية (Circular References)
    if (seen.has(obj)) {
        return '[Circular]';
    }
    
    // التعامل مع المصفوفات
    if (Array.isArray(obj)) {
        // لا نضيف المصفوفات لـ seen لأنها تُعالج كقيم، لكننا نحمي محتوياتها
        return obj.map(item => deepClean(item, seen));
    }

    seen.add(obj);

    // إنشاء كائن جديد يحتوي فقط على الخصائص القابلة للتسلسل
    const cleaned: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            
            // تجاهل الوظائف والـ Symbols
            if (typeof val === 'function' || typeof val === 'symbol') continue;
            
            // التحقق مما إذا كان الكائن "بسيطاً" (Plain Object)
            // إذا كان كائناً معقداً من مكتبة (مثل Firebase Reference أو GenAI Internal Object)، نحوله لنص
            if (val && typeof val === 'object') {
                const proto = Object.getPrototypeOf(val);
                const isPlain = proto === null || proto === Object.prototype;
                const isArr = Array.isArray(val);
                
                if (!isPlain && !isArr) {
                    cleaned[key] = String(val);
                    continue;
                }
            }

            cleaned[key] = deepClean(val, seen);
        }
    }
    return cleaned;
};

// وظيفة لتنظيف أجزاء الرسالة (Parts) قبل إرسالها للـ SDK
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
                // تنفيذ الأداة وتنظيف النتيجة فوراً
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