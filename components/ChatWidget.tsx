'use client';

import React, { useState } from 'react';

const TRABALHE_LINK = '/trabalhe-conosco';
const EMPRESA_LINK  = '/empresa';

export function ChatWidget() {
  const [open, setOpen]     = useState(false);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const endRef              = React.useRef<HTMLDivElement>(null);

  const [sessionId] = useState(() =>
    `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );

  const [msgs, setMsgs] = useState([
    { role: 'assistant', content: 'Olá! Como posso ajudar você hoje? 😊' }
  ]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  const send = async () => {
    if (!input.trim() || typing) return;
    const txt  = input.trim();
    const next = [...msgs, { role: 'user', content: txt }];
    setMsgs(next);
    setInput('');
    setTyping(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL ?? 'https://project-0qgvo.vercel.app';
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, sessionId })
      });
      const data = await res.json();
      const respostaTexto = data.content?.[0]?.text;

      const ultimasMensagens = next.slice(-4);
      const falhasConsecutivas = ultimasMensagens
        .filter(m => m.role === 'assistant' && m.content.includes('pode enviar sua mensagem novamente'))
        .length;

      const mensagemFallback = falhasConsecutivas >= 1
        ? `Estou com dificuldades técnicas no momento. Para não te deixar sem atendimento, fale diretamente com nossa equipe pelo WhatsApp! 😊\n[WHATSAPP]`
        : 'Estou iniciando o atendimento, pode enviar sua mensagem novamente! 😊';

      setMsgs([...next, {
        role: 'assistant',
        content: respostaTexto ?? mensagemFallback
      }]);
    } catch {
      setMsgs([...next, {
        role: 'assistant',
        content: 'Estou iniciando o atendimento, pode enviar sua mensagem novamente! 😊'
      }]);
    } finally {
      setTyping(false);
    }
  };

  // ── Extrai dados da conversa ──────────────────────────────────────────────
  function extrairDadosConversa(mensagens: { role: string; content: string }[]) {
    const todasRespostas = mensagens
      .filter(m => m.role === 'assistant')
      .map(m => m.content)
      .join(' ');

    const segMatch = todasRespostas.match(/\[SEG:([^\]]+)\]/);
    const segmento = segMatch ? segMatch[1] : null;

    const nomePatterns = [
      // "meu nome é X", "me chamo X", etc.
      /(?:meu nome [eé]|me chamo|aqui [eé] o?a?|sou o?a?|pode me chamar de)\s+([A-ZÀ-Úa-záàâãéèêíïóôõúüç][A-Za-z0-9áàâãéèêíïóôõúüç]{1,30}(?:\s[A-ZÀ-Úa-záàâãéèêíïóôõúüç][A-Za-z0-9áàâãéèêíïóôõúüç]{1,30})?)/i,
      // Cliente se apresenta: "sou a Marcela", "sou o João", "aqui é a Ana"
      /(?:sou a|sou o|aqui é a|aqui é o|me chamo)\s+([A-ZÀ-Úa-záàâãéèêíïóôõúüç][A-Za-z0-9áàâãéèêíïóôõúüç]{2,30})/i,
      // Resposta direta ao pedido de nome — só o nome na mensagem, com ou sem sobrenome
      /^([A-ZÀ-Úa-záàâãéèêíïóôõúüç][a-záàâãéèêíïóôõúüç]{2,20}(?:\s[A-ZÀ-Úa-záàâãéèêíïóôõúüç][a-záàâãéèêíïóôõúüç]{2,20})?)\.?$/i,
    ];


    const todasMensagensUsuario = mensagens
      .filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ');

    let nome = '—';
    for (const pattern of nomePatterns) {
      const m = todasMensagensUsuario.match(pattern);
      if (m) { nome = m[1].trim(); break; }
    }

    

    const cidadeEstadoMatch = todasMensagensUsuario.match(
      /(?:falo de|sou de|estou em|fico em|moro em|cidade[:\s]+|estado[:\s]+)?\s*([A-ZÀ-Úa-záàâãéèêíïóôõúüç]{2,20}(?:\s[A-ZÀ-Úa-záàâãéèêíïóôõúüç]{2,20})?)[,\/\s-]+\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i
    ) ?? todasMensagensUsuario.match(
      /\b([A-ZÀ-Úa-záàâãéèêíïóôõúüç]{3,20}(?:\s[A-ZÀ-Úa-záàâãéèêíïóôõúüç]{3,20})?)[,\s\/]+\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i
    );
    const ufMatch = todasMensagensUsuario.match(/\b([A-Z]{2})\b/);
    const cidade = cidadeEstadoMatch ? cidadeEstadoMatch[1].trim() : null;
    const uf = cidadeEstadoMatch
      ? cidadeEstadoMatch[2]
      : (ufMatch ? ufMatch[1] : null);
    const localidade = cidade && uf
      ? `${cidade}/${uf}`
      : uf ?? null;

    const empresaMatch = todasRespostas.match(
      /(?:da|pela|representando a?|empresa)\s+([A-ZÀ-Ú][A-Za-záàâãéèêíïóôõúüç\s]+?)(?:\s*[,!.]|\s*que|\s*aqui)/
    );
    const empresaBruta = empresaMatch ? empresaMatch[1].trim() : null;
    const empresasIgnorar = ['[EMPRESA]', '[MARCA]', '[AGENTE]'];
    const empresa = empresaBruta && !empresasIgnorar.some(e => empresaBruta.includes(e))
      ? empresaBruta
      : null;

    return { nome, localidade, segmento, empresa };
  }

  // ── Monta link do WhatsApp ────────────────────────────────────────────────
  function montarLinkWhatsApp(mensagens: { role: string; content: string }[]) {
    const { nome, localidade, segmento, empresa } = extrairDadosConversa(mensagens);

    // Tenta extrair link do representante da última mensagem da Suh
    const ultimaResposta = [...mensagens].reverse().find(m => m.role === 'assistant')?.content ?? '';
    const linkMatch = ultimaResposta.match(/https?:\/\/(wa\.me|api\.whatsapp\.com)[^\s)]+/);

    const mensagemWpp = [
      'Olá! Vim pelo chat do site da [EMPRESA]',
      nome ? `. Meu nome é ${nome}` : '',
      empresa ? `, represento a ${empresa}` : '',
      localidade ? `, sou de ${localidade}` : '',
      segmento
        ? ` e tenho interesse no segmento ${segmento}.`
        : ` e gostaria de mais informações sobre os produtos.`,
    ].join('');

    if (linkMatch) {
      const base = linkMatch[0].split('?')[0];
      return `${base}?text=${encodeURIComponent(mensagemWpp)}`;
    }

    // Fallback: suporte geral
    return `https://api.whatsapp.com/send/?phone=XXXXXXXXXXX&text=${encodeURIComponent(mensagemWpp)}`;
  }

  // ── Renderiza botões individuais por distribuidor mencionado ─────────────
  function renderBotoesDistribuidores(
    content: string,
    mensagens: { role: string; content: string }[]
  ) {
    const { nome, localidade, segmento, empresa } = extrairDadosConversa(mensagens);

    const mensagemWpp = [
      'Olá! Vim pelo chat do site da [EMPRESA]',
      nome ? `. Meu nome é ${nome}` : '',
      empresa ? `, represento a ${empresa}` : '',
      localidade ? `, sou de ${localidade}` : '',
      segmento
        ? ` e tenho interesse no segmento ${segmento}.`
        : ` e gostaria de mais informações sobre os produtos.`,
    ].join('');

    const DISTRIBUIDORES = [
      { nome: '[DISTRIBUIDOR_1]', tel: 'XXXXXXXXXXX' },
      { nome: '[DISTRIBUIDOR_2]', tel: 'XXXXXXXXXXX' },
      { nome: '[DISTRIBUIDOR_3]', tel: 'XXXXXXXXXXX' },
    ];

    // Detecta quais distribuidores a Suh mencionou no texto
    const botoesEncontrados = DISTRIBUIDORES.filter(d => {
      const nomeCurto = d.nome.split(' ')[0];
      return content.includes(nomeCurto);
    });

    // Se não encontrou nenhum, mostra todos como fallback
    const botoes = botoesEncontrados.length > 0 ? botoesEncontrados : DISTRIBUIDORES;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        {botoes.map(d => (
          <a
            key={d.tel}
            href={`https://wa.me/${d.tel}?text=${encodeURIComponent(mensagemWpp)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '10px 16px',
              background: '#25d366', color: '#fff', borderRadius: '8px',
              textDecoration: 'none', fontSize: '13px', fontWeight: '700',
              letterSpacing: '0.04em', boxShadow: '0 2px 8px rgba(37,211,102,0.3)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar com {d.nome}
          </a>
        ))}
      </div>
    );
  }

  // ── Renderiza mensagem ────────────────────────────────────────────────────
  const renderMsg = (content: string) => {
    const hasWpp       = content.includes('[WHATSAPP]');
    const hasDistrib   = content.includes('[DISTRIBUIDOR]');
    const hasTrabalhe  = content.includes('[TRABALHE_CONOSCO]');
    const hasPaginaEmp = content.includes('[PAGINA_EMPRESA]');

    const texto = content
    .replace('[WHATSAPP]', '')
    .replace('[DISTRIBUIDOR]', '')
    .replace('[TRABALHE_CONOSCO]', '')
    .replace('[PAGINA_EMPRESA]', '')
    .replace(/\[SEG:[^\]]+\]/g, '')
    .replace(/https?:\/\/(wa\.me|api\.whatsapp\.com)[^\s]*/g, '')
    .replace(/\[SUPORTE_TECNICO_NOME\]\s*—\s*[^\n]*/gi, '')
    .trim();

    return (
      <div>
        <span
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{
            __html: texto
              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.+?)\*/g, '<em>$1</em>')
          }}
        />

        {hasWpp && (
        <a  
          href={(() => {
            // Extrai link wa.me da resposta se existir
            const linkNaResposta = content.match(/https?:\/\/(wa\.me|api\.whatsapp\.com)[^\s]*/);
            return linkNaResposta ? linkNaResposta[0] : montarLinkWhatsApp(msgs);
          })()}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', marginTop: '10px', padding: '10px 16px',
            background: '#25d366', color: '#fff', borderRadius: '8px',
            textDecoration: 'none', fontSize: '13px', fontWeight: '700',
            letterSpacing: '0.04em', boxShadow: '0 2px 8px rgba(37,211,102,0.3)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Falar com Consultora
        </a>
      )}

      {hasDistrib && renderBotoesDistribuidores(content, msgs)}

        {hasTrabalhe && (
          <a
            href={TRABALHE_LINK}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', marginTop: '10px', padding: '10px 16px',
              background: '#1a3a6b', color: '#fff', borderRadius: '8px',
              textDecoration: 'none', fontSize: '13px', fontWeight: '700',
            }}
          >
            Ver Vagas Disponíveis →
          </a>
        )}

        {hasPaginaEmp && (
          <a
            href={EMPRESA_LINK}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', marginTop: '10px', padding: '10px 16px',
              background: '#2d5aa0', color: '#fff', borderRadius: '8px',
              textDecoration: 'none', fontSize: '13px', fontWeight: '700',
            }}
          >
            Conhecer a Empresa →
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="chat-fab">
      {open && (
        <div className="chat-box">
          <div className="chat-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <div style={{
                  width: '28px', height: '28px', background: '#2d5aa0',
                  borderRadius: '50%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '13px', fontWeight: '800',
                  color: '#fff', flexShrink: 0
                }}>S</div>
                <div>
                  <h4 style={{
                    fontFamily: "'Nunito', sans-serif", fontSize: '14px',
                    fontWeight: '800', color: '#fff', margin: 0
                  }}>[AGENTE] — Consultora Virtual</h4>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '36px' }}>
                <div style={{
                  width: '6px', height: '6px', background: '#22c55e',
                  borderRadius: '50%', animation: 'pulse-g 2s infinite'
                }} />
                <span style={{
                  fontSize: '10px', color: 'rgba(255,255,255,0.55)',
                  textTransform: 'uppercase', letterSpacing: '0.08em'
                }}>Especialista em [PRODUTO] · Online</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', width: '30px', height: '30px', borderRadius: '6px',
                cursor: 'pointer', fontSize: '14px', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>
          </div>

          <div className="chat-messages">
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                  {m.role === 'assistant' ? renderMsg(m.content) : m.content}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex' }}>
                <div className="chat-bubble-ai" style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '10px 14px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '5px', height: '5px', background: '#94a3b8',
                      borderRadius: '50%', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chat-input-wrap">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              type="text"
              placeholder="Pergunte sobre [PRODUTO]..."
            />
            <button className="chat-send" onClick={send} disabled={typing}>→</button>
          </div>
        </div>
      )}

      <button
        className="chat-fab-btn"
        onClick={() => setOpen(p => !p)}
        title="Falar com [AGENTE]"
      >
        {open ? '✕' : (
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
            <span style={{ fontSize: '16px' }}>💬</span>
            <span style={{ fontSize: '9px', fontWeight: '800', letterSpacing: '0.05em', marginTop: '1px' }}>[AGENTE]</span>
          </span>
        )}
      </button>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes pulse-g { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}