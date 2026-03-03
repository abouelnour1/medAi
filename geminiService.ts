import { ChatMessage, SerializablePart } from './types';

export const isAIAvailable = (_user?: { id: string } | null): boolean => true;

function flattenToPOJO(obj: any, seen = new WeakSet()): any {
    if (obj === null || typeof obj !== 'object') {
        return (typeof obj === 'function' || typeof obj === 'symbol') ? undefined : obj;
    }
    if (seen.has(obj)) return undefined;
    seen.add(obj);
    if (Array.isArray(obj)) return obj.map(i => flattenToPOJO(i, seen)).filter(i => i !== undefined);
    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Uint8Array) return Array.from(obj);
    const out: any = {};
    try {
        Object.keys(obj).forEach(k => {
            if (k.startsWith('$')) return;
            const v = flattenToPOJO(obj[k], seen);
            if (v !== undefined) out[k] = v;
        });
    } catch { return undefined; }
    return out;
}

export const sanitizeParts = (parts: any[]): any[] => {
    if (!parts || !Array.isArray(parts)) return [];
    return parts.map(part => {
        const s: any = {};
        if (part.text !== undefined && part.text !== null) s.text = String(part.text);
        if (part.inlineData) s.inlineData = {
            mimeType: String(part.inlineData.mimeType || 'image/jpeg'),
            data: String(part.inlineData.data || '')
        };
        if (part.functionCall) s.functionCall = {
            name: String(part.functionCall.name),
            args: flattenToPOJO(part.functionCall.args || {})
        };
        if (part.functionResponse) s.functionResponse = {
            name: String(part.functionResponse.name),
            response: flattenToPOJO(part.functionResponse.response || {})
        };
        return s;
    }).filter(p => Object.keys(p).length > 0);
};

export const runAIChat = async (
    history: ChatMessage[],
    systemInstruction: string,
    tools: any[] | null,
    toolImplementations: Record<string, Function>,
    modelName = 'gemini-2.0-flash-lite',
    userId?: string,
    userRole?: string,
): Promise<any> => {
    const { callGeminiProxy } = await import('./utils/geminiProxy');

    // بناء الـ contents - نشيل الصور من الـ history القديمة
    const contents = history.map((msg, idx) => {
        const isLast = idx === history.length - 1;
        const rawParts = sanitizeParts(msg.parts);
        const parts = isLast
            ? rawParts
            : rawParts.filter((p: any) => !p.inlineData);
        return { role: msg.role, parts };
    }).filter(m => m.parts.length > 0);

    // الـ first call
    const data = await callGeminiProxy(contents, systemInstruction, tools || undefined, modelName, userId, userRole);

    // لو في error من Gemini
    if (data?.error) {
        throw new Error(`Gemini: ${data.error.message || JSON.stringify(data.error)}`);
    }

    // لو في function call نعالجه
    const respParts = data?.candidates?.[0]?.content?.parts || [];
    const toolCall = respParts.find((p: any) => p.functionCall);

    if (toolCall?.functionCall) {
        const { name, args } = toolCall.functionCall;
        const fn = toolImplementations[name];
        if (fn) {
            let toolResult: any;
            try { toolResult = await fn(args); } catch (e) { toolResult = { error: String(e) }; }

            const secondContents = [
                ...contents,
                { role: 'model', parts: respParts },
                {
                    role: 'function',
                    parts: [{ functionResponse: { name, response: { output: toolResult } } }]
                }
            ];

            const secondData = await callGeminiProxy(secondContents, systemInstruction, undefined, modelName, userId, userRole);
            if (secondData?.error) throw new Error(`Gemini: ${secondData.error.message}`);
            return secondData;
        }
    }

    return data;
};
