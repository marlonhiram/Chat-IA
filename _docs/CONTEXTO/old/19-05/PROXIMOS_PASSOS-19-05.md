# PRÓXIMOS PASSOS — DKN Chat (Suh)
> Última atualização: 19/05/2026

## PENDÊNCIAS TÉCNICAS (bugs e dívidas)

- **ChatWidget.tsx — build com erro de TypeScript**: verificar se o arquivo atual compila sem erros após as últimas alterações nas funções `extrairDadosConversa` e `montarLinkWhatsApp`. Rodar `npm run build` antes do próximo deploy.

- **Regex de extração de dados instável**: nome, cidade, UF e empresa extraídos por regex — falha em frases não previstas. Testar com conversas reais e ajustar padrões conforme necessário.

- **Google Sheets — cabeçalho desatualizado**: planilha foi criada com estrutura antiga (sem colunas Cidade e UF separadas). Limpar a planilha manualmente deixando só o cabeçalho para que o código recrie com 12 colunas corretas.

- **Tag [TRABALHE_CONOSCO] inconsistente**: Suh nem sempre adiciona a tag ao mencionar vagas. Reforçar no prompt e validar nos testes.

- **Temperatura da Suh**: atualmente 0.2 no `comercial.ts` mas pode ter ficado 0.3 em alguma edição. Verificar valor atual no arquivo.

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

9. **Few-Shot Learning** — após coletar conversas reais bem-sucedidas, adicionar exemplos no prompt da Suh para melhorar qualidade das respostas.

10. **Separar planilha de testes e produção** — criar aba ou planilha separada para testes automatizados não poluírem dados reais.

---

## ANTES DO LANÇAMENTO (checklist obrigatório)

- [ ] Variáveis de ambiente confirmadas na Vercel (GEMINI_API_KEY, GOOGLE_*)
- [ ] `npm run build` sem erros de TypeScript
- [ ] Testes automatizados com taxa ≥ 80%
- [ ] Teste manual de todas as tags de ação ([WHATSAPP], [DISTRIBUIDOR], [TRABALHE_CONOSCO], [PAGINA_EMPRESA])
- [ ] Verificar link WhatsApp pré-preenchido com dados corretos
- [ ] Rate limiting testado (20 msgs/hora)
- [ ] Timeout de 9s validado em produção
- [ ] Google Sheets registrando conversas corretamente
- [ ] Planilha com cabeçalho atualizado (12 colunas)
- [ ] Deploy na Vercel com Node.js 20.x confirmado
- [ ] `vercel.json` com maxDuration: 30 para `/api/chat`
- [ ] URL de produção compartilhada com Diretor de Planejamento para aprovação
- [ ] Domínio customizado configurado (quando aprovado)
- [ ] Monitoramento de erros via logs da Vercel
