# PRÓXIMOS PASSOS — DKN Chat Widget (Integração WordPress)
> Última atualização: 03/06/2026

## EM ANDAMENTO (retomar aqui na próxima sessão)
**Correção da URL da API no ChatWidget.tsx**
- Arquivo: `components/ChatWidget.tsx` — linha 36
- Como está: `const res = await fetch('/api/chat', {`
- Como deve ficar: `const res = await fetch(`${API_URL}/api/chat`, {`
- O `API_URL` já está declarado na linha 35 — só falta usá-lo no fetch
- Após corrigir: `npm run build:widget` → `git add . && git commit && git push`

## PENDÊNCIAS TÉCNICAS (bugs e dívidas)
- **URL relativa da API:** widget ainda chama `/api/chat` em vez de URL absoluta — causa falha silenciosa no WordPress (ver EM ANDAMENTO acima)
- **Créditos Gemini esgotados:** API retornando 429. Independente do widget, mas bloqueia validação end-to-end. Recarregar créditos na conta Google AI Studio.

## FUNCIONALIDADES A IMPLEMENTAR
1. **Inserção no WordPress via Elementor** — após correção da URL e créditos disponíveis:
   - Acessar WordPress > Elementor > Footer (ou Custom Code)
   - Adicionar bloco HTML com:
     ```html
     <script src="https://project-0qgvo.vercel.app/chat-widget.iife.js" defer></script>
     <dkn-chat></dkn-chat>
     ```
   - Validar que o botão aparece em todas as páginas do site

2. **Validação end-to-end no WordPress** — confirmar:
   - Widget renderiza visualmente com estilos corretos
   - Mensagens chegam na API e retornam resposta da Suh
   - Botões de WhatsApp funcionam
   - Não há conflito de CSS com o tema WordPress

3. **Configurar domínio customizado na Vercel** — quando disponível:
   - Apontar DNS para Vercel
   - Rebuildar widget: `NEXT_PUBLIC_CHAT_API_URL=https://novodominio.com npm run build:widget`
   - Push e validar nova URL no WordPress

## ANTES DO LANÇAMENTO (checklist obrigatório)
- [ ] Correção da URL da API aplicada e buildada
- [ ] Créditos Gemini recarregados e API respondendo
- [ ] Widget testado no WordPress em ambiente de produção
- [ ] Validar que o widget não quebra o layout em mobile
- [ ] Validar que o widget não interfere no SEO/Core Web Vitals do site
- [ ] Confirmar URL definitiva da Vercel (ou domínio customizado) antes de divulgar
