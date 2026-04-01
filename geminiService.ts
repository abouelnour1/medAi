/**
 * geminiService.ts
 *
 * ويب (Vercel)  → يتصل بـ /api/gemini  (API key على السيرفر، آمن تماماً)
 * أندرويد      → يتصل بـ VITE_PROXY_URL (نفس الـ Vercel endpoint)
 *
 * مفيش API key في الكود ولا في الـ APK — كله على Vercel.
 */

import { ChatMessage, SerializablePart } from './types';

// ──────────────────────────────────────────────────────────────────────
// هل الـ AI متاح؟ — دايماً true لأن الـ proxy شغال
// ──────────────────────────────────────────────────────────────────────
export const isAIAvailable = (_user?: { id: string } | null): boolean => true;

// ──────────────────────────────────────────────────────────────────────
// sanitize الـ parts قبل الإرسال
// ──────────────────────────────────────────────────────────────────────
const safeClone = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(safeClone);
  const clone: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      if (typeof val === 'function') continue;
      clone[key] = safeClone(val);
    }
  }
  return clone;
};

export const sanitizeParts = (parts: any[]): SerializablePart[] => {
  if (!parts || !Array.isArray(parts)) return [];
  return parts.map(p => {
    const part: SerializablePart = {};
    if (p.text) part.text = p.text;
    if (p.inlineData) part.inlineData = { mimeType: p.inlineData.mimeType, data: p.inlineData.data };
    if (p.functionCall) part.functionCall = { name: p.functionCall.name, args: safeClone(p.functionCall.args), id: p.functionCall.id };
    if (p.functionResponse) part.functionResponse = { name: p.functionResponse.name, response: safeClone(p.functionResponse.response), id: p.functionResponse.id };
    return part;
  }).filter(p => Object.keys(p).length > 0);
};

// ──────────────────────────────────────────────────────────────────────
// URL الـ proxy
// ويب:      /api/gemini  (relative — نفس الـ Vercel domain)
// أندرويد:  VITE_PROXY_URL  (e.g. https://your-app.vercel.app/api/gemini)
// ──────────────────────────────────────────────────────────────────────
function getProxyUrl(): string {
  const isNative = typeof window !== 'undefined' &&
    (window as any).Capacitor?.isNativePlatform?.();

  if (isNative) {
    // أندرويد: لازم URL كامل — حطه في .env.local
    const url = (import.meta as any).env?.VITE_PROXY_URL;
    if (!url || url.includes('your-app')) {
      console.warn('[Easy Drug] ⚠️ VITE_PROXY_URL غير مضبوط في .env.local');
    }
    return url || 'https://your-app.vercel.app/api/gemini';
  }

  // ويب: relative URL — يشتغل على أي domain تلقائياً
  return '/api/gemini';
}

// ──────────────────────────────────────────────────────────────────────
// الـ function الرئيسية
// ──────────────────────────────────────────────────────────────────────
export const runAIChat = async (
  history: ChatMessage[],
  systemInstruction: string,
  tools: any[],
  toolImplementations: { [key: string]: (...args: any[]) => any },
  modelName: string = 'gemini-2.0-flash-lite',
  userId?: string,
  userRole?: string,
): Promise<any> => {
  const { callGeminiProxy } = await import('./utils/geminiProxy');

  const contents = history.map((msg, idx) => {
    const isLast = idx === history.length - 1;
    const rawParts = sanitizeParts(msg.parts);
    // نشيل الصور من الـ history القديمة عشان ما يكبرش الـ request
    const parts = isLast ? rawParts : rawParts.filter((p: any) => !p.inlineData);
    return { role: msg.role, parts };
  }).filter(m => m.parts.length > 0);

  const data = await callGeminiProxy(contents as any, systemInstruction, tools || undefined, modelName, userId, userRole);

  if (data?.error) {
    throw new Error(`Gemini: ${data.error.message || JSON.stringify(data.error)}`);
  }

  // لو في function call
  const respParts = data?.candidates?.[0]?.content?.parts || [];
  const toolCall = respParts.find((p: any) => p.functionCall);

  if (toolCall?.functionCall) {
    const { name, args } = toolCall.functionCall;
    const fn = toolImplementations[name];
    if (fn) {
      let toolResult: any;
      try { toolResult = await fn(args); } catch (e) { toolResult = { error: String(e) }; }

      const secondData = await callGeminiProxy(
        [
          ...contents,
          { role: 'model', parts: respParts },
          { role: 'function', parts: [{ functionResponse: { name, response: { output: toolResult } } }] },
        ] as any,
        systemInstruction,
        undefined,
        modelName,
        userId,
        userRole,
      );
      if (secondData?.error) throw new Error(`Gemini: ${secondData.error.message}`);
      return secondData;
    }
  }

  return data;
};
