
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

// الـ AI متاح لو في user (بيستخدم الـ proxy) أو في API key محلي
export const isAIAvailable = (user?: { id: string } | null): boolean => {
  if (user) return true; // الـ proxy شغال
  const apiKey = getApiKey();
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
    modelName: string = 'gemini-2.0-flash-lite'
): Promise<any> => {
    // كل الطلبات بتمشي عبر الـ Vercel proxy
    const { callGeminiProxy } = await import('./utils/geminiProxy');

    const contents = history.map(msg => ({
        role: msg.role,
        parts: sanitizeParts(msg.parts).map((p: any) =>
            typeof p.text === 'string' ? { text: p.text } : p
        )
    }));

    const data = await callGeminiProxy(
        contents,
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
            // بنعمل second call مع النتيجة
            const secondHistory = [
                ...contents,
                { role: 'model', parts },
                { role: 'tool', parts: [{ functionResponse: { name, response: toolResult } }] }
            ];
            const secondData = await callGeminiProxy(secondHistory, systemInstruction, undefined, modelName);
            return secondData;
        }
    }

    return data;
};
