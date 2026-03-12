# 🔥 Fix: FAILED_PRECONDITION — Firestore Index Errors

## Root Cause

The Cloud Functions (`sendNotification`, `notifyDailyFeatured`, `priceChangeAlert`) were running Firestore queries that combine:
- An equality filter (`==`) on one field
- An inequality filter (`!=`) on another field
- (or) An array-contains filter with additional inequality filters

Firestore requires **composite indexes** for these multi-field queries.
Without them, every call to these functions throws:

```
Error: 9 FAILED_PRECONDITION: The query requires an index.
```

---

## Files Changed

### 1. `firestore.indexes.json` ← **NEW FILE**

Defines 3 composite indexes covering all query patterns:

| Collection | Index Fields |
|---|---|
| `users` | `notificationsEnabled ASC` + `fcmToken ASC` |
| `users` | `notificationsEnabled ASC` + `specialty ASC` + `fcmToken ASC` |
| `users` | `favorites ARRAY_CONTAINS` + `notificationsEnabled ASC` + `fcmToken ASC` |

### 2. `functions/index.js`

Added `.orderBy('fcmToken')` to all queries using `fcmToken != null`.

> **Why?** Firestore requires that when you use `!=` or range filters, the first `orderBy()` must be on the same field. This also ensures the composite index is used correctly.

Affected functions:
- `notifyDailyFeatured` (line ~131)
- `sendNotification` — target `'all'` (line ~179)
- `sendNotification` — target `'specialty'` (line ~190)
- `priceChangeAlert` (line ~267)

### 3. `firestore.rules`

Added missing `notifications_log` collection rule. The `sendNotification` function writes to this collection via Admin SDK (which bypasses client rules), but having the rule explicitly defined prevents confusion and secures client-side reads to admins only.

### 4. `firebase.json` ← **NEW FILE**

Wires up `firestore.rules` and `firestore.indexes.json` so `firebase deploy` picks them up correctly.

---

## How to Deploy the Fix

```bash
# 1. Install Firebase CLI if needed
npm install -g firebase-tools

# 2. Login
firebase login

# 3. Deploy indexes first (takes 2-5 minutes to build in Firebase)
firebase deploy --only firestore:indexes

# 4. Deploy updated functions
firebase deploy --only functions

# 5. (Optional) Deploy rules
firebase deploy --only firestore:rules
```

> ⚠️ **Wait for indexes to finish building** in the Firebase Console before testing.
> Console → Firestore → Indexes tab → wait for all to show ✅ "Enabled"

---

## Verification

After deploying, trigger a test from the Admin Dashboard (send a notification to "all").  
You should see HTTP 200 responses in Cloud Logging instead of 500 errors.

The log pattern should change from:
```
❌ Unhandled error Error: 9 FAILED_PRECONDITION: The query requires an index.
```
to:
```
✅ Notified X devices
```
