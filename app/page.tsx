'use client';

import { ChatWidget } from '@/components/ChatWidget';

export default function Home() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#f0f4f8',
      fontFamily: "'Nunito', -apple-system, sans-serif",
    }}>
      <ChatWidget />
    </main>
  );
}