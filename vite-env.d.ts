interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_VAPID_KEY?: string;
  readonly VITE_PROXY_URL?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
