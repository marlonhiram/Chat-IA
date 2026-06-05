# PRÓXIMOS PASSOS — DKN Chat (Suh)
> Última atualização: 02/06/2026

---

## EM ANDAMENTO (retomar aqui na próxima sessão)

N/A — sessão encerrada sem feature em andamento. Todas as alterações desta sessão foram concluídas e testadas.

---

## PENDÊNCIAS TÉCNICAS (bugs e dívidas)

- **Fluxo pedido formal inconsistente**: em `route.ts`, o bloco de pedido formal com CNPJ usa Anderson Nonato como fallback para UF não mapeada. O fluxo padrão da Suh usa Roberto Pereira como fallback. Alinhar os dois fluxos.
  - Arquivo: `app/api/chat/route.ts` — bloco `isPedidoFormal`

- **Suh encaminha representante em vez de distribuidor para metragem avulsa**: em conversas onde o cliente pede metragem avulsa abaixo do mínimo e já informou estado, a Suh pode priorizar o encaminhamento por estado. Regra já está no prompt — monitorar se persiste.
  - Arquivo: `lib/agents/comercial.ts` — seção GRAMATURAS E BOBINAS

---

## FUNCIONALIDADES A IMPLEMENTAR

1. **Agente Financeiro** — aguardando dados do departamento financeiro para montar o prompt
2. **Agente Transporte** — Trans Modena, aguardando detalhes operacionais
3. **Lista completa de representantes** — ~20 representantes com estado e WhatsApp; substituir fallback atual do Roberto Pereira por roteamento preciso
4. **Formulário Trabalhe Conosco** — página `/trabalhe-conosco` referenciada pela tag [TRABALHE_CONOSCO]
5. **Few-Shot Learning com conversas reais** — usar conversas aprovadas no painel para enriquecer exemplos dos agentes
6. **Versão robótica (sem persona Suh)** — para comparação A/B de conversão
7. **Embed no WordPress via Elementor** — iframe/widget para integração com o site principal

---

## ANTES DO LANÇAMENTO (checklist obrigatório)

- [ ] Separar planilha de testes da planilha de produção
- [ ] Confirmar `GOOGLE_PRIVATE_KEY` com aspas duplas no painel da Vercel de produção
- [ ] Confirmar todos os links de WhatsApp dos representantes com a diretoria
- [ ] Confirmar endereço real no agente RH (atualmente endereço de teste)
- [ ] Confirmar se contatos Dem Bas e LJ Distribuição são WhatsApp ou fixo
- [ ] Implementar monitoramento persistente de erros (substituir logs da Vercel que somem após 1h)
- [ ] Migrar Google Sheets para PostgreSQL (quando volume justificar)
- [ ] Testar toda a bateria de testes em produção após deploy
- [ ] Validar limite de rate limiting em produção (20 msgs/hora por IP)
