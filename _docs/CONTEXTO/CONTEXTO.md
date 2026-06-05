# CONTEXTO DO PROJETO — DKN Chat (Suh)
> Última atualização: 02/06/2026

## 1. Visão Geral

Chat de IA para o site do Grupo Sul Brasil DKN. Assistente virtual com persona "Suh" responde dúvidas técnicas e comerciais sobre TNT, coleta dados do lead progressivamente e encaminha para representante regional via WhatsApp. Projeto isolado do site Next.js original (não aprovado) e hospedado na Vercel. Integração futura prevista com WordPress via iframe/widget.

**Empresa**: Grupo Sul Brasil — indústria de Tecido Não-Tecido (TNT), Caçador/SC, fundada em 1992, certificada ABNT NBR ISO 9001:2015. DKN é a marca do produto, não o nome da empresa. ERP Delphi 7 legado, sem API disponível.

**URL produção**: https://project-0qgvo.vercel.app
**Painel de monitoramento**: https://project-0qgvo.vercel.app/painel

---

## 2. Contas e Serviços

| Serviço | Conta | Finalidade |
|---|---|---|
| Vercel | yurnero14 | Hospedagem do chat |
| Google AI Studio | — | Chave da API Gemini (faturamento ativo) |
| Google Cloud | projeto `dkn-chat` | Service Account para Sheets |
| Google Sheets | yurnero14@gmail.com | Histórico de conversas + métricas |

**Planilha**: DKN Chat — Histórico de Conversas
**Sheet ID**: `1lM0SyPl-vRG9o7FPikDEcKzoS5h8uoNW7NlwYpZxHP0`

---

## 3. Stack Técnica

- **Framework**: Next.js 14.2.3 (App Router) — fixo, não substituir
- **Linguagem**: TypeScript — fixo, não substituir
- **Modelo de IA — agentes principais**: `gemini-2.5-flash` via endpoint `/v1beta/`
- **Modelo de IA — Facilitador**: `gemini-3.1-flash-lite` — GA, estável, sem instabilidade de preview
- **Hospedagem**: Vercel (plano Hobby — limite 10s por função serverless, 30s para /api/chat via vercel.json)
- **Runtime Node.js na Vercel**: 20.x
- **Histórico de conversas**: Google Sheets via googleapis SDK — fixo até migração para PostgreSQL

---

## 4. Variáveis de Ambiente

| Variável | Onde | Observação |
|---|---|---|
| `GEMINI_API_KEY` | `.env.local` + Vercel | Chave da API Gemini — faturamento ativo |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | `.env.local` + Vercel | Email da service account |
| `GOOGLE_PRIVATE_KEY` | `.env.local` + Vercel | Com aspas duplas no valor na Vercel |
| `GOOGLE_SHEET_ID` | `.env.local` + Vercel | ID da planilha de histórico |
| `PAINEL_SENHA` | `.env.local` + Vercel | Senha de acesso ao painel (`dkn2024`) |

**Atenção**: `GOOGLE_PRIVATE_KEY` deve ser salva **com aspas duplas** no painel da Vercel para processar corretamente as quebras de linha `\n`.

---

## 5. Arquitetura e Design de Sistema

Arquitetura sequencial em duas etapas: Facilitador classifica a mensagem, depois o agente correto é chamado. Sem chamadas paralelas.

```
Request → Facilitador (classifica intenção) — modelo: gemini-3.1-flash-lite
        ↓
Roteamento para agente correto:
  comercial    → Suh (Agente Comercial) — modelo: gemini-2.5-flash
  compras      → Agente Compras         — modelo: gemini-2.5-flash
  rh           → Agente RH              — modelo: gemini-2.5-flash
  financeiro   → fallback Suh
  transporte   → fallback Suh
  institucional → fallback Suh
        ↓
Salva conversa no Google Sheets (await — não em background)
        ↓
Retorna resposta ao frontend com uso de tokens e custo acumulado da sessão
```

Cada agente define seu próprio modelo em `config.modelo`. O `route.ts` passa `agente.config.modelo` para `chamarGeminiComRetry` — sem hardcode de modelo no fluxo.

**Regra operacional**: Nenhum código, arquivo ou relatório deve ser gerado sem consultar o responsável primeiro. Toda alteração deve ser cirúrgica — indicando exatamente qual arquivo, como está e como deve ficar.

**5 camadas de segurança**:
1. Rate limiting por IP (20 msgs/hora, janela de 60min)
2. Validação de qualidade da mensagem (mín. 2 chars, sem repetição, sem só símbolos)
3. Proteção contra prompt injection (8 padrões regex)
4. Anti-alucinação no prompt (regras explícitas + temperatura 0.2)
5. Timeout (25s) + histórico limitado (últimas 10 mensagens)

---

## 6. Banco de Dados

Não há banco de dados relacional. Histórico de conversas salvo em Google Sheets.

**Estrutura da planilha** (colunas A a P):

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
| P | Observação |

- Uma linha por sessão, atualizada a cada mensagem
- Session ID gerado no frontend: `sess_${Date.now()}_${random}`
- Busca por Session ID na coluna A para decidir criar ou atualizar linha
- Colunas O e P preservadas ao atualizar (não sobrescritas pelo código)

---

## 7. Autenticação e Permissões

Sem autenticação de usuário no chat. Proteção via rate limiting por IP.

Painel de monitoramento (`/painel`) protegido por senha simples via header `x-painel-senha`. Senha definida na variável `PAINEL_SENHA`.

Google Sheets autenticado via `google.auth.GoogleAuth` com service account (chave PKCS#8 `BEGIN PRIVATE KEY`).

---

## 8. Integrações Externas

**Gemini 2.5 Flash (Google) — agentes principais**
- Finalidade: geração de respostas (Suh, Compras, RH)
- Chamada: REST direto (`fetch` para `generativelanguage.googleapis.com/v1beta/`)
- Credencial: `GEMINI_API_KEY`
- Retry: 3 tentativas com backoff exponencial + jitter (800ms±200, 1500ms±500, 2000ms fixo)
- Fallback: na 3ª tentativa esgotada, lança `GeminiIndisponivelError` — frontend exibe mensagem com link WhatsApp da Andreia
- Captura `usageMetadata` (promptTokenCount, candidatesTokenCount) para cálculo de custo
- Loga `finishReason` quando diferente de `STOP` para detectar cortes por MAX_TOKENS

**Gemini 3.1 Flash Lite (Google) — Facilitador**
- Finalidade: classificação de intenção — retorna JSON com tipo, confiança e palavras detectadas
- Modelo GA, estável, sem instabilidade de preview
- Mesma infraestrutura de retry e endpoint do agente principal
- Chamada via `agente.config.modelo` — sem hardcode no route.ts

**Google Sheets API**
- Finalidade: salvar histórico de conversas e métricas de custo
- Chamada: SDK `googleapis` v4
- Credencial: `GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`
- Leitura: range `A:P` (16 colunas)
- Falha silenciosa: erro logado no console, não afeta resposta ao usuário

**WhatsApp (links diretos)**
- Finalidade: encaminhar cliente para representante, suporte ou setor de compras
- Botão [WHATSAPP]: link extraído da própria resposta via regex (`wa.me`); fallback para `montarLinkWhatsApp(msgs)` se nenhum link encontrado
- Botão [DISTRIBUIDOR]: renderiza botões individuais por distribuidor mencionado na resposta
- Links e nome da Andreia removidos do texto exibido no chat (limpeza no renderMsg)
- Fallback do link [WHATSAPP]: número da Andreia (`554935611505`) se nenhum link encontrado
- Josemar (Compras): link `wa.me/554935611519` incluído diretamente na resposta do agente Compras
- Mensagem de erro técnico (GeminiIndisponivelError): inclui link direto para Andreia (`wa.me/554935611505`) + tag [WHATSAPP]

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
│   │   │   └── route.ts       (fluxo sequencial + retry/GeminiIndisponivelError + captura de tokens + modelo por agente)
│   │   └── painel/
│   │       └── route.ts       (GET: lê conversas | PATCH: atualiza resultado e observação)
│   ├── painel/
│   │   └── page.tsx           (painel de monitoramento com senha)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── ChatWidget.tsx         (extrai link wa.me da resposta antes de usar montarLinkWhatsApp)
├── lib/
│   ├── agents/
│   │   ├── comercial.ts       (prompt da Suh v2.0 — tokens_max: 4096, temperatura: 0.2)
│   │   ├── facilitador.ts     (classificador com few-shot v2.0 — tokens_max: 1024, temperatura: 0.1, modelo: gemini-3.1-flash-lite)
│   │   ├── rh.ts              (agente RH — tokens_max: 1024, temperatura: 0.2)
│   │   ├── compras.ts         (agente Compras — inclui link wa.me do Josemar + [WHATSAPP])
│   │   ├── index.ts           (central de agentes + pegarAgentePorClassificacao)
│   │   └── tipos.ts           (interfaces Agent, TipoAgente, ClassificacaoResult)
│   └── google-sheets.ts       (salvarConversa + lerConversas + atualizarResultado + atualizarObservacao)
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
5. Facilitador classifica a mensagem usando `gemini-3.1-flash-lite`
6. Facilitador retorna JSON limpo (markdown removido antes do parse)
7. Agente correto chamado conforme classificação usando `gemini-2.5-flash`
8. Tokens consumidos capturados via `usageMetadata`
9. Custo da sessão calculado e acumulado (USD → R$ câmbio 5,50)
10. Resposta retornada ao frontend com `uso: { inputTokens, outputTokens, custoSessaoUSD }`
11. Conversa salva/atualizada no Google Sheets com custo

**Fluxo de retry e erro técnico**
- Tentativa 1: modelo do agente — aguarda ~800ms±200 em caso de 503
- Tentativa 2: modelo do agente — aguarda ~1500ms±500 em caso de 503
- Tentativa 3: modelo do agente — se falhar, lança `GeminiIndisponivelError`
- `GeminiIndisponivelError`: retorna mensagem amigável + link WhatsApp Andreia + tag [WHATSAPP]
- Timeout (25s): retorna mensagem amigável + link WhatsApp Andreia + tag [WHATSAPP]

**Fluxo de encaminhamento**
- Suh coleta nome → cidade/estado → empresa progressivamente
- Ao detectar intenção de compra: informa pedido mínimo R$10.000 antes de encaminhar
- Se cliente não souber especificações técnicas: encaminha representante imediatamente
- Encaminha por estado: SP → Lúcio, PR → Jean, SC → Roberto Pereira, demais → Roberto Pereira
- Dúvida técnica fora da base: encaminha Andreia imediatamente, sem qualificar volume
- Especificação customizada com intenção de compra: encaminha representante
- Representante interessado em parceria comercial: encaminha sempre para Anderson Nonato

**Fluxo de botões de distribuidor**
- Suh menciona distribuidores na resposta + tag [DISTRIBUIDOR]
- ChatWidget detecta quais distribuidores foram mencionados pelo nome no texto
- Renderiza botão individual para cada distribuidor mencionado (com link wa.me correto)
- Se nenhum distribuidor identificado no texto: exibe botões de todos os distribuidores

**Fluxo de fallback de usuário**
- Erro técnico (GeminiIndisponivelError ou timeout): mensagem amigável + botão WhatsApp Andreia
- Dúvida sem resposta na base: encaminha Andreia + [WHATSAPP]
- Cliente pede atendente humano + tem estado coletado: encaminha representante imediatamente

**Fluxo agente Compras**
- Facilitador classifica como `compras` quando remetente quer vender PARA a DKN
- Agente Compras responde com link direto do Josemar (`wa.me/554935611519`) + tag [WHATSAPP]
- ChatWidget extrai o link `wa.me` da resposta e usa como destino do botão

**Fluxo botão [WHATSAPP] no ChatWidget**
- Extrai link `wa.me` da resposta se presente
- Fallback: `montarLinkWhatsApp(msgs)` com dados coletados da conversa

**Fluxo pedido formal com CNPJ**
- Detectado por: mensagem > 300 chars + regex CNPJ/razão social/orçamento/cotação
- Resposta sem chamar Gemini — encaminha direto para representante por UF detectada na mensagem
- UF não detectada ou sem representante: Anderson Nonato (parceria/fallback)

**Painel de monitoramento**
- Acesso via `/painel` com senha
- Exibe métricas: total sessões, sucessos, falhas, taxa de sucesso, custo total acumulado
- Lista conversas com transcrição expandível
- Botões ✅/❌ gravam resultado na coluna O do Sheets via PATCH /api/painel
- Campo de observação salvo na coluna P via PATCH /api/painel
- Filtros: Todos, Pendentes, Sucesso, Falha

**Roteamento de agentes**
- `comercial` → Suh (Agente Comercial)
- `rh` → Agente RH
- `compras` → Agente Compras (Josemar)
- `financeiro` → fallback Suh
- `transporte` → fallback Suh
- `institucional` → fallback Suh

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
Body:     { linha: number, resultado?: 'Sucesso' | 'Falha', observacao?: string }
Response: { ok: true }
```

**Tags de ação** (processadas no ChatWidget):
- `[WHATSAPP]` → botão verde; link extraído da resposta ou fallback `montarLinkWhatsApp`
- `[DISTRIBUIDOR]` → botões verdes individuais por distribuidor mencionado no texto
- `[TRABALHE_CONOSCO]` → botão azul para `/trabalhe-conosco`
- `[PAGINA_EMPRESA]` → botão azul para `/empresa`
- `[SEG:NomeSegmento]` → extraído e usado no link WhatsApp, removido do texto exibido

**Distribuidores registrados no ChatWidget**:
- Jean (PR) — `5541991838361`
- Dem Bas (RS) — `5551935872363`
- TNT Paraná (PR) — `5543921026096`
- LJ Distribuição (MG) — `5532935413485`
- Zantex (SP) — `5511944234241`

**Representantes regionais**:
- SP: Lúcio — `5511996595400`
- PR: Jean Sul Brasil — `5541991838361`
- SC: Roberto Pereira — `5549999276041`
- Demais estados: Roberto Pereira — `5549999276041`
- Parcerias comerciais: Anderson Nonato — `5511998010979`
- Suporte / fallback técnico: Andreia Knecht — `554935611505`

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

- **Gemini 2.5 Flash em preview**: modelo instável em horário comercial americano (13h-18h BRT). Mitigado por retry com backoff (3 tentativas). Se todas falharem, encaminha para Andreia via WhatsApp.
- **Facilitador em gemini-3.1-flash-lite**: modelo GA e estável. Risco de qualidade inferior em classificações muito ambíguas — monitorar via painel.
- **Endpoint `/v1beta/`**: modelos Gemini 2.5 requerem `/v1beta/` — `/v1/` retorna erro. Manter atenção em futuras atualizações da API Google.
- **GeminiIndisponivelError sem modelo fallback**: decisão consciente — erro técnico persistente vai direto para atendimento humano.
- **MAX_TOKENS em conversas longas**: prompt do Comercial ~5000 tokens de input. `tokens_max: 4096` dá margem, mas conversas muito longas com histórico de 10 mensagens podem pressionar o limite.
- **Facilitador com few-shot**: classificação depende dos exemplos fornecidos. Casos muito fora do padrão podem ser classificados incorretamente — monitorar via painel.
- **Extração de dados por regex**: nome, cidade, UF, empresa extraídos por regex — pode falhar em frases não previstas.
- **Session ID no frontend**: perdido ao fechar e reabrir o chat. Cada abertura cria nova sessão.
- **Google Sheets como "banco"**: funcional para fase de testes. Sem proteção contra concorrência.
- **Logs da Vercel somem após 1 hora (plano Hobby)**: erros invisíveis após esse período.
- **GOOGLE_PRIVATE_KEY com aspas duplas na Vercel**: gambiarra necessária. Redeploy que resetar a variável quebrará a integração com o Sheets.
- **Custo acumulado via última linha da coluna N**: linhas fora de ordem no Sheets podem gerar acumulado incorreto.
- **Câmbio fixo R$5,50**: diverge do real ao longo do tempo.
- **Fluxo pedido formal**: representante para UF não mapeada cai em Anderson Nonato — inconsistente com o fluxo padrão que usa Roberto Pereira como fallback. Alinhar em próxima sessão.

---

## 15. Pendências Abertas

**Representantes:**
- Definir com a diretoria o roteamento para estados sem representante exclusivo (atualmente: Roberto Pereira como fallback)
- Confirmar cobertura Jean vs TNT Paraná no PR
- Receber lista completa (~20 representantes) com estado e WhatsApp

**Agentes pendentes de informações:**
- Agente Financeiro — aguardando dados do departamento
- Agente Transporte — nome: Trans Modena, aguardando detalhes

**Distribuidores:**
- Confirmar se contatos Dem Bas e LJ Distribuição são WhatsApp ou fixo
- Definir cobertura para estados sem distribuidor

**Agente RH:**
- Substituir endereço de teste pelo endereço real da GSB

**Produto:**
- Embedar chat no WordPress via Elementor
- Implementar versão robótica (sem persona Suh) para comparação A/B
- Formulário Trabalhe Conosco
- Few-Shot Learning com conversas reais aprovadas no painel

**Infraestrutura:**
- Migrar Google Sheets para PostgreSQL quando volume aumentar
- Separar planilha de testes e produção
- Implementar monitoramento persistente de erros (substituir logs da Vercel)
