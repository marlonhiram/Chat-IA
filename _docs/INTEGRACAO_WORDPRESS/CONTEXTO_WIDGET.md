# CONTEXTO DO PROJETO — DKN Chat Widget (Integração WordPress)
> Última atualização: 03/06/2026

## 1. Visão Geral
Extração do `ChatWidget.tsx` do projeto Next.js principal (DKN Chat) como Web Component standalone, compilado via Vite em formato IIFE, hospedado na Vercel como arquivo estático e embedável no WordPress com uma única linha de código.

Este contexto é separado do contexto principal do DKN Chat (`CONTEXTO.md`). Cobre exclusivamente a camada de distribuição do widget — build, deploy e integração WordPress.

## 2. Contas e Serviços
- **Vercel:** projeto `dkn-chat` — https://project-0qgvo.vercel.app
- **GitHub:** https://github.com/marlonhiram/dkn-chat (branch `main`)
- **WordPress:** https://sulbrasiltnt.com.br (Elementor instalado)

## 3. Stack Técnica
| Tecnologia | Versão | Papel | Fixo? |
|---|---|---|---|
| Next.js | 16.2.6 | Framework principal | Sim |
| React | 18 | UI | Sim |
| TypeScript | 5.9.3 | Linguagem | Sim |
| Vite | 5.4.x | Build do widget standalone | Sim |
| @vitejs/plugin-react | 4.3.x | Suporte JSX no Vite | Sim |
| Web Components (customElements) | nativo | Registro do elemento `<dkn-chat>` | Sim |
| Shadow DOM | nativo | Isolamento de CSS | Sim |

## 4. Variáveis de Ambiente
| Variável | Onde | Descrição |
|---|---|---|
| `NEXT_PUBLIC_CHAT_API_URL` | Build do widget (opcional) | URL base da API. Fallback: `https://project-0qgvo.vercel.app` |

Para trocar a URL da API sem alterar código:
```bash
NEXT_PUBLIC_CHAT_API_URL=https://novodominio.com npm run build:widget
```

## 5. Arquitetura e Design de Sistema
**Arquitetura desacoplada (Decoupled Architecture):**
- Next.js/Vercel: backend + API serverless + arquivo estático do widget
- WordPress: apenas hospeda o script — zero processamento de IA
- Widget: Web Component com Shadow DOM, carregado assincronamente via `<script defer>`

**Fluxo de comunicação:**
1. Browser carrega WordPress
2. `<script defer>` baixa `chat-widget.iife.js` da Vercel
3. Web Component registra `<dkn-chat>` e renderiza o botão flutuante
4. Usuário interage → widget faz POST direto para `/api/chat` na Vercel
5. WordPress nunca processa mensagens

## 6. Banco de Dados
N/A — este módulo não possui banco de dados próprio. Histórico de conversas gerenciado pelo contexto principal.

## 7. Autenticação e Permissões
N/A — o widget é público, sem autenticação.

## 8. Integrações Externas
| Serviço | Finalidade | Como é chamado |
|---|---|---|
| Vercel | Hospeda `chat-widget.iife.js` como arquivo estático | Acesso direto via URL pública |
| `/api/chat` (Vercel) | Processa mensagens da Suh | POST via `fetch` no widget |
| Google Fonts | Carrega fonte Nunito | `@import` dentro do Shadow DOM |

## 9. Estrutura de Pastas
```
dkn-chat/
├── components/
│   └── ChatWidget.tsx          # Componente React — fonte do widget
├── widget/
│   ├── main.tsx                # Entry point do Web Component
│   └── vite.config.ts          # Config do build standalone
├── public/
│   └── chat-widget.iife.js     # Bundle gerado — servido pela Vercel
├── package.json                # Script build:widget adicionado
└── ...                         # Demais arquivos do Next.js principal
```

## 10. Fluxos Implementados

**Build do widget:**
```bash
npm run build:widget
# Gera: public/chat-widget.iife.js (~484 KB / ~150 KB gzip)
```

**Deploy:**
```bash
git add .
git commit -m "mensagem"
git push origin main
# Vercel detecta o push e faz deploy automático
```

**Embed no WordPress (linha única):**
```html
<script src="https://project-0qgvo.vercel.app/chat-widget.iife.js" defer></script>
<dkn-chat></dkn-chat>
```

## 11. Contratos de Interface
O widget faz uma única chamada:

```
POST https://project-0qgvo.vercel.app/api/chat
Content-Type: application/json

{
  "messages": [{ "role": "user"|"assistant", "content": string }],
  "sessionId": string
}
```

Resposta esperada:
```json
{
  "content": [{ "type": "text", "text": string }]
}
```

## 12. Ambiente, Deploy e CI/CD
| Ambiente | URL | Deploy |
|---|---|---|
| Produção | https://project-0qgvo.vercel.app | Automático via push no GitHub (`main`) |

**Pré-requisitos para rebuild do widget:**
1. Instalar dependências: `npm install`
2. Buildar: `npm run build:widget`
3. Commitar e pushar — Vercel faz deploy automático

**Verificar se o widget está no ar:**
```
https://project-0qgvo.vercel.app/chat-widget.iife.js
```
Deve retornar JavaScript. Se retornar 404, o deploy não concluiu.

## 13. Middleware e Interceptors
N/A — o widget não possui middleware próprio.

## 14. Riscos e Limitações Conhecidas
- **CSS sem Next.js:** ao testar via `file://` local, o widget renderiza sem estilos visuais. Comportamento esperado — o CSS das classes Tailwind/Next só existe no ambiente Vercel. No WordPress funcionará corretamente.
- **Shadow DOM e estilos externos:** a cópia automática de `<link>` e `<style>` do documento pai foi removida intencionalmente para evitar erros de CORS em `file://`. O widget usa apenas os estilos inline definidos no `ChatWidget.tsx`.
- **Domínio Vercel provisório:** a URL `project-0qgvo.vercel.app` é provisória. Quando o domínio customizado for configurado, é necessário rebuildar o widget com a nova URL via variável de ambiente.
- **Tamanho do bundle:** 484 KB (150 KB gzip) — React e ReactDOM estão embutidos no bundle. Aceitável para o caso de uso atual.

## 15. Pendências Abertas
- Aplicar correção da URL da API no `ChatWidget.tsx` (linha 36): trocar `/api/chat` por `${API_URL}/api/chat`
- Fazer rebuild e push após a correção acima
- Inserir o script no WordPress via Elementor e validar em produção
- Validar funcionamento completo quando créditos da API Gemini forem recarregados
- Configurar domínio customizado na Vercel (quando disponível) e rebuildar widget com nova URL
