const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getMessaging } = require('firebase-admin/messaging');
const { getFirestore } = require('firebase-admin/firestore');
const { defineSecret } = require('firebase-functions/params');

initializeApp();

// الـ API key محفوظ في Firebase Secret Manager - مش في الكود
const geminiApiKey = defineSecret('GEMINI_API_KEY');

// ============================================
// Gemini Proxy - المستخدم بيكلم الـ Function
// والـ Function هي اللي عندها الـ Key
// ============================================
exports.geminiProxy = onCall(
  { secrets: [geminiApiKey], cors: true },
  async (request) => {
    // التحقق من تسجيل الدخول
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const { history, systemInstruction, tools } = request.data;

    if (!history || !Array.isArray(history)) {
      throw new HttpsError('invalid-argument', 'history is required');
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) throw new HttpsError('internal', 'API key not configured');

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: history,
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction }] }
              : undefined,
            tools: tools || undefined,
            generationConfig: { temperature: 0.7 }
          })
        }
      );

      if (!response.ok) {
        const err = await response.text();
        console.error('Gemini error:', err);
        throw new HttpsError('internal', 'Gemini API error');
      }

      const data = await response.json();
      return { result: data };

    } catch (e) {
      console.error('geminiProxy error:', e);
      throw new HttpsError('internal', String(e));
    }
  }
);

// ============================================
// Clinical Data Generator
// ============================================
exports.generateClinical = onCall(
  { secrets: [geminiApiKey], cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const { tradeName, scientificName, strength, form, language } = request.data;
    if (!tradeName) throw new HttpsError('invalid-argument', 'tradeName required');

    const apiKey = geminiApiKey.value();
    const ar = language === 'ar';

    const prompt = ar
      ? `أنت صيدلاني سريري خبير. اكتب معلومات سريرية للدواء: ${tradeName} (${scientificName}) ${strength} - ${form}.
         أجب بـ JSON فقط بهذا الشكل بدون أي نص إضافي:
         {"indication":"...","dosage":"...","sideEffects":"...","pharmacistNote":"...","mechanism":"..."}`
      : `You are a clinical pharmacist. Write clinical info for: ${tradeName} (${scientificName}) ${strength} - ${form}.
         Reply with JSON only:
         {"indication":"...","dosage":"...","sideEffects":"...","pharmacistNote":"...","mechanism":"..."}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
        })
      }
    );

    if (!response.ok) throw new HttpsError('internal', 'Gemini error');
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      return { clinical: parsed };
    } catch {
      throw new HttpsError('internal', 'Invalid JSON from Gemini');
    }
  }
);

// ============================================
// Push Notifications - أدوية اليوم
// ============================================
exports.notifyDailyFeatured = onDocumentWritten(
  'dailyFeatured/{date}',
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    if (!after) return;

    const afterMeds = after.medicines?.map(m => m.registerNumber).join(',');
    const beforeMeds = before?.medicines?.map(m => m.registerNumber).join(',');
    if (afterMeds === beforeMeds) return;

    const db = getFirestore();
    const messaging = getMessaging();

    const usersSnap = await db.collection('users')
      .where('notificationsEnabled', '==', true)
      .where('fcmToken', '!=', null)
      .get();

    const tokens = usersSnap.docs.map(d => d.data().fcmToken).filter(Boolean);
    if (tokens.length === 0) return;

    const medicines = after.medicines || [];
    const names = medicines.slice(0, 3).map(m => m.tradeName).join(' · ');
    const body = medicines[0]?.clinicalData?.indication?.slice(0, 100) || names;

    for (let i = 0; i < tokens.length; i += 500) {
      await messaging.sendEachForMulticast({
        tokens: tokens.slice(i, i + 500),
        notification: { title: '💊 أدوية اليوم - PharmaSource', body },
        android: { notification: { channelId: 'daily_featured', priority: 'high' } },
        data: { type: 'daily_featured', date: event.params.date }
      });
    }
    console.log(`✅ Notified ${tokens.length} devices`);
  }
);
