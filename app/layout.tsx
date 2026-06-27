import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clara — Assistente Virtual TexFibra',
  description: 'Chat com IA para atendimento comercial — assistente virtual especializada em Manta de Polipropileno',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
