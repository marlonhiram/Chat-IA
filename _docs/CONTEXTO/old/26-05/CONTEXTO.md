# CONTEXTO DO PROJETO — DKN Chat com Agentes de IA
> Última atualização: 22/05/2026

## 1. Visão Geral

Chat de IA para o site do Grupo Sul Brasil DKN. Assistente virtual com persona "Suh" responde dúvidas técnicas e comerciais sobre TNT, coleta dados do lead progressivamente e encaminha para representante regional via WhatsApp. Projeto isolado do site Next.js original (não aprovado) e hospedado na Vercel. Integração futura prevista com WordPress via iframe/widget.

**Empresa**: Grupo Sul Brasil DKN — indústria de Tecido Não-Tecido (TNT), Caçador/SC, fundada em 1992, certificada ABNT NBR ISO 9001:2015. ERP Delphi 7 legado, sem API disponível.

**URL produção**: https://project-0qgvo.vercel.app
**Painel de monitoramento**: https://project-0qgvo.vercel.app/painel

---

## 2. Contas e Serviços

| Serviço | Conta | Finalidade |
|---|---|---|
| Vercel | yurnero14 | Hospedagem do chat |
| Google AI Studio | — | Chave da API Gemini |
| Google Cloud | projeto `dkn-chat` | Service Account para Sheets |
| Google Sheets | yurnero14@gmail.com | Histórico de conversas + métricas |

**Planilha**: DKN Chat — Histórico de Conversas
**Sheet ID**: `1lM0SyPl-vRG9o7FPikDEcKzoS5h8uoNW7NlwYpZxHP0`

---

## 3. Stack Técnica

- **Framework**: Next.js 14.2.3 (App Router)
- **Linguagem**: TypeScript
- **Modelo de IA**: Gemini 2.5 Flash (Google)
- **Hospedagem**: Vercel (plano Hobby — limite de 10s por função serverless, 30s para /api/chat via vercel.json)
- **Runtime Node.js na Vercel**: 20.x
- **Histórico de conversas**: Google Sheets via googleapis SDK

---

## 4. Variáveis de Ambiente

| Variável | Onde | Observação |
|---|---|---|
| `GEMINI_API_KEY` | `.env.local` + Vercel | Chave da API Gemini |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `.env.local` + Vercel | Email da service account |
| `GOOGLE_PRIVATE_KEY` | `.env.local` + Vercel | Com aspas duplas no valor na Vercel |
| `GOOGLE_SHEET_ID` | `.env.local` + Vercel | ID da planilha de histórico |
| `PAINEL_SENHA` | `.env.local` + Vercel | Senha de acesso ao painel (`dkn2024`) |

**Atenção**: `GOOGLE_PRIVATE_KEY` deve ser salva **com aspas duplas** no painel da Vercel para processar corretamente as quebras de linha `\n`.

---

## 5. Arquitetura e Design de Sistema

Arquitetura em duas etapas paralelas: Facilitador classifica a mensagem enquanto o agente Comercial já começa a processar simultaneamente, reduzindo latência total para ~3-4s.

```
Request → Facilitador + Comercial (paralelo via Promise.allSettled)
        ↓
Se tipo == 'comercial' → usa resposta do Comercial já pronta
Se tipo != 'comercial' → chama agente correto (sequencial)
        ↓
Salva conversa no Google Sheets (await — não em background)
        ↓
Retorna resposta ao frontend com uso de tokens e custo acumulado da sessão
```

Agentes definidos como objetos TypeScript em `lib/agents/`. Sem framework externo. Cada agente é independente.

**Regra operacional**: Nenhum código, arquivo ou relatório deve ser gerado sem consultar o responsável primeiro. Toda alteração deve ser cirúrgica — indicando exatamente qual arquivo, como está e como deve ficar.

**5 camadas de segurança**:
1. Rate limiting por IP (20 msgs/hora, janela de 60min)
2. Validação de qualidade da mensagem (mín. 2 chars, sem repetição, sem só símbolos)
3. Proteção contra prompt injection (8 padrões regex)
4. Anti-alucinação no prompt (regras explícitas + temperatura 0.2)
5. Timeout (9s) + histórico limitado (últimas 10 mensagens)

---

## 6. Banco de Dados

Não há banco de dados relacional. Histórico de conversas salvo em Google Sheets.

**Estrutura da planilha** (colunas A a O):

| Col | Campo |
|---|---|
| A | Session ID |
| B | Data/Hora |
| C | Nome |
| D | Cidade |
| E | UF |
| F | Segmento |
| G | Empresa |
| H | Total Mensagens |
| I | Encaminhamento |
| J | Agente |
| K | IP |
| L | Transcrição |
| M | Custo Sessão (R$) |
| N | Custo Total Acumulado (R$) |
| O | Resultado (Sucesso/Falha) |

- Uma linha por sessão, atualizada a cada mensagem
- Session ID gerado no frontend: `sess_${Date.now()}_${random}`
- Busca por Session ID na coluna A para decidir criar ou atualizar linha
- Coluna O preservada ao atualizar (não sobrescrita pelo código)

---

## 7. Autenticação e Permissões

Sem autenticação de usuário no chat. Proteção via rate limiting por IP.

Painel de monitoramento (`/painel`) protegido por senha simples via header `x-painel-senha`. Senha definida na variável `PAINEL_SENHA`.

Google Sheets autenticado via `google.auth.GoogleAuth` com service account (chave PKCS#8 `BEGIN PRIVATE KEY`).

---

## 8. Integrações Externas

**Gemini 2.5 Flash (Google)**
- Finalidade: geração de respostas e classificação de intenção
- Chamada: REST direto (`fetch` para `generativelanguage.googleapis.com`)
- Credencial: `GEMINI_API_KEY`
- Retry automático: 3 tentativas com backoff exponencial (500ms, 1000ms) em caso de erro 503
- Captura `usageMetadata` (promptTokenCount, candidatesTokenCount) para cálculo de custo
- Loga `finishReason` quando diferente de `STOP` para detectar cortes por MAX_TOKENS
- Fallback: mensagem de erro + botão WhatsApp na 2ª falha consecutiva

**Google Sheets API**
- Finalidade: salvar histórico de conversas e métricas de custo
- Chamada: SDK `googleapis` v4
- Credencial: `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`
- Falha silenciosa: erro logado no console, não afeta resposta ao usuário

**WhatsApp (links diretos)**
- Finalidade: encaminhar cliente para representante ou suporte
- Link extraído da resposta da Suh (regex sobre `wa.me` e `api.whatsapp.com`)
- Fallback do link: número da Andreia (`554935611505`) se nenhum link encontrado
- Mensagem pré-preenchida montada dinamicamente com dados coletados na conversa

---

## 9. Estrutura de Pastas

```
dkn-chat/
├── .env.local
├── .gitignore
├── .node-version
├── next.config.js
├── package.json
├── tsconfig.json
├── vercel.json            (maxDuration: 30s para /api/chat)
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts       (servidor principal + captura de tokens)
│   │   └── painel/
│   │       └── route.ts       (GET: lê conversas | PATCH: atualiza resultado)
│   ├── painel/
│   │   └── page.tsx           (painel de monitoramento com senha)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ChatWidget.tsx         (componente React + monitor de custo da sessão)
├── lib/
│   ├── agents/
│   │   ├── comercial.ts       (prompt da Suh — tokens_max: 3072, temperatura: 0.2)
│   │   ├── facilitador.ts     (classificador — tokens_max: 150, temperatura: 0.1)
│   │   ├── index.ts
│   │   └── tipos.ts
│   └── google-sheets.ts       (salvarConversa + lerConversas + atualizarResultado)
└── scripts/
    ├── testar-suh.mjs
    └── testar-conversas.mjs
```

---

## 10. Fluxos Implementados

**Fluxo principal (mensagem do usuário)**
1. Frontend envia `{ messages, sessionId, custoSessaoUSD }` para `POST /api/chat`
2. Rate limiting valida IP
3. Validação de qualidade filtra mensagens com menos de 2 chars ou inválidas
4. Regex bloqueia prompt injection
5. Facilitador + Comercial chamados em paralelo
6. Tokens consumidos capturados via `usageMetadata`
7. Custo da sessão calculado e acumulado (USD → R$ câmbio 5,50)
8. Resposta retornada ao frontend com `uso: { inputTokens, outputTokens, custoSessaoUSD }`
9. Conversa salva/atualizada no Google Sheets com custo

**Fluxo de encaminhamento**
- Suh coleta nome → cidade/estado → empresa progressivamente (todos na primeira resposta)
- Ao detectar intenção de compra: informa pedido mínimo R$10.000 antes de encaminhar
- Se cliente não souber especificações técnicas: encaminha representante imediatamente
- Encaminha representante por estado (SP/PR/SC) ou Andreia (demais)
- Link WhatsApp extraído da resposta da Suh — usa número correto do representante

**Fluxo de fallback**
- 1ª falha técnica: "pode enviar sua mensagem novamente"
- 2ª falha consecutiva: "dificuldades técnicas" + botão WhatsApp para Andreia
- Dúvida sem resposta na base: encaminha Andreia + [WHATSAPP]
- Cliente pede atendente humano + tem estado coletado: encaminha representante imediatamente

**Painel de monitoramento**
- Acesso via `/painel` com senha
- Exibe métricas: total sessões, sucessos, falhas, taxa de sucesso, custo total acumulado
- Lista conversas com transcrição expandível
- Botões ✅/❌ gravam resultado na coluna O do Sheets via PATCH /api/painel
- Filtros: Todos, Pendentes, Sucesso, Falha

**Histórico de conversas (Google Sheets)**
- Session ID gerado no frontend ao abrir o chat
- Custo acumulado calculado somando última linha da coluna N + custo da sessão atual
- Coluna O (Resultado) preservada nas atualizações

---

## 11. Contratos de Interface

**POST /api/chat**
```
Request:  { messages: [{role, content}][], sessionId: string, custoSessaoUSD: number }
Response: { content: [{type:'text', text:string}], agente_usado: string, versao_agente: string, uso: { inputTokens: number, outputTokens: number, custoSessaoUSD: number } }
```

**GET /api/painel**
```
Header:   x-painel-senha: string
Response: { conversas: Conversa[] }
```

**PATCH /api/painel**
```
Header:   x-painel-senha: string
Body:     { linha: number, resultado: 'Sucesso' | 'Falha' }
Response: { ok: true }
```

**Tags de ação** (processadas no ChatWidget):
- `[WHATSAPP]` → botão verde com link extraído da resposta da Suh
- `[DISTRIBUIDOR]` → botão verde "Falar com Distribuidor"
- `[TRABALHE_CONOSCO]` → botão azul para `/trabalhe-conosco`
- `[PAGINA_EMPRESA]` → botão azul para `/empresa`
- `[SEG:NomeSegmento]` → extraído e usado no link WhatsApp, removido do texto exibido

---

## 12. Ambiente, Deploy e CI/CD

**Local**:
```bash
npm run dev   # http://localhost:3000
```

**Produção (Vercel)**:
```bash
npx vercel --prod
```

Sem CI/CD automatizado. Deploy manual via CLI. Variáveis de ambiente configuradas manualmente no painel da Vercel.

**Testes automatizados**:
```bash
node scripts/testar-suh.mjs
node scripts/testar-conversas.mjs
```

---

## 13. Middleware e Interceptors

N/A — sem middleware Next.js configurado. Validações implementadas diretamente no `route.ts`.

---

## 14. Riscos e Limitações Conhecidas

- **Gemini 503 frequente em horário comercial americano (13h-18h BRT)**: retry com backoff exponencial (500ms, 1000ms) mitiga mas não elimina.
- **MAX_TOKENS em conversas longas**: prompt do agente Comercial é extenso (~5000 tokens de input). `tokens_max: 3072` dá margem, mas conversas muito longas com histórico de 10 mensagens podem ainda pressionar o limite.
- **Extração de dados por regex**: nome, cidade, UF, empresa extraídos por regex — pode falhar em frases não previstas. Não é crítico.
- **Session ID no frontend**: perdido ao fechar e reabrir o chat. Cada abertura cria nova sessão.
- **Google Sheets como "banco"**: funcional para fase de testes. Migração para PostgreSQL prevista.
- **Custo acumulado via última linha da coluna N**: se houver linhas fora de ordem no Sheets, o acumulado pode ficar incorreto.
- **GOOGLE_PRIVATE_KEY com aspas duplas na Vercel**: gambiarra necessária documentada em DEC-006. Qualquer redeploy que resetar a variável perderá as aspas.
- **Chave de API separada entre local e Vercel**: usar chaves distintas divide o dashboard de uso — consolidar manualmente para análise de custo real.

---

## 15. Pendências Abertas

**Agentes pendentes de informações:**
- Agente Financeiro — aguardando dados do departamento
- Agente RH — aguardando dados do departamento
- Agente Transporte — nome: Trans Modena, aguardando detalhes

**Representantes:**
- Receber lista completa (~20 representantes) com estado e WhatsApp
- Confirmar cobertura Jean vs TNT Paraná no PR
- Definir fallback para estados sem representante

**Distribuidores:**
- Confirmar se contatos são WhatsApp ou fixo
- Definir cobertura para estados sem distribuidor

**Produto:**
- Embedar chat no WordPress via Elementor
- Implementar versão robótica (sem persona Suh) para comparação A/B
- Formulário Trabalhe Conosco
- Few-Shot Learning com conversas reais aprovadas no painel

**Infraestrutura:**
- Migrar Google Sheets para PostgreSQL quando volume aumentar
- Separar planilha de testes e produção
- Unificar chave de API Gemini entre local e Vercel para dashboard consolidado
