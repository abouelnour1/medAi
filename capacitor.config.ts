import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ahmed.medai',
  appName: 'medAI',
  webDir: 'dist',
  server: {
    allowNavigation: ['med-ai-taupe.vercel.app'],
    cleartext: true
  }
};

export default config;

