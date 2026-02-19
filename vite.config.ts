
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' must be relative ('./') for Android WebViews to load assets
  base: './', 
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  // هنا نقوم بحل مشكلة "عدم رؤية" المفتاح في Vercel
  // نقوم بتعريف process.env.API_KEY ليكون متاحاً في المتصفح
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
