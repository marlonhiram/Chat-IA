# DECISÕES TÉCNICAS — DKN Chat (Suh)
> Última atualização: 19/05/2026

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
**Contexto:** Múltiplos agentes necessários (Facilitador, Comercial, Financeiro, RH, Transporte). Avaliar uso de LangChain ou CrewAI.  
**Decisão:** Agentes como objetos TypeScript em `lib/agents/`. Sem LangChain, sem CrewAI.  
**Consequências:** Zero dependências extras. Controle total do fluxo. Agentes independentes (não colaborativos) — correto para o caso de uso. Migração para framework mais complexa se necessário no futuro.

---

## [DEC-003] — Persona "Suh" para o agente comercial
**Data:** 12/05/2026  
**Status:** Ativa  
**Contexto:** Debate sobre ter ou não persona humanizada. Risco ético de enganar cliente.  
**Decisão:** Persona Suh com honestidade — confirma ser IA se perguntada diretamente. Tom natural mas sem fingir ser humana.  
**Consequências:** Melhor experiência do usuário. Sem risco jurídico (LGPD). Temperatura 0.2 para reduzir alucinações mantendo naturalidade mínima.

---

## [DEC-004] — Chamadas paralelas Facilitador + Comercial
**Data:** 19/05/2026  
**Status:** Ativa  
**Contexto:** Vercel Hobby limita funções serverless a 10s. Chamadas sequenciais (Facilitador → Especialista) somavam 5-8s, causando timeouts com latência do Gemini.  
**Decisão:** `Promise.allSettled([facilitador, comercial])` em paralelo. Se tipo classificado for 'comercial', usa resposta já pronta. Caso contrário, chama agente correto.  
**Consequências:** Tempo total reduzido para ~3-4s. Custo dobrado para mensagens comerciais (duas chamadas ao Gemini). Trade-off aceito dado o volume baixo e custo irrisório.

---

## [DEC-005] — Google Sheets como armazenamento de histórico
**Data:** 19/05/2026  
**Status:** Ativa  
**Contexto:** Necessidade de capturar histórico de conversas para fase de testes e análise de erros. Banco de dados relacional adiado para pós-aprovação do MVP.  
**Decisão:** Google Sheets via googleapis SDK com Service Account. Uma linha por sessão, atualizada a cada mensagem.  
**Consequências:** Zero custo. Visível em tempo real. Não escala para alto volume (latência de escrita visível). Migração para PostgreSQL prevista após aprovação.

---

## [DEC-006] — GOOGLE_PRIVATE_KEY com aspas duplas na Vercel
**Data:** 19/05/2026  
**Status:** Ativa  
**Contexto:** Chave privada PKCS#8 gerada pelo Google Cloud causava erro `DECODER routines::unsupported` na Vercel com Node.js 20, mas funcionava localmente.  
**Decisão:** Salvar o valor da variável com aspas duplas literais no painel da Vercel. Código remove as aspas e normaliza `\n` antes de usar.  
**Consequências:** Gambiarra necessária. Documentado para não ser revertido acidentalmente. Qualquer redeploy que resetar a variável perderá as aspas.

---

## [DEC-007] — salvarConversa com await (não em background)
**Data:** 19/05/2026  
**Status:** Ativa  
**Contexto:** Vercel encerra funções serverless imediatamente após o `return`. Chamada em background (`.catch(() => {})`) era cortada antes de salvar no Sheets.  
**Decisão:** `await Promise.allSettled([salvarConversa(...)])` antes do `return`, garantindo que o Sheets seja salvo antes da função encerrar.  
**Consequências:** Adiciona ~500ms-1s de latência por request. Aceitável dado o limite de 30s configurado no `vercel.json`.
