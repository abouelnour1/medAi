
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' must be relative ('./') for Android WebViews to load assets from file:// android_asset
  base: './', 
  server: {
    host: true, // Allow access via IP address (fixes "localhost refused" on mobile testing)
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
