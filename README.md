# DKN Chat — Suh, Consultora Virtual

Chat com IA para o Grupo Sul Brasil DKN.
Powered by Gemini 2.5 Flash (Google).

---

## Pré-requisitos

- Node.js 18 ou superior
- Conta no Google AI Studio (para a chave do Gemini)
- Conta na Vercel (para deploy)

---

## Instalação local

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo de variáveis de ambiente
cp .env.local.example .env.local

# 3. Editar .env.local e colocar sua chave do Gemini
# GEMINI_API_KEY=sua_chave_aqui

# 4. Rodar em desenvolvimento
npm run dev

# 5. Abrir no navegador
# http://localhost:3000
```

---

## Deploy na Vercel

```bash
# 1. Instalar CLI da Vercel (se não tiver)
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Deploy
vercel

# 4. Configurar variável de ambiente na Vercel
# Painel Vercel → Projeto → Settings → Environment Variables
# Nome: GEMINI_API_KEY
# Valor: sua chave do Gemini
```

---

## Estrutura do projeto

```
dkn-chat/
├── app/
│   ├── api/chat/route.ts   ← Servidor — chama o Gemini
│   ├── layout.tsx
│   ├── page.tsx            ← Página de teste
│   └── globals.css
├── components/
│   └── ChatWidget.tsx      ← Componente do chat (Suh)
└── lib/
    └── agents/
        ├── tipos.ts        ← Interfaces TypeScript
        ├── facilitador.ts  ← Classifica a mensagem
        ├── comercial.ts    ← Agente Suh (TNT)
        └── index.ts        ← Central dos agentes
```

---

## Agentes disponíveis

| Agente | Status | Função |
|--------|--------|--------|
| Facilitador | ✅ Ativo | Classifica a mensagem |
| Suh (Comercial) | ✅ Ativo | Especialista em TNT |
| Financeiro | 🔜 Em breve | Orientações financeiras |
| RH | 🔜 Em breve | Vagas e RH |
| Transporte | 🔜 Em breve | Logística e entregas |

---

## Custo estimado

| Volume | Custo/mês |
|--------|-----------|
| 10 conversas/dia | ~R$ 0,30 |
| 100 conversas/dia | ~R$ 3,00 |
| 500 conversas/dia | ~R$ 15,00 |

Modelo: Gemini 2.5 Flash
