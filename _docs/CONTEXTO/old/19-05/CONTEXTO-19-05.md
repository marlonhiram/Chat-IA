# CONTEXTO DO PROJETO — DKN Chat com Agentes de IA
> Última atualização: 19/05/2026

## 1. Visão Geral

Chat de IA para o site do Grupo Sul Brasil DKN. Assistente virtual com persona "Suh" responde dúvidas técnicas e comerciais sobre TNT, coleta dados do lead progressivamente e encaminha para representante regional via WhatsApp. Projeto isolado do site Next.js original (não aprovado) e hospedado na Vercel. Integração futura prevista com WordPress via iframe/widget.

**Empresa**: Grupo Sul Brasil DKN — indústria de Tecido Não-Tecido (TNT), Caçador/SC, fundada em 1992, certificada ABNT NBR ISO 9001:2015. ERP Delphi 7 legado, sem API disponível.

**URL produção**: https://project-0qgvo.vercel.app

---

## 2. Contas e Serviços

| Serviço | Conta | Finalidade |
|---|---|---|
| Vercel | yurnero14 | Hospedagem do chat |
| Google AI Studio | — | Chave da API Gemini |
| Google Cloud | projeto `dkn-chat` | Service Account para Sheets |
| Google Sheets | yurnero14@gmail.com | Histórico de conversas |

**Planilha**: DKN Chat — Histórico de Conversas  
**Sheet ID**: `1lM0SyPl-vRG9o7FPikDEcKzoS5h8uoNW7NlwYpZxHP0`

---

## 3. Stack Técnica

- **Framework**: Next.js 14.2.3 (App Router)
- **Linguagem**: TypeScript
- **Modelo de IA**: Gemini 2.5 Flash (Google)
- **Hospedagem**: Vercel (plano Hobby — limite de 10s por função)
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

**Atenção**: `GOOGLE_PRIVATE_KEY` deve ser salva **com aspas duplas** no painel da Vercel para processar corretamente as quebras de linha `\n`.

---

## 5. Arquitetura e Design de Sistema

Arquitetura em duas etapas paralelas: Facilitador classifica a mensagem enquanto o agente Comercial já começa a processar simultaneamente, reduzindo latência total para ~3-4s (abaixo do limite de 10s da Vercel).

```
Request → Facilitador + Comercial (paralelo via Promise.allSettled)
        ↓
Se tipo == 'comercial' → usa resposta do Comercial já pronta
Se tipo != 'comercial' → chama agente correto (sequencial)
        ↓
Salva conversa no Google Sheets (await — não em background)
        ↓
Retorna resposta ao frontend
```

Agentes definidos como objetos TypeScript em `lib/agents/`. Sem framework externo (sem LangChain, sem CrewAI). Cada agente é independente — não colaboram entre si.

**5 camadas de segurança**:
1. Rate limiting por IP (20 msgs/hora, janela de 60min)
2. Validação de qualidade da mensagem (mín. 3 chars, sem repetição, sem só símbolos)
3. Proteção contra prompt injection (8 padrões regex)
4. Anti-alucinação no prompt (regras explícitas + temperatura 0.2)
5. Timeout (9s) + histórico limitado (últimas 10 mensagens)

---

## 6. Banco de Dados

Não há banco de dados relacional. Histórico de conversas salvo em Google Sheets.

**Estrutura da planilha** (colunas A a L):

| Session ID | Data/Hora | Nome | Cidade | UF | Segmento | Empresa | Total Msgs | Encaminhamento | Agente | IP | Transcrição |

- Uma linha por sessão, atualizada a cada mensagem
- Session ID gerado no frontend: `sess_${Date.now()}_${random}`
- Busca por Session ID na coluna A para decidir criar ou atualizar linha

---

## 7. Autenticação e Permissões

Sem autenticação de usuário no chat. Proteção via rate limiting por IP.

Google Sheets autenticado via `google.auth.GoogleAuth` com `GoogleAuth` (não JWT direto) usando service account com chave PKCS#8 (`BEGIN PRIVATE KEY`).

---

## 8. Integrações Externas

**Gemini 2.5 Flash (Google)**
- Finalidade: geração de respostas e classificação de intenção
- Chamada: REST direto (`fetch` para `generativelanguage.googleapis.com`)
- Credencial: `GEMINI_API_KEY`
- Retry automático: 3 tentativas com 2s de intervalo em caso de erro 503
- Fallback: mensagem de erro + botão WhatsApp na 2ª falha consecutiva

**Google Sheets API**
- Finalidade: salvar histórico de conversas
- Chamada: SDK `googleapis` v4
- Credencial: `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`
- Falha silenciosa: erro logado no console, não afeta resposta ao usuário

**WhatsApp (links diretos)**
- Finalidade: encaminhar cliente para representante ou suporte
- Link pré-preenchido montado dinamicamente com dados coletados na conversa
- Sem integração via API — apenas links `wa.me` e `api.whatsapp.com/send`

---

## 9. Estrutura de Pastas

```
dkn-chat/
├── .env.local
├── .gitignore
├── .node-version          (força Node 20 na Vercel)
├── next.config.js
├── package.json
├── tsconfig.json
├── vercel.json            (maxDuration: 30s para /api/chat)
├── app/
│   ├── api/chat/
│   │   └── route.ts       (servidor principal)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx           (página de teste — só o chat)
├── components/
│   └── ChatWidget.tsx     (componente React do chat)
├── lib/
│   ├── agents/
│   │   ├── comercial.ts   (prompt da Suh — v1.0)
│   │   ├── facilitador.ts (classificador — temperatura 0.1)
│   │   ├── index.ts       (pegarAgentePorClassificacao)
│   │   └── tipos.ts       (interfaces Agent, TipoAgente)
│   └── google-sheets.ts   (salvarConversa)
└── scripts/
    ├── testar-suh.mjs     (20 perguntas isoladas)
    └── testar-conversas.mjs (10 conversas simuladas com Gemini-cliente)
```

---

## 10. Fluxos Implementados

**Fluxo principal (mensagem do usuário)**
1. Frontend envia `{ messages, sessionId }` para `POST /api/chat`
2. Rate limiting valida IP
3. Validação de qualidade filtra mensagens inválidas
4. Regex bloqueia prompt injection
5. Facilitador + Comercial chamados em paralelo
6. Resposta retornada ao frontend
7. Conversa salva/atualizada no Google Sheets

**Fluxo de encaminhamento**
- Suh coleta nome → cidade/estado → empresa progressivamente
- Ao detectar intenção de compra: informa pedido mínimo R$10.000 antes de encaminhar
- Encaminha representante por estado (SP/PR/SC) ou Andreia (demais)
- Link WhatsApp pré-preenchido com: nome, empresa, localidade, segmento

**Fluxo de fallback**
- 1ª falha técnica: "pode enviar sua mensagem novamente"
- 2ª falha consecutiva: "dificuldades técnicas" + botão WhatsApp para Andreia
- Dúvida sem resposta na base: encaminha Andreia + [WHATSAPP]
- Cliente pede atendente humano + tem estado coletado: encaminha representante da região imediatamente

**Histórico de conversas (Google Sheets)**
- Session ID gerado no frontend ao abrir o chat
- Enviado em cada request
- `salvarConversa` busca linha por Session ID e atualiza ou cria nova

---

## 11. Contratos de Interface

**POST /api/chat**
```
Request:  { messages: [{role, content}][], sessionId: string }
Response: { content: [{type:'text', text:string}], agente_usado: string, versao_agente: string }
```

**Tags de ação** (processadas no ChatWidget):
- `[WHATSAPP]` → botão verde com link dinâmico
- `[DISTRIBUIDOR]` → botão verde "Falar com Distribuidor"
- `[TRABALHE_CONOSCO]` → botão azul para `/trabalhe-conosco`
- `[PAGINA_EMPRESA]` → botão azul para `/empresa`
- `[SEG:NomeSegmento]` → extraído e usado no link WhatsApp, removido do texto exibido

**Link WhatsApp dinâmico** (montado no ChatWidget):
```
Olá! Vim pelo chat do site do Grupo Sul Brasil — DKN. 
Meu nome é {nome}, represento a {empresa}, sou de {cidade}/{UF} 
e tenho interesse no segmento {segmento}.
```

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

Sem CI/CD automatizado. Deploy manual via CLI. Variáveis de ambiente configuradas manualmente no painel da Vercel (Settings → Environment Variables).

**Testes automatizados**:
```bash
node scripts/testar-suh.mjs          # 20 perguntas isoladas (~R$0,02)
node scripts/testar-conversas.mjs    # 10 conversas completas (~R$0,15)
```

---

## 13. Middleware e Interceptors

N/A — sem middleware Next.js configurado. Validações implementadas diretamente no `route.ts`.

---

## 14. Riscos e Limitações Conhecidas

- **Vercel Hobby limita funções a 10s**: mitigado com chamadas paralelas (~3-4s total). Picos de latência do Gemini podem ainda causar timeouts esporádicos.
- **Gemini 503 frequente em horário comercial americano (13h-18h BRT)**: retry automático (3x, 2s intervalo) mitiga mas não elimina.
- **Extração de dados por regex**: nome, cidade, UF, empresa extraídos por regex das mensagens — pode falhar em frases não previstas. Não é crítico (campos ficam com `—`).
- **Session ID no frontend**: gerado no `useState`, perdido ao fechar e reabrir o chat na mesma aba. Cada abertura do chat cria nova sessão.
- **Google Sheets como "banco"**: funcional para fase de testes, não escala para produção com alto volume. Migração para PostgreSQL prevista.
- **Temperatura 0.2 da Suh**: reduz alucinações mas pode tornar respostas menos naturais em conversas longas.

---

## 15. Pendências Abertas

**Agentes pendentes de informações:**
- Agente Financeiro — aguardando dados do departamento
- Agente RH — aguardando dados do departamento
- Agente Transporte — nome: Trans Modena, aguardando detalhes

**Representantes:**
- Receber lista completa (~20 representantes) com estado e WhatsApp
- Confirmar cobertura Jean vs TNT Paraná no PR
- Definir fallback para estados sem representante (SC já tem Roberto)

**Distribuidores:**
- Confirmar se contatos são WhatsApp ou fixo
- Definir cobertura para estados sem distribuidor

**Produto:**
- Embedar chat no WordPress via Elementor (sem acesso ao servidor WP)
- Implementar versão robótica (sem persona Suh) para comparação A/B
- Formulário Trabalhe Conosco (substituir link `/trabalhe-conosco`)
- Aprimoramento contínuo via Few-Shot Learning com conversas reais

**Infraestrutura:**
- Migrar Google Sheets para PostgreSQL quando volume aumentar
- Configurar Google Sheets para separar ambiente de testes de produção
