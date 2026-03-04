const DB_NAME    = 'PharmaSourceDB';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB not supported')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { _db = req.result; resolve(req.result); };
    req.onupgradeneeded = e => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
  });
}

export async function setItem(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve();          // ← نستنى الـ transaction كامل
      tx.onerror    = () => reject(tx.error);
      tx.onabort    = () => reject(tx.error);
    });
  } catch (e) {
    console.error('[storage] setItem failed:', key, e);
  }
}

export async function getItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req   = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => reject(req.error);
    });
  } catch (e) {
    console.error('[storage] getItem failed:', key, e);
    return null;
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx    = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch (e) {
    console.error('[storage] removeItem failed:', key, e);
  }
}
