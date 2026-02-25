/**
 * Vercel Serverless Function - Gemini Proxy
 * يحل مشكلة communication error بـ:
 * 1. Better error messages
 * 2. Retry logic
 * 3. Proper CORS للـ Capacitor
 */

export const config = { runtime: 'edge' };

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export default async function handler(req: Request) {
  const origin = req.headers.get('origin') || '*';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ── API Key ──────────────────────────────
  const apiKey = process.env.VITE_API_KEY
    || process.env.GEMINI_API_KEY
    || process.env.API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'API_KEY_MISSING',
      message: 'Add VITE_API_KEY to Vercel Environment Variables'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // ── Parse body ───────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'INVALID_JSON', message: 'Request body must be valid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { contents, systemInstruction, tools, generationConfig, model = 'gemini-2.0-flash-lite' } = body;

  if (!contents || !Array.isArray(contents)) {
    return new Response(JSON.stringify({ error: 'INVALID_BODY', message: 'contents array is required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ── Call Gemini (مع retry مرة) ───────────
  const callGemini = async () => {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`;
    const payload: any = { contents };
    if (systemInstruction) payload.systemInstruction = systemInstruction;
    if (tools) payload.tools = tools;
    if (generationConfig) payload.generationConfig = generationConfig;

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  };

  try {
    let geminiRes = await callGemini();

    // retry مرة واحدة على 503 أو 429
    if (geminiRes.status === 503 || geminiRes.status === 429) {
      await new Promise(r => setTimeout(r, 1000));
      geminiRes = await callGemini();
    }

    const data = await geminiRes.json();

    // لو Gemini رجع error نوضحه
    if (data.error) {
      return new Response(JSON.stringify({
        error: 'GEMINI_ERROR',
        code: data.error.code,
        message: data.error.message,
        status: data.error.status,
      }), { status: geminiRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({
      error: 'NETWORK_ERROR',
      message: e?.message || 'Failed to reach Gemini API',
    }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
