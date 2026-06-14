import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '[AGENTE] — Assistente Virtual',
  description: 'Chat com IA para atendimento comercial — assistente virtual especializado em [PRODUTO]',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
