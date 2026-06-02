'use client';

// app/painel/page.tsx
import React, { useState, useEffect, useCallback } from 'react';

const CAMBIO = 5.5;

type Conversa = {
  linha: number;
  sessionId: string;
  dataHora: string;
  nome: string;
  cidade: string;
  uf: string;
  segmento: string;
  empresa: string;
  totalMensagens: string;
  encaminhamento: string;
  transcricao: string;
  custoSessao: string;
  custoTotal: string;
  resultado: string;
  observacao: string;
};

export default function PainelPage() {
  const [autenticado, setAutenticado]   = useState(false);
  const [senha, setSenha]               = useState('');
  const [erroSenha, setErroSenha]       = useState(false);
  const [conversas, setConversas]       = useState<Conversa[]>([]);
  const [loading, setLoading]           = useState(false);
  const [transcricaoAberta, setTranscricaoAberta] = useState<string | null>(null);
  const [filtro, setFiltro]             = useState<'todos' | 'Sucesso' | 'Falha' | 'pendente'>('todos');
  const [atualizando, setAtualizando]   = useState<number | null>(null);
  const [observacoes, setObservacoes] = useState<Record<number, string>>({});

  const carregarDados = useCallback(async (senhaAtual: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/painel', {
        headers: { 'x-painel-senha': senhaAtual }
      });
      if (!res.ok) throw new Error('Não autorizado');
      const data = await res.json();
      setConversas(data.conversas.reverse()); // mais recentes primeiro
      const obs: Record<number, string> = {};
      data.conversas.forEach((c: Conversa) => {
        obs[c.linha] = c.observacao ?? '';
      });
      setObservacoes(obs);
    } catch {
      setAutenticado(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const entrar = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/painel', {
        headers: { 'x-painel-senha': senha }
      });
      if (!res.ok) { setErroSenha(true); setLoading(false); return; }
      const data = await res.json();
      const invertidas = data.conversas.reverse();
      setConversas(invertidas);
      setAutenticado(true);
      // Popula observações igual ao carregarDados
      const obs: Record<number, string> = {};
      invertidas.forEach((c: Conversa) => {
        obs[c.linha] = c.observacao ?? '';
      });
      setObservacoes(obs);
            setErroSenha(false);
          } catch {
            setErroSenha(true);
          } finally {
            setLoading(false);
          }
        };

  const marcarResultado = async (linha: number, resultado: 'Sucesso' | 'Falha') => {
    setAtualizando(linha);
    try {
      await fetch('/api/painel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-painel-senha': senha
        },
        body: JSON.stringify({ linha, resultado })
      });
      setConversas(prev =>
        prev.map(c => c.linha === linha ? { ...c, resultado } : c)
      );
    } finally {
      setAtualizando(null);
    }
  };

  const salvarObservacao = async (linha: number) => {
    const texto = observacoes[linha] ?? '';
    setAtualizando(linha);
    try{
      await fetch('/api/painel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-painel-senha': senha
        },
        body: JSON.stringify({ linha, observacao: texto})
      });
      setConversas(prev =>
        prev.map(c => c.linha === linha ? { ...c, observacao: texto } : c)
      );
    } finally {
      setAtualizando(null);
    }
  };

  // ── Métricas ──────────────────────────────────────────────────────────────
  const totalConversas   = conversas.length;
  const totalSucesso     = conversas.filter(c => c.resultado === 'Sucesso').length;
  const totalFalha       = conversas.filter(c => c.resultado === 'Falha').length;
  const taxaSucesso      = totalConversas > 0
    ? Math.round((totalSucesso / totalConversas) * 100) : 0;
  const custoTotalBRL = conversas.reduce(
    (acc, c) => acc + parseFloat((c.custoSessao || '0').replace(',', '.')), 0
  );
  const custoSessaoAtual = conversas.length > 0
    ? parseFloat((conversas[0]?.custoSessao ?? '0').replace(',', '.')) : 0;

  const conversasFiltradas = conversas.filter(c => {
    if (filtro === 'todos') return true;
    if (filtro === 'pendente') return !c.resultado;
    return c.resultado === filtro;
  });

  // ── Tela de login ─────────────────────────────────────────────────────────
  if (!autenticado) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0e1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Mono', 'Courier New', monospace"
      }}>
        <div style={{
          background: '#111827', border: '1px solid #1e293b',
          borderRadius: '12px', padding: '48px', width: '360px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', background: 'linear-gradient(135deg, #1a3a6b, #2d5aa0)',
              borderRadius: '10px', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', fontWeight: '800', color: '#fff'
            }}>D</div>
            <h1 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: '700', margin: 0 }}>
              DKN Chat — Painel
            </h1>
            <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
              Acesso restrito
            </p>
          </div>

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={e => { setSenha(e.target.value); setErroSenha(false); }}
            onKeyDown={e => e.key === 'Enter' && entrar()}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: '8px',
              border: `1px solid ${erroSenha ? '#ef4444' : '#1e293b'}`,
              background: '#0a0e1a', color: '#f1f5f9', fontSize: '14px',
              boxSizing: 'border-box', outline: 'none',
              fontFamily: "'DM Mono', monospace"
            }}
          />
          {erroSenha && (
            <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>
              Senha incorreta.
            </p>
          )}
          <button
            onClick={entrar}
            disabled={loading}
            style={{
              width: '100%', marginTop: '16px', padding: '12px',
              background: 'linear-gradient(135deg, #1a3a6b, #2d5aa0)',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Entrando...' : 'Entrar →'}
          </button>
        </div>
      </div>
    );
  }

  // ── Painel principal ──────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: '#0a0e1a',
      fontFamily: "'DM Mono', 'Courier New', monospace",
      color: '#f1f5f9'
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #1e293b', padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#111827'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #1a3a6b, #2d5aa0)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '14px', fontWeight: '800'
          }}>D</div>
          <div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#f1f5f9' }}>
              DKN Chat — Painel de Monitoramento
            </span>
            <span style={{
              marginLeft: '12px', fontSize: '11px', color: '#22c55e',
              background: 'rgba(34,197,94,0.1)', padding: '2px 8px',
              borderRadius: '4px', border: '1px solid rgba(34,197,94,0.2)'
            }}>● ONLINE</span>
          </div>
        </div>
        <button
          onClick={() => carregarDados(senha)}
          style={{
            background: '#1e293b', border: '1px solid #334155',
            color: '#94a3b8', padding: '8px 16px', borderRadius: '6px',
            fontSize: '12px', cursor: 'pointer'
          }}
        >
          ↻ Atualizar
        </button>
      </div>

      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>

        {/* Cards de métricas */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px', marginBottom: '32px'
        }}>
          {[
            { label: 'Total de Sessões', valor: totalConversas, cor: '#60a5fa', sufixo: '' },
            { label: 'Sucessos', valor: totalSucesso, cor: '#22c55e', sufixo: '' },
            { label: 'Falhas', valor: totalFalha, cor: '#ef4444', sufixo: '' },
            { label: 'Taxa de Sucesso', valor: taxaSucesso, cor: '#a78bfa', sufixo: '%' },
            {
              label: 'Custo Total',
              valor: `R$ ${isNaN(custoTotalBRL) ? '0.000000' : custoTotalBRL.toFixed(6)}`,
              cor: '#fbbf24', sufixo: '', raw: true
            },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#111827', border: '1px solid #1e293b',
              borderRadius: '10px', padding: '20px',
              borderTop: `3px solid ${card.cor}`
            }}>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {card.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: card.cor }}>
                {(card as any).raw ? card.valor : `${card.valor}${card.sufixo}`}
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {(['todos', 'pendente', 'Sucesso', 'Falha'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                padding: '6px 16px', borderRadius: '6px', fontSize: '12px',
                fontWeight: '600', cursor: 'pointer', border: '1px solid',
                background: filtro === f ? '#1e293b' : 'transparent',
                color: filtro === f ? '#f1f5f9' : '#64748b',
                borderColor: filtro === f ? '#334155' : '#1e293b',
                fontFamily: "'DM Mono', monospace"
              }}
            >
              {f === 'todos' ? `Todos (${totalConversas})`
                : f === 'pendente' ? `Pendentes (${totalConversas - totalSucesso - totalFalha})`
                : f === 'Sucesso' ? `✅ Sucesso (${totalSucesso})`
                : `❌ Falha (${totalFalha})`}
            </button>
          ))}
        </div>

        {/* Tabela */}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>
            Carregando...
          </div>
        ) : conversasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>
            Nenhuma conversa encontrada.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conversasFiltradas.map(c => (
              <div key={c.sessionId} style={{
                background: '#111827', border: '1px solid #1e293b',
                borderRadius: '10px', padding: '16px 20px',
                borderLeft: `3px solid ${
                  c.resultado === 'Sucesso' ? '#22c55e'
                  : c.resultado === 'Falha' ? '#ef4444'
                  : '#334155'
                }`
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  gap: '16px', alignItems: 'center'
                }}>
                  {/* Info principal */}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#f1f5f9', marginBottom: '2px' }}>
                      {c.nome !== '—' ? c.nome : 'Anônimo'}
                      {c.empresa !== '—' && (
                        <span style={{ color: '#64748b', fontWeight: '400' }}> · {c.empresa}</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {c.cidade !== '—' && c.uf !== '—' ? `${c.cidade}/${c.uf}` : c.uf !== '—' ? c.uf : '—'}
                      {c.segmento !== '—' && ` · ${c.segmento}`}
                    </div>
                  </div>

                  {/* Data e mensagens */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.dataHora}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {c.totalMensagens} mensagens · {c.encaminhamento}
                    </div>
                  </div>

                  {/* Custo */}
                  <div>
                    <div style={{ fontSize: '12px', color: '#fbbf24' }}>
                      Sessão: R$ {parseFloat(c.custoSessao || '0').toFixed(6)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Acumulado: R$ {parseFloat(c.custoTotal || '0').toFixed(6)}
                    </div>
                  </div>

                  {/* Transcrição */}
                  <div>
                    <button
                      onClick={() => setTranscricaoAberta(
                        transcricaoAberta === c.sessionId ? null : c.sessionId
                      )}
                      style={{
                        background: '#1e293b', border: '1px solid #334155',
                        color: '#94a3b8', padding: '4px 12px', borderRadius: '4px',
                        fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Mono', monospace"
                      }}
                    >
                      {transcricaoAberta === c.sessionId ? '▲ Fechar' : '▼ Ver chat'}
                    </button>
                  </div>

                  {/* Botões Sucesso/Falha */}
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => marcarResultado(c.linha, 'Sucesso')}
                      disabled={atualizando === c.linha}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                        fontWeight: '700', cursor: 'pointer', border: '1px solid',
                        background: c.resultado === 'Sucesso' ? '#166534' : 'transparent',
                        color: c.resultado === 'Sucesso' ? '#22c55e' : '#4ade80',
                        borderColor: c.resultado === 'Sucesso' ? '#166534' : '#1e293b',
                        fontFamily: "'DM Mono', monospace"
                      }}
                    >
                      ✅
                    </button>
                    <button
                      onClick={() => marcarResultado(c.linha, 'Falha')}
                      disabled={atualizando === c.linha}
                      style={{
                        padding: '6px 12px', borderRadius: '6px', fontSize: '12px',
                        fontWeight: '700', cursor: 'pointer', border: '1px solid',
                        background: c.resultado === 'Falha' ? '#7f1d1d' : 'transparent',
                        color: c.resultado === 'Falha' ? '#ef4444' : '#f87171',
                        borderColor: c.resultado === 'Falha' ? '#7f1d1d' : '#1e293b',
                        fontFamily: "'DM Mono', monospace"
                      }}
                    >
                      ❌
                    </button>
                    {/* Observação — aparece sempre abaixo dos botões */}
                    <div style={{ gridColumn: '1 / -1', marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Observação sobre esta conversa..."
                        value={observacoes[c.linha] ?? c.observacao ?? ''}
                        onChange={e => setObservacoes(prev => ({ ...prev, [c.linha]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && salvarObservacao(c.linha)}
                        style={{
                          flex: 1, minWidth: '400px', padding: '7px 12px',
                          background: '#0a0e1a', border: '1px solid #1e293b',
                          borderRadius: '6px', color: '#94a3b8', fontSize: '12px',
                          fontFamily: "'DM Mono', monospace", outline: 'none'
                        }}
                      />
                      <button
                        onClick={() => salvarObservacao(c.linha)}
                        disabled={atualizando === c.linha}
                        style={{
                          padding: '7px 14px', background: '#1e293b',
                          border: '1px solid #334155', borderRadius: '6px',
                          color: '#94a3b8', fontSize: '12px', cursor: 'pointer',
                          fontFamily: "'DM Mono', monospace"
                        }}
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transcrição expandida */}
                {transcricaoAberta === c.sessionId && (
                  <div style={{
                    marginTop: '16px', padding: '16px',
                    background: '#0a0e1a', borderRadius: '8px',
                    border: '1px solid #1e293b',
                    fontSize: '12px', color: '#94a3b8', lineHeight: '1.8',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {c.transcricao
                      ? c.transcricao.split(' | ').map((linha, i) => (
                          <div key={i} style={{
                            padding: '4px 0',
                            color: linha.startsWith('Cliente:') ? '#60a5fa' : '#94a3b8'
                          }}>
                            {linha}
                          </div>
                        ))
                      : 'Transcrição não disponível.'
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
