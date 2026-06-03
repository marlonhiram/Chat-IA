import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '..'),
    },
  },
  define: {
    'process.env.NEXT_PUBLIC_CHAT_API_URL': JSON.stringify(
      process.env.NEXT_PUBLIC_CHAT_API_URL ?? 'https://project-0qgvo.vercel.app'
    ),
  },
  build: {
    lib: {
      entry: 'widget/main.tsx',
      name: 'DknChat',
      fileName: 'chat-widget',
      formats: ['iife'],
    },
    rollupOptions: {
      external: [],
    },
    outDir: 'public',
    emptyOutDir: false,
  },
});