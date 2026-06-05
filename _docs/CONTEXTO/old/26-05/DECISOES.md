# DECISÕES TÉCNICAS — DKN Chat (Suh)
> Última atualização: 22/05/2026

## [DEC-001] — Gemini 2.5 Flash como modelo de IA
**Data:** 08/05/2026
**Status:** Ativa
**Contexto:** Necessidade de modelo de IA para classificação e resposta em chat de suporte comercial. Orçamento limitado.
**Decisão:** Gemini 2.5 Flash em vez de Claude ou GPT-4.
**Consequências:** Custo ~40× menor que Claude Sonnet. Suficiente para classificação e FAQ técnico. Sujeito a erros 503 em horários de pico americano. Qualidade ligeiramente inferior em raciocínio complexo — irrelevante para o caso de uso.

---

## [DEC-002] — Agentes como objetos TypeScript (sem framework)
**Data:** 08/05/2026
**Status:** Ativa
**Contexto:** Múltiplos agentes necessários. Avaliar uso de LangChain ou CrewAI.
**Decisão:** Agentes como objetos TypeScript em `lib/agents/`. Sem LangChain, sem CrewAI.
**Consequências:** Zero dependências extras. Controle total do fluxo. Agentes independentes. Migração para framework mais complexa se necessário no futuro.

---

## [DEC-003] — Persona "Suh" para o agente comercial
**Data:** 12/05/2026
**Status:** Ativa
**Contexto:** Debate sobre ter ou não persona humanizada. Risco ético de enganar cliente.
**Decisão:** Persona Suh com honestidade — confirma ser IA se perguntada diretamente.
**Consequências:** Melhor experiência do usuário. Sem risco jurídico (LGPD). Temperatura 0.2 para reduzir alucinações.

---

## [DEC-004] — Chamadas paralelas Facilitador + Comercial
**Data:** 19/05/2026
**Status:** Ativa
**Contexto:** Vercel Hobby limita funções serverless a 10s. Chamadas sequenciais somavam 5-8s.
**Decisão:** `Promise.allSettled([facilitador, comercial])` em paralelo. Se tipo for 'comercial', usa resposta já pronta.
**Consequências:** Tempo total ~3-4s. Custo dobrado para mensagens comerciais. Trade-off aceito dado volume baixo.

---

## [DEC-005] — Google Sheets como armazenamento de histórico
**Data:** 19/05/2026
**Status:** Ativa
**Contexto:** Necessidade de capturar histórico para fase de testes. Banco relacional adiado para pós-aprovação do MVP.
**Decisão:** Google Sheets via googleapis SDK. Uma linha por sessão, atualizada a cada mensagem.
**Consequências:** Zero custo. Visível em tempo real. Não escala para alto volume. Migração para PostgreSQL prevista após aprovação.

---

## [DEC-006] — GOOGLE_PRIVATE_KEY com aspas duplas na Vercel
**Data:** 19/05/2026
**Status:** Ativa
**Contexto:** Chave PKCS#8 causava erro `DECODER routines::unsupported` na Vercel com Node.js 20.
**Decisão:** Salvar valor com aspas duplas literais no painel da Vercel. Código remove aspas e normaliza `\n`.
**Consequências:** Gambiarra necessária. Qualquer redeploy que resetar a variável perderá as aspas e quebrará a integração com o Sheets.

---

## [DEC-007] — salvarConversa com await (não em background)
**Data:** 19/05/2026
**Status:** Ativa
**Contexto:** Vercel encerra funções serverless imediatamente após o `return`. Chamada em background era cortada.
**Decisão:** `await Promise.allSettled([salvarConversa(...)])` antes do `return`.
**Consequências:** Adiciona ~500ms-1s de latência. Aceitável dado o limite de 30s configurado no `vercel.json`.

---

## [DEC-008] — Retry com backoff exponencial para erros 503
**Data:** 21/05/2026
**Status:** Ativa
**Contexto:** Retry com intervalo fixo de 2s consumia margem de tempo desnecessária dentro do limite de 10s da Vercel.
**Decisão:** Substituir intervalo fixo por backoff exponencial: 500ms na 1ª tentativa, 1000ms na 2ª.
**Consequências:** Ganha ~2.5s de margem em relação à implementação anterior. Comportamento idêntico em caso de sucesso na 1ª tentativa.

---

## [DEC-009] — Captura de tokens e custo via usageMetadata do Gemini
**Data:** 21/05/2026
**Status:** Ativa
**Contexto:** Necessidade de visibilidade real de custo por sessão e acumulado para apresentar à diretoria.
**Decisão:** Capturar `promptTokenCount` e `candidatesTokenCount` do `usageMetadata` retornado pelo Gemini. Calcular custo em USD e converter para R$ (câmbio fixo R$5,50). Custo acumulado salvo na coluna N do Sheets — cada sessão soma ao último valor registrado.
**Consequências:** Custo visível por sessão no frontend e acumulado no Sheets. Câmbio fixo pode divergir do real ao longo do tempo.

---

## [DEC-010] — Painel de monitoramento em /painel
**Data:** 21/05/2026
**Status:** Ativa
**Contexto:** Necessidade de ferramenta para marcar conversas como Sucesso/Falha durante fase de testes e apresentar dados à diretoria.
**Decisão:** Página Next.js em `/painel` com senha simples (`PAINEL_SENHA`). Lê e escreve no mesmo Sheets via `/api/painel`. Coluna O do Sheets armazena resultado.
**Consequências:** Zero infraestrutura extra. Senha em variável de ambiente — não é autenticação robusta, adequada apenas para uso interno durante testes.

---

## [DEC-011] — Link WhatsApp extraído da resposta da Suh
**Data:** 21/05/2026
**Status:** Ativa
**Contexto:** Botão WhatsApp no frontend sempre apontava para número fixo da Andreia, ignorando o link do representante correto que a Suh incluía na resposta.
**Decisão:** `montarLinkWhatsApp()` no ChatWidget extrai o link via regex da última mensagem da Suh (`wa.me` ou `api.whatsapp.com`). Usa o número encontrado e substitui apenas o texto da mensagem. Fallback para Andreia se nenhum link encontrado.
**Consequências:** Botão agora direciona para o representante correto por região. Depende da Suh incluir o link na resposta — se o prompt mudar e o link sumir, o fallback assume.

---

## [DEC-012] — tokens_max do agente Comercial em 3072
**Data:** 22/05/2026
**Status:** Ativa
**Contexto:** Prompt do agente Comercial consome ~5000 tokens de input (prompt sistema + histórico). Com tokens_max em 1024 e depois 1536, respostas eram cortadas (finishReason: MAX_TOKENS) em conversas com mais de 5 trocas.
**Decisão:** Subir tokens_max para 3072.
**Consequências:** Elimina cortes em conversas normais. Custo por mensagem ligeiramente maior — irrelevante no volume atual.

---

## [DEC-013] — Mínimo de 2 chars na validação de mensagem
**Data:** 22/05/2026
**Status:** Ativa
**Contexto:** Validação exigia mínimo de 3 chars, bloqueando mensagens legítimas como "SC" (sigla de estado) e "Ok" (confirmação do cliente).
**Decisão:** Reduzir mínimo de 3 para 2 chars.
**Consequências:** Aceita siglas de estado e confirmações curtas. Risco mínimo — outros filtros (repetição, sem letras) ainda bloqueiam lixo.
