/**
 * Test endpoint للـ Push Notifications
 * اتصل بـ: POST /api/test-push
 * Body: { "userId": "xxx", "title": "Test", "body": "Hello" }
 * 
 * يتأكد إن Firebase Admin + FCM شغالين صح
 */

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  // GET: health check
  if (req.method === 'GET') {
    const checks = {
      endpoint: '✅ /api/test-push reachable',
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID ? '✅ set' : '❌ FIREBASE_PROJECT_ID missing',
      firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL ? '✅ set' : '❌ FIREBASE_CLIENT_EMAIL missing',
      firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY ? '✅ set' : '❌ FIREBASE_PRIVATE_KEY missing',
      geminiApiKey: (process.env.VITE_API_KEY || process.env.GEMINI_API_KEY) ? '✅ set' : '❌ VITE_API_KEY missing',
      timestamp: new Date().toISOString(),
    };
    return new Response(JSON.stringify(checks, null, 2), { status: 200, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const fcmToken = body.fcmToken;
  const title    = body.title || '🧪 Easy Drug Test';
  const bodyText = body.body  || 'Push notification is working!';

  if (!fcmToken) {
    return new Response(JSON.stringify({
      error: 'fcmToken required',
      hint: 'Get the token from Firestore → users → {userId} → fcmToken field'
    }), { status: 400, headers: cors });
  }

  // نجيب الـ FCM Service Account credentials
  const projectId    = process.env.FIREBASE_PROJECT_ID;
  const clientEmail  = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey   = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    return new Response(JSON.stringify({
      error: 'Firebase credentials missing',
      missing: {
        FIREBASE_PROJECT_ID: !projectId,
        FIREBASE_CLIENT_EMAIL: !clientEmail,
        FIREBASE_PRIVATE_KEY: !privateKey,
      },
      hint: 'Add these to Vercel Environment Variables from Firebase Console → Project Settings → Service Accounts'
    }), { status: 500, headers: cors });
  }

  try {
    // نعمل JWT للـ Google Auth
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    };

    // نعمل JWT signature باليد (Edge runtime مش عنده jsonwebtoken)
    const header  = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const toSign  = `${header}.${payloadB64}`;

    // نعمل RS256 signature
    const key = await crypto.subtle.importKey(
      'pkcs8',
      str2ab(privateKey),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    );
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign));
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jwt = `${toSign}.${sigB64}`;

    // نجيب access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
    });
    const tokenData = await tokenRes.json() as any;
    if (!tokenData.access_token) {
      return new Response(JSON.stringify({ error: 'Failed to get access token', details: tokenData }), { status: 500, headers: cors });
    }

    // نبعت الـ push notification
    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: fcmToken,
            notification: { title, body: bodyText },
            data: { click_action: 'FLUTTER_NOTIFICATION_CLICK', url: '/' },
            android: { priority: 'high', notification: { sound: 'default', channel_id: 'easydrug' } },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
          }
        })
      }
    );

    const fcmData = await fcmRes.json() as any;

    if (fcmRes.ok) {
      return new Response(JSON.stringify({
        success: true,
        message: '✅ Push notification sent successfully!',
        messageId: fcmData.name,
      }), { status: 200, headers: cors });
    } else {
      return new Response(JSON.stringify({
        error: 'FCM send failed',
        details: fcmData,
        hint: fcmData?.error?.message?.includes('registration-token-not-registered')
          ? 'Token expired. User needs to re-enable notifications in the app.'
          : 'Check FCM token and Firebase credentials.'
      }), { status: 400, headers: cors });
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Exception', message: e?.message }), { status: 500, headers: cors });
  }
}

function str2ab(str: string): ArrayBuffer {
  const pem = str.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
  const binary = atob(pem);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}
