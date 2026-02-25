/**
 * Gemini Proxy Client
 * بيكلم /api/gemini على Vercel - الـ API key على السيرفر
 */

// على الويب: /api/gemini (Vercel)
// على Android/iOS: URL الـ Vercel المطلق
function getProxyUrl(): string {
  // Capacitor native - بنستخدم الـ absolute URL
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    // نجيب الـ URL من env variable اللي بنحطه في vite.config
    return (import.meta as any).env?.VITE_PROXY_URL || 'https://your-app.vercel.app/api/gemini';
  }
  // ويب: relative URL يشتغل على أي domain
  return '/api/gemini';
}

// ──────────────────────────────────────────
// استدعاء Gemini عبر الـ Vercel Proxy
// ──────────────────────────────────────────
export async function callGeminiProxy(
  history: { role: string; parts: { text: string }[] }[],
  systemInstruction: string,
  tools?: any[],
  model = 'gemini-2.0-flash-lite'
): Promise<any> {
  const res = await fetch(getProxyUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      contents: history,
      systemInstruction: systemInstruction
        ? { parts: [{ text: systemInstruction }] }
        : undefined,
      tools: tools || undefined,
      generationConfig: { temperature: 0.7 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Proxy error ${res.status}: ${err}`);
  }

  return res.json();
}

// ──────────────────────────────────────────
// توليد Clinical Data
// ──────────────────────────────────────────
export async function callGenerateClinical(params: {
  tradeName: string;
  scientificName: string;
  strength: string;
  form: string;
  language: string;
}): Promise<{
  indication: string;
  dosage: string;
  sideEffects: string;
  pharmacistNote: string;
  mechanism?: string;
  keyPoints?: string;
} | null> {
  try {
    const ar = params.language === 'ar';
    const prompt = ar
      ? `أنت صيدلاني سريري خبير. اكتب معلومات سريرية للدواء: ${params.tradeName} (${params.scientificName}) ${params.strength} - ${params.form}.
أجب بـ JSON فقط بهذا الشكل بدون أي نص إضافي:
{"indication":"...","dosage":"...","sideEffects":"...","pharmacistNote":"...","mechanism":"...","keyPoints":"3-4 نقاط مميزة للدواء ومزاياه مقارنة بالبدائل"}`
      : `You are a clinical pharmacist. Write clinical info for: ${params.tradeName} (${params.scientificName}) ${params.strength} - ${params.form}.
Reply with JSON only:
{"indication":"...","dosage":"...","sideEffects":"...","pharmacistNote":"...","mechanism":"...","keyPoints":"3-4 bullet points of key advantages or unique selling points of this medicine vs alternatives"}`;

    const data = await callGeminiProxy(
      [{ role: 'user', parts: [{ text: prompt }] }],
      '',
      undefined,
      'gemini-2.0-flash-lite'
    );

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('generateClinical error:', e);
    return null;
  }
}

// ──────────────────────────────────────────
// الـ proxy دايماً متاح (مش محتاج user)
// ──────────────────────────────────────────
export function isProxyAvailable(): boolean {
  return true; // Vercel endpoint دايماً شغال
}
