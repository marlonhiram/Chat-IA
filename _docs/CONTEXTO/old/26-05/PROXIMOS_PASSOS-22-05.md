# PRÓXIMOS PASSOS — DKN Chat (Suh)
> Última atualização: 22/05/2026

## PENDÊNCIAS TÉCNICAS (bugs e dívidas)

- **Facilitador falhando no parse com frequência**: logs mostram "Facilitador falhou no parse, usando padrão: comercial" em quase todas as requisições. O Facilitador está funcionando como ornamento — a classificação cai sempre no fallback. Investigar se o prompt do Facilitador está retornando JSON válido ou se o modelo está adicionando texto antes/depois do JSON.

- **Extração de dados por regex instável**: nome, cidade, UF e empresa extraídos por regex em `google-sheets.ts` e `ChatWidget.tsx` — falha em frases não previstas. Substituir por chamada LLM dedicada para extração estruturada seria mais confiável. Curto prazo: testar com conversas reais e ajustar padrões.

- **Google Sheets sem proteção contra concorrência**: duas sessões simultâneas gravando na mesma planilha podem gerar conflito de linha. Sem impacto no volume atual de testes, mas risco real em produção com múltiplos usuários simultâneos.

- **Logs da Vercel somem após 1 hora (plano Hobby)**: sem monitoramento persistente de erros em produção. Erros 503, MAX_TOKENS e falhas no Sheets são invisíveis após esse período.

- **Tag [TRABALHE_CONOSCO] inconsistente**: Suh nem sempre adiciona a tag ao mencionar vagas. Reforçar no prompt e validar nos testes.

---

## FUNCIONALIDADES A IMPLEMENTAR

1. **Completar Agente Financeiro** — aguardando informações do departamento: dados bancários, política de juros, como solicitar NF, contatos.

2. **Completar Agente RH** — aguardando informações: vagas abertas, benefícios, horário, processo seletivo, contato do RH.

3. **Completar Agente Transporte (Trans Modena)** — aguardando: regiões atendidas, como rastrear, contato, dúvidas frequentes.

4. **Lista completa de representantes** — receber ~20 representantes com estado(s) de cobertura e WhatsApp. Adicionar no prompt da Suh.

5. **Confirmar distribuidores** — verificar se contatos são WhatsApp ou fixo; definir cobertura Jean vs TNT Paraná no PR; definir fallback para estados sem distribuidor.

6. **Versão robótica do chat (A/B)** — criar agente alternativo sem persona Suh para comparação de performance com usuários reais.

7. **Integração WordPress** — embedar chat via iframe/widget no site sulbrasiltnt.com.br usando Elementor 2.28. Sem acesso ao servidor WP.

8. **Formulário Trabalhe Conosco** — criar página/formulário para substituir o link `/trabalhe-conosco` atual que não existe.

9. **Few-Shot Learning** — após coletar conversas reais bem-sucedidas marcadas como Sucesso no painel, adicionar exemplos no prompt da Suh para melhorar qualidade das respostas.

10. **Separar planilha de testes e produção** — criar aba ou planilha separada para testes automatizados não poluírem dados reais.

11. **Extração de dados via LLM** — substituir regex de extração de nome, cidade, UF e empresa por chamada LLM dedicada. Mais confiável, elimina falhas em frases não previstas. Avaliar custo adicional vs ganho de precisão.

---

## ANTES DO LANÇAMENTO (checklist obrigatório)

- [ ] Variáveis de ambiente confirmadas na Vercel (GEMINI_API_KEY, GOOGLE_*, PAINEL_SENHA)
- [ ] `npm run build` sem erros de TypeScript
- [ ] Testes automatizados com taxa ≥ 80%
- [ ] Teste manual de todas as tags de ação ([WHATSAPP], [DISTRIBUIDOR], [TRABALHE_CONOSCO], [PAGINA_EMPRESA])
- [ ] Verificar link WhatsApp pré-preenchido com dados corretos e número do representante correto por estado
- [ ] Rate limiting testado (20 msgs/hora)
- [ ] Timeout de 9s validado em produção
- [ ] Google Sheets registrando conversas corretamente (15 colunas A-O)
- [ ] Painel `/painel` acessível com senha e exibindo dados reais
- [ ] Deploy na Vercel com Node.js 20.x confirmado
- [ ] `vercel.json` com maxDuration: 30 para `/api/chat`
- [ ] URL de produção compartilhada com Diretor de Planejamento para aprovação
- [ ] Domínio customizado configurado (quando aprovado)
- [ ] Monitoramento de erros via logs da Vercel
