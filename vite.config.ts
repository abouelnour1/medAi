
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' must be relative ('./') for Android WebViews to load assets from file:// android_asset
  base: './', 
  define: {
    // هذا السطر يربط متغيرات البيئة لتعمل داخل المتصفح
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || process.env.VITE_API_KEY)
  },
  server: {
    host: true, // Allow access via IP address (fixes "localhost refused" on mobile testing)
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
