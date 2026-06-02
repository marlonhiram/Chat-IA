import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Suh — Consultora DKN',
  description: 'Chat com a Suh, consultora virtual do Grupo Sul Brasil DKN',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
