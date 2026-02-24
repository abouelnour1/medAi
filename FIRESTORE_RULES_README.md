# ⚠️ مهم جداً - Firestore Security Rules

## المشكلة
لما الأدمن بيحاول يحفظ Clinical Data أو جدول أدوية اليوم، Firebase بترفض الكتابة بسبب الـ Security Rules.

## الحل - خطوتين:

### 1. افتح Firebase Console
https://console.firebase.google.com/project/medainew-fa6a2/firestore/rules

### 2. انسخ والصق الـ Rules دي:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /medicines/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /clinicalData/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /dailyFeatured/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /featuredSchedule/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read, write: if isAdmin();
    }
    
    match /notifications/{docId} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }
    
    match /pendingUpdates/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. اضغط "Publish"

## ملاحظة
لو عايز تتأكد إن المشكلة في الـ Rules:
- افتح Developer Tools → Console
- جرب تحفظ → هتلاقي: `❌ Save clinical data error: permission-denied`

