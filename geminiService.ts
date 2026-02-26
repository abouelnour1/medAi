
// SDK loaded dynamically - use proxy instead
import { ChatMessage, SerializablePart } from './types';

// ⚠️ API key انتقل للـ Firebase Cloud Function
// الـ client مش محتاج الـ key بعد كده - كل الطلبات بتمشي عبر الـ proxy
function getApiKey(): string {
  // بس للتطوير المحلي لو في key في environment
  if (typeof window !== 'undefined' && (window as any).__DEV_GEMINI_KEY__) {
    return (window as any).__DEV_GEMINI_KEY__;
  }
  return ''; // production: مفيش key في الـ client
}

// الـ AI دايماً متاح - الـ proxy على Vercel شغال بدون key في الـ client
export const isAIAvailable = (_user?: { id: string } | null): boolean => {
  return true; // /api/gemini على Vercel دايماً متاح
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
    modelName: string = 'gemini-2.0-flash-lite'
): Promise<any> => {
    // كل الطلبات بتمشي عبر الـ Vercel proxy
    const { callGeminiProxy } = await import('./utils/geminiProxy');

    const contents = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts).map((p: any) => {
            if (typeof p.text === 'string') return { text: p.text };
            // تنظيف inlineData من الـ history القديمة لتقليل الـ payload
            if (p.inlineData) return p; // نبعت الصور فقط في الـ message الأخير
            return p;
        })
    }));
    
    // نشيل الـ inlineData من كل الـ messages ماعدا الأخيرة
    // عشان نحافظ على حجم الـ request معقول
    const trimmedContents = contents.map((msg, idx) => {
        if (idx === contents.length - 1) return msg; // الأخيرة: نفعل فيها كل حاجة
        return {
            ...msg,
            parts: msg.parts.filter((p: any) => !p.inlineData) // نشيل الصور القديمة
        };
    }).filter(msg => msg.parts.length > 0);

    const finalContents = trimmedContents.length > 0 ? trimmedContents : contents;

    const data = await callGeminiProxy(
        finalContents,
        systemInstruction,
        tools || undefined,
        modelName
    );

    // لو في tool call نعالجه
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const toolCall = parts.find((p: any) => p.functionCall);
    if (toolCall?.functionCall) {
        const { name, args } = toolCall.functionCall;
        const fn = toolImplementations[name];
        if (fn) {
            const toolResult = await fn(args);
            // Gemini بيطلب role: 'function' مش 'tool'
            const secondHistory = [
                ...finalContents,
                { role: 'model', parts },
                { role: 'function', parts: [{ functionResponse: { name, response: { output: toolResult } } }] }
            ];
            const secondData = await callGeminiProxy(secondHistory, systemInstruction, undefined, modelName);
            return secondData;
        }
    }

    // لو error في الـ response نوضحه
    if (data?.error) {
        throw new Error(`Gemini API Error ${data.error.code}: ${data.error.message}`);
    }

    return data;
};
