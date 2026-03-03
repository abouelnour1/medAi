/**
 * Vercel Serverless Function - Gemini Proxy
 * مع Rate Limiting حقيقي على السيرفر لكل مستخدم
 */

export const config = { runtime: 'edge' };

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// ── Rate Limit Settings ──────────────────────────────────────────────
// كل مستخدم عنده DAILY_LIMIT طلب في اليوم
// الأدمن عنده ADMIN_LIMIT
const DAILY_LIMIT = 10;
const ADMIN_LIMIT = 200;

// In-memory store للـ Edge runtime (بيتمسح كل deploy لكن كافي كـ first layer)
// للـ production الصح محتاج KV Store زي Vercel KV أو Upstash
const rateLimitStore = new Map<string, { count: number; date: string }>();

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function checkRateLimit(userId: string, isAdmin: boolean): {
  allowed: boolean;
  remaining: number;
  limit: number;
} {
  const limit = isAdmin ? ADMIN_LIMIT : DAILY_LIMIT;
  const today = getTodayDate();
  const key = `${userId}:${today}`;

  const current = rateLimitStore.get(key) || { count: 0, date: today };

  // يوم جديد — reset
  if (current.date !== today) {
    rateLimitStore.set(key, { count: 0, date: today });
    return { allowed: true, remaining: limit - 1, limit };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  // زوّد العداد
  rateLimitStore.set(key, { count: current.count + 1, date: today });
  return { allowed: true, remaining: limit - current.count - 1, limit };
}

export default async function handler(req: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-User-Id, X-User-Role',
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

  // ── API Key ──────────────────────────────────────────────────────
  const apiKey = process.env.VITE_API_KEY
    || process.env.GEMINI_API_KEY
    || process.env.API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'API_KEY_MISSING',
      message: 'Add VITE_API_KEY to Vercel Environment Variables'
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // ── Parse body ───────────────────────────────────────────────────
  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'INVALID_JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const {
    contents, systemInstruction, tools, generationConfig,
    model = 'gemini-2.0-flash-lite',
    userId,
    userRole,
  } = body;

  if (!contents || !Array.isArray(contents)) {
    return new Response(JSON.stringify({ error: 'INVALID_BODY', message: 'contents array is required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // ── Rate Limiting ────────────────────────────────────────────────
  const isAdmin = userRole === 'admin';
  const userKey = userId || req.headers.get('cf-connecting-ip') || 'anonymous';
  const rateCheck = checkRateLimit(userKey, isAdmin);

  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({
      error: 'QUOTA_EXCEEDED',
      message: `لقد استنفدت حد الطلبات اليومي (${rateCheck.limit} طلب). يتجدد غداً.`,
      message_en: `Daily limit reached (${rateCheck.limit} requests). Resets tomorrow.`,
      limit: rateCheck.limit,
      remaining: 0,
    }), {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(rateCheck.limit),
        'X-RateLimit-Remaining': '0',
        'Retry-After': '86400',
      }
    });
  }

  // ── Call Gemini ──────────────────────────────────────────────────
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

    // retry مرة واحدة على 503
    if (geminiRes.status === 503) {
      await new Promise(r => setTimeout(r, 1000));
      geminiRes = await callGemini();
    }

    // لو Gemini نفسه قال 429 (quota على مستوى الـ API key كلها)
    if (geminiRes.status === 429) {
      return new Response(JSON.stringify({
        error: 'SERVICE_QUOTA_EXCEEDED',
        message: 'الخدمة مشغولة حالياً، حاول بعد قليل.',
        message_en: 'Service temporarily busy, please try again in a few minutes.',
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
      });
    }

    const data = await geminiRes.json();

    if (data.error) {
      return new Response(JSON.stringify({
        error: 'GEMINI_ERROR',
        code: data.error.code,
        message: data.error.message,
        status: data.error.status,
      }), { status: geminiRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      ...data,
      _rateLimit: { remaining: rateCheck.remaining, limit: rateCheck.limit },
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(rateCheck.limit),
        'X-RateLimit-Remaining': String(rateCheck.remaining),
      },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({
      error: 'NETWORK_ERROR',
      message: e?.message || 'Failed to reach Gemini API',
    }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}
