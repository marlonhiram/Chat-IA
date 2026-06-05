# PRÓXIMOS PASSOS — DKN Chat (Suh)
> Última atualização: 01/06/2026

## EM ANDAMENTO (retomar aqui na próxima sessão)

N/A — sessão encerrada sem feature em andamento. Todas as correções da sessão foram concluídas.

---

## PENDÊNCIAS TÉCNICAS (bugs e dívidas)

- **Executar bateria de testes T01-T18** — nenhum teste foi executado formalmente após as correções da sessão de 01/06/2026. Prioridade alta antes do deploy em produção.
  - Arquivos envolvidos: todos os módulos (`route.ts`, `ChatWidget.tsx`, `facilitador.ts`, `compras.ts`)

- **Validar classificação do Facilitador com casos reais** — prompt atualizado com few-shot em 01/06/2026. Monitorar via painel se casos ambíguos (fornecedor apresentando produto) continuam sendo classificados corretamente.
  - Arquivo: `lib/agents/facilitador.ts`

- **Confirmar botão WhatsApp do Josemar em produção** — alteração feita em `ChatWidget.tsx` (extração de link `wa.me` da resposta). Testar T09 em ambiente de produção após deploy.

---

## FUNCIONALIDADES A IMPLEMENTAR

1. **Agente Financeiro** — aguardando dados do departamento financeiro da GSB
   - Arquivo a criar: `lib/agents/financeiro.ts`
   - Registrar no `index.ts` e `tipos.ts`

2. **Agente Transporte** — nome: Trans Modena, aguardando detalhes de contato e horários
   - Arquivo a criar: `lib/agents/transporte.ts`
   - Registrar no `index.ts` e `tipos.ts`

3. **Lista completa de representantes** (~20 representantes com estado e WhatsApp)
   - Arquivo envolvido: `lib/agents/comercial.ts` (prompt da Suh)
   - Confirmar cobertura Jean vs TNT Paraná no PR
   - Definir fallback para estados sem representante

4. **Endereço real da GSB no agente RH** — substituir endereço de teste
   - Arquivo: `lib/agents/rh.ts`

5. **Few-Shot Learning com conversas reais** — usar conversas aprovadas no painel para melhorar prompt da Suh
   - Arquivo: `lib/agents/comercial.ts`

6. **Embedar chat no WordPress via Elementor** — integração via iframe/widget

7. **Versão robótica (sem persona Suh)** — para comparação A/B com a versão atual

8. **Formulário Trabalhe Conosco** — página `/trabalhe-conosco` referenciada pela tag `[TRABALHE_CONOSCO]`

---

## ANTES DO LANÇAMENTO (checklist obrigatório)

- [ ] Executar bateria de testes T01-T18 completa em ambiente local
- [ ] Executar testes T01-T18 em ambiente de produção (Vercel)
- [ ] Confirmar todas as variáveis de ambiente na Vercel (especialmente `GOOGLE_PRIVATE_KEY` com aspas duplas)
- [ ] Confirmar limite de gasto mensal no Google AI Studio (recomendado: R$30,00)
- [ ] Separar planilha de testes da planilha de produção
- [ ] Validar lista de representantes com equipe comercial antes do lançamento
- [ ] Confirmar números de WhatsApp de todos os distribuidores (Dem Bas e LJ Distribuição podem ser fixo)
- [ ] Substituir endereço de teste pelo endereço real no agente RH
- [ ] Implementar monitoramento persistente de erros (logs da Vercel somem após 1h no plano Hobby)
- [ ] Testar embed via iframe no WordPress antes de lançar para usuários reais
