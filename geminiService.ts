
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (): boolean => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'undefined') return false;
  return true;
};

/**
 * دالة تطهير عميقة جداً (Deep Purge)
 * تقوم بتحويل أي كائن إلى كائن POJO (Plain Old JavaScript Object) بسيط
 * وتمنع المراجع الدائرية وتتخلص من أي ميثودز أو خصائص خفية
 */
function flattenToPOJO(obj: any, seen = new WeakSet()): any {
    // 1. التعامل مع القيم البدائية
    if (obj === null || typeof obj !== 'object') {
        return (typeof obj === 'function' || typeof obj === 'symbol') ? undefined : obj;
    }

    // 2. منع المراجع الدائرية
    if (seen.has(obj)) {
        return undefined; // نتخلص من المرجع الدائري بدلاً من وضع علامة نصية لضمان سلامة الـ JSON
    }
    seen.add(obj);

    // 3. التعامل مع المصفوفات
    if (Array.isArray(obj)) {
        return obj.map(item => flattenToPOJO(item, seen)).filter(i => i !== undefined);
    }

    // 4. التعامل مع التواريخ والـ Uint8Array (المستخدم في ملفات الميديا)
    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Uint8Array) return Array.from(obj);

    // 5. بناء كائن جديد كلياً
    const cleanObj: any = {};
    try {
        // نستخدم Object.keys للحصول على الخصائص القابلة للتعداد فقط
        Object.keys(obj).forEach(key => {
            // تخطي الخصائص الداخلية التي قد تبدأ بـ $ أو _ في بعض المكتبات
            if (key.startsWith('$')) return;
            
            const value = obj[key];
            const safeValue = flattenToPOJO(value, seen);
            if (safeValue !== undefined) {
                cleanObj[key] = safeValue;
            }
        });
    } catch (e) {
        return undefined;
    }

    return cleanObj;
}

/**
 * تضمن أن أجزاء الرسالة تتبع الهيكل الدقيق المتوقع من Gemini API فقط
 * وتزيل أي خصائص إضافية قد تضعها المكتبة (مثل thought أو خصائص داخلية)
 */
export const sanitizeParts = (parts: any[]): any[] => {
    if (!parts || !Array.isArray(parts)) return [];
    
    return parts.map(part => {
        const sanitized: any = {};
        
        // Gemini يقبل أنواع محددة فقط من الخصائص في كل جزء
        
        // 1. النصوص
        if (part.text !== undefined && part.text !== null) {
            sanitized.text = String(part.text);
        }
        
        // 2. الميديا (صور/ملفات)
        if (part.inlineData) {
            sanitized.inlineData = {
                mimeType: String(part.inlineData.mimeType || 'image/jpeg'),
                data: String(part.inlineData.data || '')
            };
        }
        
        // 3. طلب استدعاء وظيفة (Function Call)
        if (part.functionCall) {
            sanitized.functionCall = {
                name: String(part.functionCall.name),
                args: flattenToPOJO(part.functionCall.args || {}),
                id: part.functionCall.id ? String(part.functionCall.id) : undefined
            };
        }

        // 4. رد استدعاء وظيفة (Function Response)
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // تطهير السجل بالكامل لضمان عدم وجود مراجع دائرية من طلبات سابقة
    const contents: any[] = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts)
    }));

    const config: any = {
        systemInstruction: String(systemInstruction),
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
    };

    if (tools) {
        // تنظيف التولز قبل تمريرها
        config.tools = flattenToPOJO(tools);
    }

    let response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config,
    });

    let iterations = 0;
    // التعامل مع استدعاءات الوظائف المتكررة (حتى 5 محاولات)
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
                // إضافة رد النموذج الحالي ورد المستخدم (نتائج الوظائف) للسجل المطهّر
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
