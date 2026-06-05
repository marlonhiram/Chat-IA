# DECISÕES TÉCNICAS — DKN Chat Widget (Integração WordPress)
> Última atualização: 03/06/2026

## [DEC-001] — Vite como bundler do widget (separado do Next.js)
**Data:** 03/06/2026
**Status:** Ativa
**Contexto:** O Next.js não suporta exportação de componentes como bundle IIFE standalone. Era necessário uma ferramenta de build separada para compilar o `ChatWidget.tsx` em um arquivo JavaScript único que funcione em qualquer contexto (WordPress, iframe, HTML puro).
**Decisão:** Vite com `@vitejs/plugin-react` em modo `library`, formato `iife`, entry point em `widget/main.tsx`. Build separado do Next.js via script `build:widget`.
**Consequências:** Zero impacto no build do Next.js. Dois processos de build independentes no mesmo repositório. O `npm run build` continua buildando o Next.js normalmente; `npm run build:widget` gera apenas o widget.

---

## [DEC-002] — Web Component com Shadow DOM para isolamento de CSS
**Data:** 03/06/2026
**Status:** Ativa
**Contexto:** O WordPress usa temas com CSS global agressivo que poderia quebrar o visual do widget. Era necessário garantir isolamento total.
**Decisão:** `ChatWidget.tsx` encapsulado em um `HTMLElement` customizado (`DknChatElement`) registrado via `customElements.define('dkn-chat', ...)`. Shadow DOM com `mode: 'open'` garante que o CSS do WordPress não penetra no widget.
**Consequências:** CSS do widget completamente isolado. Estilos do WordPress não afetam o chat. Contra: fontes externas (Nunito) precisam ser importadas dentro do Shadow DOM via `@import`, não aproveitam cache do documento pai.

---

## [DEC-003] — Remoção da cópia automática de estilos externos no Shadow DOM
**Data:** 03/06/2026
**Status:** Ativa
**Contexto:** A implementação inicial copiava todos os `<link rel="stylesheet">` e `<style>` do documento pai para dentro do Shadow DOM. Em ambiente `file://` (teste local) isso causava erros de CORS. No WordPress poderia copiar estilos indesejados do tema.
**Decisão:** Remover o bloco `document.querySelectorAll('link[rel="stylesheet"], style').forEach(...)`. O widget usa exclusivamente seus próprios estilos inline definidos no `ChatWidget.tsx`.
**Consequências:** Widget visualmente autossuficiente. Teste via `file://` funciona sem erros. Contra: qualquer estilo que o widget precise deve ser declarado explicitamente — não herda nada do ambiente hospedeiro.

---

## [DEC-004] — URL da API via variável de ambiente com fallback hardcoded
**Data:** 03/06/2026
**Status:** Ativa
**Contexto:** A URL `project-0qgvo.vercel.app` é provisória e pode mudar quando um domínio customizado for configurado. Hardcodar a URL diretamente no código exigiria editar o fonte a cada mudança de domínio.
**Decisão:** `process.env.NEXT_PUBLIC_CHAT_API_URL` com fallback para `https://project-0qgvo.vercel.app`. O Vite substitui a variável em build time. Para trocar de domínio basta setar a variável antes do build.
**Consequências:** Troca de domínio sem alteração de código. O bundle gerado contém a URL resolvida em build time — não é dinâmico em runtime.

---

## [DEC-005] — React e ReactDOM embutidos no bundle (sem external)
**Data:** 03/06/2026
**Status:** Ativa
**Contexto:** O WordPress não tem React disponível globalmente. O widget precisa funcionar em qualquer página sem dependências externas.
**Decisão:** `rollupOptions.external: []` — React e ReactDOM são incluídos no bundle IIFE.
**Consequências:** Bundle de ~484 KB (150 KB gzip). Aceitável para o caso de uso. Se o site WordPress já carregasse React, haveria duplicação — não é o caso aqui.

---

## [DEC-006] — Arquivo estático servido pela Vercel (sem CDN separado)
**Data:** 03/06/2026
**Status:** Ativa
**Contexto:** O bundle gerado (`public/chat-widget.iife.js`) precisa ser acessível publicamente por URL. Opções avaliadas: CDN dedicado (jsDelivr, CloudFront), subdomínio separado, ou aproveitar o próprio `/public` do Next.js na Vercel.
**Decisão:** Arquivo em `public/` do projeto Next.js. A Vercel serve automaticamente qualquer arquivo em `/public` como estático na raiz do domínio.
**Consequências:** Zero infraestrutura extra. Deploy do widget acontece junto com o deploy do Next.js. Contra: o arquivo de 484 KB fica versionado no repositório Git — aumenta o tamanho do repo ao longo do tempo.
