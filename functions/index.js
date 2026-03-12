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
  { document: 'dailyFeatured/{date}', region: 'us-central1' },
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    if (!after) return;

    const afterMeds = after.medicines?.map(m => m.registerNumber).join(',');
    const beforeMeds = before?.medicines?.map(m => m.registerNumber).join(',');
    if (afterMeds === beforeMeds) return;

    const db = getFirestore();
    const messaging = getMessaging();

    // NOTE: Requires composite index: notificationsEnabled ASC + fcmToken ASC
    // Index defined in firestore.indexes.json
    const usersSnap = await db.collection('users')
      .where('notificationsEnabled', '==', true)
      .where('fcmToken', '!=', null)
      .orderBy('fcmToken')
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

// ============================================
// Send Push Notification — للأدمن
// ============================================
exports.sendNotification = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Must be logged in');

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(request.auth.uid).get();
    if (userDoc.data()?.role !== 'admin') throw new HttpsError('permission-denied', 'Admins only');

    const { title, body, target, data: extraData } = request.data;
    if (!title || !body) throw new HttpsError('invalid-argument', 'title and body required');

    const messaging = getMessaging();

    let tokens = [];

    if (target === 'all') {
      // ابعت لكل المستخدمين
      // NOTE: Requires composite index: notificationsEnabled ASC + fcmToken ASC
      // Index defined in firestore.indexes.json
      const snap = await db.collection('users')
        .where('notificationsEnabled', '==', true)
        .where('fcmToken', '!=', null)
        .orderBy('fcmToken')
        .get();
      tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);

    } else if (target === 'specialty' && extraData?.specialty) {
      // ابعت لـ specialty معينة
      // NOTE: Requires composite index: notificationsEnabled ASC + specialty ASC + fcmToken ASC
      // Index defined in firestore.indexes.json
      const snap = await db.collection('users')
        .where('notificationsEnabled', '==', true)
        .where('specialty', '==', extraData.specialty)
        .where('fcmToken', '!=', null)
        .orderBy('fcmToken')
        .get();
      tokens = snap.docs.map(d => d.data().fcmToken).filter(Boolean);

    } else if (target === 'token' && extraData?.token) {
      tokens = [extraData.token];
    }

    if (tokens.length === 0) return { sent: 0, message: 'No tokens found' };

    let sent = 0;
    for (let i = 0; i < tokens.length; i += 500) {
      const result = await messaging.sendEachForMulticast({
        tokens: tokens.slice(i, i + 500),
        notification: { title, body },
        android: {
          notification: { channelId: 'pharmasource_main', priority: 'high', sound: 'default' }
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } }
        },
        data: { type: extraData?.type || 'general', ...(extraData || {}) }
      });
      sent += result.successCount;

      // احذف الـ tokens المنتهية
      const failed = result.responses
        .map((r, idx) => (!r.success ? tokens[i + idx] : null))
        .filter(Boolean);
      if (failed.length > 0) {
        const batch = db.batch();
        const expiredSnap = await db.collection('users')
          .where('fcmToken', 'in', failed.slice(0, 10))
          .get();
        expiredSnap.docs.forEach(d => batch.update(d.ref, { fcmToken: null, notificationsEnabled: false }));
        await batch.commit();
      }
    }

    // سجّل الإشعار في Firestore
    await db.collection('notifications_log').add({
      title, body, target, sent,
      sentAt: new Date().toISOString(),
      sentBy: request.auth.uid,
    });

    return { sent, total: tokens.length };
  }
);

// ============================================
// Price Change Alert — تلقائي
// لو سعر دواء في favorites المستخدم اتغير
// ============================================
exports.priceChangeAlert = onDocumentWritten(
  { document: 'medicines/{medicineId}', region: 'us-central1' },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!before || !after) return;

    const oldPrice = parseFloat(before['Public price'] || '0');
    const newPrice = parseFloat(after['Public price'] || '0');

    if (oldPrice === newPrice || newPrice === 0) return;

    const db = getFirestore();
    const messaging = getMessaging();

    // لاقي المستخدمين اللي عندهم الدواء ده في favorites
    // NOTE: Requires composite index: favorites ARRAY + notificationsEnabled ASC + fcmToken ASC
    // Index defined in firestore.indexes.json
    const usersSnap = await db.collection('users')
      .where('favorites', 'array-contains', event.params.medicineId)
      .where('notificationsEnabled', '==', true)
      .where('fcmToken', '!=', null)
      .orderBy('fcmToken')
      .get();

    const tokens = usersSnap.docs.map(d => d.data().fcmToken).filter(Boolean);
    if (tokens.length === 0) return;

    const diff = newPrice - oldPrice;
    const arrow = diff > 0 ? '📈' : '📉';
    const direction = diff > 0 ? 'زاد' : 'نقص';

    for (let i = 0; i < tokens.length; i += 500) {
      await messaging.sendEachForMulticast({
        tokens: tokens.slice(i, i + 500),
        notification: {
          title: `${arrow} تغيير سعر — ${after['Trade Name']}`,
          body: `السعر ${direction} من ${oldPrice.toFixed(2)} إلى ${newPrice.toFixed(2)} ر.س`,
        },
        android: { notification: { channelId: 'price_alerts', priority: 'default' } },
        data: {
          type: 'price_change',
          medicineId: event.params.medicineId,
          oldPrice: String(oldPrice),
          newPrice: String(newPrice),
        }
      });
    }

    console.log(`💰 Price alert sent to ${tokens.length} users for ${after['Trade Name']}`);
  }
);
