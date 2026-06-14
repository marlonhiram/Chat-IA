# AI Chat Widget — Assistente Virtual com IA

Widget de chat com IA para atendimento comercial, desenvolvido com Next.js e Google Gemini.
O assistente virtual classifica intenções, coleta dados do lead progressivamente e encaminha para o representante correto via WhatsApp.

---

## Funcionalidades

- **Arquitetura multi-agente**: agente classificador (Facilitador) roteia para agentes especializados (Comercial, RH, Compras)
- **Coleta progressiva de dados**: nome, cidade, estado e empresa extraídos naturalmente da conversa sem formulários
- **Roteamento regional**: encaminha automaticamente para o representante correto por estado
- **Tags de ação**: sistema de tags (`[WHATSAPP]`, `[DISTRIBUIDOR]`, `[SEG:X]`, `[TRABALHE_CONOSCO]`) para acionar comportamentos no frontend sem lógica extra no cliente
- **Rastreamento de custo**: captura tokens consumidos via `usageMetadata` e calcula custo por sessão em R$
- **Painel de monitoramento**: dashboard em `/painel` para visualizar conversas, filtrar por segmento, marcar resultados (Sucesso/Falha) e adicionar observações
- **CRM plugável**: histórico de conversas salvo automaticamente — Google Sheets por padrão, com suporte planejado para Supabase
- **Web Component**: versão embeddable (`<ai-chat-widget>`) para integração em qualquer site sem conflito de estilos (Shadow DOM)
- **Rate limiting por IP**: 20 mensagens/hora por IP, sem dependência de banco de dados externo
- **Retry com backoff exponencial + jitter**: resiliência a instabilidades da API Gemini (erros 503)
- **Timeout configurado**: função Edge com 30s de timeout via `vercel.json` para conversas longas

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| IA | Google Gemini 2.5 Flash + Gemini 3.1 Flash Lite |
| CRM | Google Sheets API (plugável — ver Supabase abaixo) |
| Deploy | Vercel |
| Widget embeddable | Vite (Web Component / IIFE) |

---

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas credenciais

# 3. Rodar em desenvolvimento
npm run dev
# http://localhost:3000
```

Para compilar o widget embeddable:

```bash
npm run build:widget
# Gera public/chat-widget.iife.js
```

---

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
GEMINI_API_KEY=               # Chave da API do Google Gemini
GOOGLE_SERVICE_ACCOUNT_EMAIL= # Email da service account (Google Cloud)
GOOGLE_PRIVATE_KEY=           # Chave privada PKCS#8 (com aspas duplas na Vercel)
GOOGLE_SHEET_ID=              # ID da planilha do Google Sheets
PAINEL_SENHA=                 # Senha de acesso ao painel de monitoramento
NEXT_PUBLIC_CHAT_API_URL=     # URL base da API (ex: https://seu-projeto.vercel.app)
```

---

## Deploy na Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Configure as variáveis de ambiente no painel da Vercel em **Settings → Environment Variables**.

> **Atenção:** `GOOGLE_PRIVATE_KEY` deve ser salva **com aspas duplas** no valor para processar corretamente as quebras de linha (`"-----BEGIN PRIVATE KEY-----\n..."`).

---

## Integração WordPress / Elementor

Após compilar o widget, adicione ao `<head>` ou rodapé do site:

```html
<script src="https://seu-projeto.vercel.app/chat-widget.iife.js" defer></script>
```

E insira o componente onde quiser no HTML:

```html
<ai-chat-widget></ai-chat-widget>
```

O Shadow DOM garante isolamento total de estilos — sem conflito com o tema WordPress.

---

## Estrutura do projeto

```
├── app/
│   ├── api/
│   │   ├── chat/route.ts       ← Fluxo principal: Facilitador → Agente → CRM
│   │   └── painel/route.ts     ← API do painel de monitoramento
│   ├── painel/page.tsx         ← Dashboard de conversas
│   └── page.tsx                ← Página de demonstração
├── components/
│   └── ChatWidget.tsx          ← Componente React do chat
├── widget/
│   ├── main.tsx                ← Entry point do Web Component
│   └── vite.config.ts          ← Build IIFE para embed externo
├── lib/
│   ├── agents/
│   │   ├── comercial/
│   │   │   ├── contacts.ts     ← Fonte única de representantes e distribuidores
│   │   │   ├── catalog.ts      ← Base de conhecimento do produto
│   │   │   └── index.ts        ← Agente comercial + buildPromptComercial()
│   │   ├── facilitador.ts      ← Classificador de intenção (few-shot, modelo leve)
│   │   ├── rh.ts               ← Agente de RH
│   │   ├── compras.ts          ← Agente de compras/fornecedores
│   │   ├── index.ts            ← Central de agentes
│   │   └── tipos.ts            ← Interfaces TypeScript
│   └── google-sheets.ts        ← Camada de persistência (CRM)
└── .env.local.example          ← Template de variáveis de ambiente
```

---

## Arquitetura de agentes

```
Mensagem do usuário
      ↓
[Rate Limiter] — bloqueia se > 20 msgs/hora por IP
      ↓
Facilitador (gemini-3.1-flash-lite) — modelo leve, baixo custo
  Classifica: comercial | rh | compras | financeiro | transporte | institucional
      ↓
Agente especializado (gemini-2.5-flash) — com histórico completo da conversa
  Comercial → coleta dados → qualifica volume → encaminha representante regional
  RH        → informa processo seletivo e encaminha para RH
  Compras   → encaminha fornecedor para o setor de compras
      ↓
Tags de ação na resposta: [WHATSAPP] [DISTRIBUIDOR] [SEG:X] [TRABALHE_CONOSCO]
      ↓
CRM (Google Sheets / Supabase) — salva sessão, agente, tokens e custo
      ↓
Frontend interpreta tags e renderiza botões contextuais
```

O Facilitador usa um modelo mais leve e barato (`gemini-3.1-flash-lite`) para classificação — o modelo pesado (`gemini-2.5-flash`) só é acionado para a resposta final, reduzindo custo por conversa.

---

## Migração para Supabase

O projeto foi desenhado com a camada de persistência isolada em `lib/google-sheets.ts`.
Para migrar do Google Sheets para o Supabase, basta substituir esse arquivo mantendo a mesma interface:

```typescript
// Interface que deve ser mantida em qualquer implementação de CRM
export async function salvarConversa(dados: { ... }): Promise<void>
export async function lerConversas(): Promise<Conversa[]>
export async function atualizarResultado(linha: number, resultado: string): Promise<void>
export async function atualizarObservacao(linha: number, observacao: string): Promise<void>
```

**Passos para migrar:**

1. Criar projeto no [Supabase](https://supabase.com) e a tabela `conversas`:

```sql
create table conversas (
  id uuid primary key default gen_random_uuid(),
  session_id text unique not null,
  data_hora timestamptz default now(),
  nome text,
  cidade text,
  uf char(2),
  segmento text,
  empresa text,
  total_mensagens int,
  encaminhamento text,
  agente text,
  ip text,
  transcricao text,
  custo_sessao_brl numeric,
  custo_total_brl numeric,
  resultado text,
  observacao text
);
```

2. Adicionar as variáveis de ambiente:

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

3. Instalar o client:

```bash
npm install @supabase/supabase-js
```

4. Reescrever `lib/google-sheets.ts` usando o client do Supabase, mantendo os mesmos exports.
O restante do projeto não precisa de nenhuma alteração.

---

## Personalização

Para adaptar a outro produto/empresa, edite:

| Arquivo | O que mudar |
|---------|-------------|
| `lib/agents/comercial/contacts.ts` | Representantes regionais, distribuidores, suporte técnico |
| `lib/agents/comercial/catalog.ts` | Base de conhecimento do produto |
| `lib/agents/comercial/index.ts` | Regras de comportamento e prompt do agente comercial |
| `lib/agents/facilitador.ts` | Exemplos few-shot para classificação de intenção |
| `lib/agents/rh.ts` | Prompt do agente de RH |
| `lib/agents/compras.ts` | Prompt do agente de compras |
| `components/ChatWidget.tsx` | Textos da interface, cores, logo |

---

## Custo estimado (Gemini 2.5 Flash)

| Volume | Custo/mês (estimado) |
|--------|----------------------|
| 10 conversas/dia | ~R$ 0,30 |
| 100 conversas/dia | ~R$ 3,00 |
| 500 conversas/dia | ~R$ 15,00 |

O painel de monitoramento exibe o custo acumulado em tempo real por sessão.
O Facilitador usa um modelo de custo ~10x menor para classificação, reduzindo o gasto total por conversa.

---

## Licença

MIT
