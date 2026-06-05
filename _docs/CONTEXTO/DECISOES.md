# DECISÕES TÉCNICAS — DKN Chat (Suh)
> Última atualização: 02/06/2026

## [DEC-001] — Gemini 2.5 Flash como modelo de IA principal
**Data:** 08/05/2026
**Status:** Ativa
**Contexto:** Necessidade de modelo de IA para classificação e resposta em chat de suporte comercial. Orçamento limitado.
**Decisão:** Gemini 2.5 Flash em vez de Claude ou GPT-4.
**Consequências:** Custo ~40× menor que Claude Sonnet. Suficiente para classificação e FAQ técnico. Modelo ainda em preview — sujeito a erros 503 em horários de pico americano. Qualidade ligeiramente inferior em raciocínio complexo — irrelevante para o caso de uso.

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
**Status:** Substituída por DEC-020
**Contexto:** Vercel Hobby limita funções serverless a 10s. Chamadas sequenciais somavam 5-8s.
**Decisão:** `Promise.allSettled([facilitador, comercial])` em paralelo.
**Consequências:** Substituída — custo dobrado para mensagens não-comerciais superou o ganho de latência.

---

## [DEC-005] — Google Sheets como armazenamento de histórico
**Data:** 19/05/2026
**Status:** Ativa
**Contexto:** Necessidade de capturar histórico para fase de testes. Banco relacional adiado para pós-aprovação do MVP.
**Decisão:** Google Sheets via googleapis SDK. Uma linha por sessão, atualizada a cada mensagem. 16 colunas (A-P).
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

## [DEC-008] — Retry com backoff exponencial + jitter para erros 503
**Data:** 21/05/2026 — atualizada em 01/06/2026
**Status:** Ativa
**Contexto:** Retry com intervalo fixo consumia margem desnecessária. Backoff sem jitter causava thundering herd.
**Decisão:** Backoff exponencial com jitter: tentativa 1 (~800ms±200), tentativa 2 (~1500ms±500), tentativa 3 (2000ms fixo). Todas as tentativas usam o modelo configurado no agente. Se todas falharem, lança `GeminiIndisponivelError`.
**Consequências:** Distribui melhor as requisições em pico. Erro persistente vai direto para atendimento humano.

---

## [DEC-009] — Captura de tokens e custo via usageMetadata do Gemini
**Data:** 21/05/2026
**Status:** Ativa
**Contexto:** Necessidade de visibilidade real de custo por sessão e acumulado para apresentar à diretoria.
**Decisão:** Capturar `promptTokenCount` e `candidatesTokenCount` do `usageMetadata`. Calcular custo em USD e converter para R$ (câmbio fixo R$5,50). Custo acumulado salvo na coluna N do Sheets.
**Consequências:** Custo visível por sessão no frontend e acumulado no Sheets. Câmbio fixo pode divergir do real ao longo do tempo.

---

## [DEC-010] — Painel de monitoramento em /painel
**Data:** 21/05/2026
**Status:** Ativa
**Contexto:** Necessidade de ferramenta para marcar conversas como Sucesso/Falha durante fase de testes.
**Decisão:** Página Next.js em `/painel` com senha simples (`PAINEL_SENHA`). Lê e escreve no mesmo Sheets via `/api/painel`.
**Consequências:** Zero infraestrutura extra. Senha em variável de ambiente — não é autenticação robusta, adequada apenas para uso interno durante testes.

---

## [DEC-011] — Botões de distribuidor individuais por menção na resposta
**Data:** 21/05/2026 — atualizada em 26/05/2026
**Status:** Ativa
**Contexto:** Botão único sempre apontava para número fixo. A Suh menciona distribuidores específicos por região.
**Decisão:** `renderBotoesDistribuidores()` detecta distribuidores mencionados pelo nome e renderiza botão individual para cada um. Fallback: exibe todos se nenhum identificado.
**Consequências:** Botão direciona para o distribuidor correto por região. Depende da Suh mencionar o nome na resposta.

---

## [DEC-012] — tokens_max do agente Comercial em 4096
**Data:** 22/05/2026 — atualizado em 26/05/2026
**Status:** Ativa
**Contexto:** Prompt do agente Comercial consome ~5000 tokens de input. Com limites menores, respostas eram cortadas.
**Decisão:** tokens_max em 4096.
**Consequências:** Elimina cortes em conversas normais. Custo por mensagem ligeiramente maior — irrelevante no volume atual.

---

## [DEC-013] — Mínimo de 2 chars na validação de mensagem
**Data:** 22/05/2026
**Status:** Ativa
**Contexto:** Validação exigia mínimo de 3 chars, bloqueando mensagens legítimas como "SC" e "Ok".
**Decisão:** Reduzir mínimo de 3 para 2 chars.
**Consequências:** Aceita siglas de estado e confirmações curtas. Risco mínimo.

---

## [DEC-014] — Fallback automático de modelo na 3ª tentativa
**Data:** 26/05/2026
**Status:** Substituída por DEC-020
**Contexto:** Gemini 2.5 Flash em preview apresenta 503 frequentes. Após 2 tentativas, trocar o modelo.
**Decisão:** Na 3ª tentativa, troca para `gemini-2.0-flash`.
**Consequências:** Substituída — gemini-2.0-flash descontinuado em 01/06/2026.

---

## [DEC-015] — Limpeza de links WhatsApp no texto exibido ao usuário
**Data:** 26/05/2026
**Status:** Ativa
**Contexto:** A Suh incluía links `wa.me` no corpo da resposta. ChatWidget não removia, exibindo link cru.
**Decisão:** No `renderMsg`, remover via regex todos os links `wa.me`/`api.whatsapp.com` do texto exibido.
**Consequências:** Interface limpa. Botão continua funcionando via extração do link antes da limpeza.

---

## [DEC-016] — tokens_max do Facilitador em 1024
**Data:** 26/05/2026
**Status:** Ativa
**Contexto:** Gemini 2.5 Flash consome tokens internos de "thinking". Com tokens_max baixo, JSON do Facilitador era cortado.
**Decisão:** tokens_max em 1024.
**Consequências:** Facilitador classifica corretamente. Sem impacto de custo — tokens_max é limite máximo.

---

## [DEC-017] — Remoção do markdown do Gemini antes do JSON.parse do Facilitador
**Data:** 26/05/2026
**Status:** Ativa
**Contexto:** Gemini 2.5 Flash frequentemente retorna JSON embrulhado em blocos markdown, quebrando o `JSON.parse`.
**Decisão:** Antes do `JSON.parse`, aplicar `.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()`.
**Consequências:** Elimina falhas de parse causadas por markdown. Sem efeitos colaterais.

---

## [DEC-018] — Agentes RH e Compras implementados
**Data:** 26/05/2026
**Status:** Ativa
**Contexto:** Mensagens de RH e de fornecedores chegavam na Suh e eram tratadas incorretamente.
**Decisão:** Dois agentes em `lib/agents/rh.ts` e `lib/agents/compras.ts`. Registrados no `index.ts` e `tipos.ts`.
**Consequências:** Roteamento correto. Custo por mensagem muito menor que o Comercial.

---

## [DEC-019] — Referência à empresa como "Grupo Sul Brasil" (não "DKN")
**Data:** 26/05/2026
**Status:** Ativa
**Contexto:** DKN é a marca do produto, não o nome da empresa. Agentes referenciavam "DKN" como nome da empresa.
**Decisão:** Substituir referências isoladas a "DKN" por "Grupo Sul Brasil" nos prompts. Manter "TNT DKN" apenas para o produto.
**Consequências:** Comunicação alinhada com a identidade da empresa.

---

## [DEC-020] — Endpoint /v1beta/, fluxo sequencial e GeminiIndisponivelError
**Data:** 01/06/2026
**Status:** Ativa (substitui DEC-004 e DEC-014)
**Contexto:** Endpoint `/v1/` não suporta Gemini 2.5 Flash. Gemini 2.0 Flash descontinuado. Fluxo paralelo dobrava custo. Timeout de 9s estourava durante retry.
**Decisão:** Endpoint `/v1beta/`. Fluxo sequencial. Timeout 25s. `GeminiIndisponivelError` encaminha para Andreia.
**Consequências:** Custo por sessão cai ~50%. Latência comercial sobe ~1-2s — aceitável.

---

## [DEC-021] — Flash Lite removido como fallback de modelo
**Data:** 01/06/2026
**Status:** Ativa
**Contexto:** Gemini 2.5 Flash Lite testado como fallback. Qualidade insuficiente para o fluxo complexo da Suh.
**Decisão:** Remover Flash Lite do fluxo. Falha técnica persistente encaminha para Andreia.
**Consequências:** Sem degradação silenciosa de qualidade. Cliente com erro técnico recebe atendimento humano imediato.

---

## [DEC-022] — Botão WhatsApp extrai link da resposta antes de usar montarLinkWhatsApp
**Data:** 01/06/2026
**Status:** Ativa
**Contexto:** Botão [WHATSAPP] sempre chamava `montarLinkWhatsApp(msgs)`. Agente Compras precisa direcionar para Josemar.
**Decisão:** `ChatWidget.tsx` extrai link `wa.me` da resposta via regex. Se encontrado, usa esse link. Fallback: `montarLinkWhatsApp(msgs)`.
**Consequências:** Agente Compras direciona corretamente para Josemar. Agente Comercial continua usando `montarLinkWhatsApp`.

---

## [DEC-023] — Facilitador com few-shot learning para distinção comercial/compras
**Data:** 01/06/2026
**Status:** Ativa
**Contexto:** Modelo classificava incorretamente mensagens ambíguas entre comercial e compras.
**Decisão:** Substituir regras abstratas por exemplos concretos (few-shot) no prompt do Facilitador.
**Consequências:** Classificação mais precisa para casos ambíguos. Novos casos fora dos exemplos ainda podem falhar — monitorar via painel.

---

## [DEC-024] — Refatoração dos prompts com técnicas de Prompt Engineering
**Data:** 02/06/2026
**Status:** Ativa
**Contexto:** Prompts da Suh (v1.0) e do Facilitador (v1.0) tinham conflitos internos, ausência de chain-of-thought, duplicação de seções e hierarquia implícita de regras.
**Decisão:** Refatorar ambos os prompts para v2.0 aplicando: hierarquia explícita de regras, chain-of-thought estruturado, few-shot nos fluxos críticos, formato de saída declarado e eliminação de redundâncias.
**Consequências:** Comportamento mais previsível em casos de borda. Prompts menores ou iguais ao original. Versão atualizada para `comercial-v2` e `facilitador-v2`.

---

## [DEC-025] — Facilitador migrado para gemini-3.1-flash-lite
**Data:** 02/06/2026
**Status:** Ativa
**Contexto:** Gemini 2.5 Flash em preview causa 503 frequentes em horário de pico americano. O Facilitador consumia as 3 tentativas de retry antes de cair no fallback, deixando o agente principal sem margem. Gemini 1.5 Flash já foi desligado (404). Flash 2.5 Lite descartado por qualidade insuficiente (DEC-021).
**Decisão:** Facilitador migrado para `gemini-3.1-flash-lite` — modelo GA, estável, sem instabilidade de preview. Suficiente para classificação com few-shot. `route.ts` corrigido para passar `agente.config.modelo` para `chamarGeminiComRetry` em vez de hardcodar `gemini-2.5-flash`.
**Consequências:** Zero 503 no Facilitador em testes. Agente principal mantém suas 3 tentativas intactas. Risco residual: qualidade de classificação em casos muito ambíguos — monitorar via painel.

---

## [DEC-026] — Representante de SP alterado para Lúcio; demais estados para Roberto Pereira
**Data:** 02/06/2026
**Status:** Ativa
**Contexto:** Anderson Nonato sobrecarregado. Sem lista completa de representantes por estado definida pela diretoria.
**Decisão:** SP: Lúcio (`5511996595400`). Demais estados sem representante exclusivo: Roberto Pereira (`5549999276041`). Anderson Nonato mantido exclusivamente para parcerias e representação comercial.
**Consequências:** Roteamento provisório até definição da lista completa com a diretoria. Inconsistência residual no bloco de pedido formal (`route.ts`) que ainda usa Anderson como fallback — corrigir na próxima sessão.
