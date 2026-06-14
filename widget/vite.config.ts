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
  'process.env.NODE_ENV': JSON.stringify('production'),
  'process.env.NEXT_PUBLIC_CHAT_API_URL': JSON.stringify(
    process.env.NEXT_PUBLIC_CHAT_API_URL ?? ''
    ),
  },
  build: {
    lib: {
      entry: 'widget/main.tsx',
      name: 'AiChatWidget',
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