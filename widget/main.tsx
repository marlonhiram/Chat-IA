import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChatWidget } from '@/components/ChatWidget';

class AiChatElement extends HTMLElement {
  private root: ReturnType<typeof ReactDOM.createRoot> | null = null;

  connectedCallback() {
    // Shadow DOM isola o CSS do WordPress completamente
    const shadow = this.attachShadow({ mode: 'open' });

    // Injeta as fontes e estilos globais do chat dentro do shadow root
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
    `;
    shadow.appendChild(style);

    // Copia as classes CSS globais do Next.js para dentro do shadow root
    //document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
    //  shadow.appendChild(el.cloneNode(true));
    //});

    const container = document.createElement('div');
    shadow.appendChild(container);

    this.root = ReactDOM.createRoot(container);
    this.root.render(<ChatWidget />);
  }

  disconnectedCallback() {
    this.root?.unmount();
  }
}

// Registra o Web Component — o WordPress só precisa colocar <ai-chat-widget> no HTML
if (!customElements.get('ai-chat-widget')) {
  customElements.define('ai-chat-widget', AiChatElement);
}