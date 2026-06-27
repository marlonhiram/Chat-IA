// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { agenteFacilitador, pegarAgentePorClassificacao } from '@/lib/agents';
import { pegarRepresentante, suporteTecnico } from '@/lib/agents/comercial';
import { salvarConversa } from '@/lib/google-sheets';


// ── Rate Limiting por IP ──────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = {
  maxMensagens: 20,
  janelaTempo: 60 * 60 * 1000,
};

function verificarRateLimit(ip: string): { permitido: boolean; motivo?: string } {
  const agora = Date.now();
  const registro = rateLimitMap.get(ip);

  if (!registro || agora > registro.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: agora + RATE_LIMIT.janelaTempo });
    return { permitido: true };
  }

  registro.count += 1;

  if (registro.count > RATE_LIMIT.maxMensagens) {
    return {
      permitido: false,
      motivo: 'Limite de mensagens atingido. Tente novamente em 1 hora ou fale diretamente pelo WhatsApp.'
    };
  }

  return { permitido: true };
}

// ── Validação de qualidade da mensagem ───────────────────────────────────────
function validarMensagem(texto: string): { valida: boolean; motivo?: string } {
  const limpo = texto.trim();

  if (limpo.length < 2) return { valida: false, motivo: 'Mensagem muito curta.' };

  if (/^(.)\1+$/.test(limpo)) return { valida: false, motivo: 'Mensagem inválida.' };

  if (!/[a-zA-ZÀ-ú]/.test(limpo) && limpo.length < 10)
    return { valida: false, motivo: 'Mensagem inválida.' };

  return { valida: true };
}

// ── Erro tipado para falha de disponibilidade do Gemini ──────────────────────
class GeminiIndisponivelError extends Error {
  constructor(tentativas: number) {
    super(`Gemini indisponível após ${tentativas} tentativas (503)`);
    this.name = 'GeminiIndisponivelError';
  }
}
// ── Retry com backoff exponencial ────────────────────────────────────────────
async function chamarGeminiComRetry(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  tokensMax: number,
  temperatura: number,
  signal: AbortSignal,
  tentativas = 3,
  modelo = 'gemini-2.5-flash'
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const delays = [
    800 + Math.random() * 200,   // ~1s — pausa curta antes de retry
    1500 + Math.random() * 500,  // ~2s — segunda pausa
    2000,                        // fallback imediato sem espera extra
  ];

  for (let i = 0; i < tentativas; i++) {
    
    try {
      return await chamarGemini(systemPrompt, messages, tokensMax, temperatura, signal, modelo);
    } catch (error: any) {
      const ultimo = i === tentativas - 1;
      const e503   = error.message?.includes('503') || error.message?.includes('UNAVAILABLE');

      if (e503 && !ultimo) {
        console.log(`⚠️  Gemini 503 — tentativa ${i + 1}/${tentativas} (${modelo}), retry em ${delays[i].toFixed(0)}ms...`);
        await new Promise(r => setTimeout(r, delays[i]));
        continue;
      }
      if (ultimo) {
        console.error(`❌ Gemini indisponível — todas as ${tentativas} tentativas esgotadas. Encaminhando para suporte humano.`);
        throw new GeminiIndisponivelError(tentativas);
      }
      throw error;
    }
  }
  throw new GeminiIndisponivelError(tentativas);
}

// ── Chama o Gemini e retorna texto + uso de tokens ───────────────────────────
async function chamarGemini(
  systemPrompt: string,
  messages: { role: string; content: string }[],
  tokensMax: number,
  temperatura: number,
  signal: AbortSignal,
  modelo = 'gemini-2.5-flash'
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  const geminiContents = [
    { role: 'user',  parts: [{ text: 'Quem é você e o que pode fazer?' }] },
    { role: 'model', parts: [{ text: systemPrompt }] },
    ...messages
      .filter(msg => msg.content?.trim())
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: geminiContents,
        generationConfig: { maxOutputTokens: tokensMax, temperature: temperatura }
      }),
      signal,
    }
  );

  if (!response.ok) {
    const erro = await response.json();
    console.error('Gemini API Error:', erro);
    throw new Error(`Erro na API do Gemini: ${response.status}`);
  }

  const data = await response.json();

  // Log finishReason para detectar cortes
  const finishReason = data?.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    console.warn(`⚠️ Gemini finishReason: ${finishReason}`);
  }

  // Captura uso de tokens
  const inputTokens  = data?.usageMetadata?.promptTokenCount     ?? 0;
  const outputTokens = data?.usageMetadata?.candidatesTokenCount ?? 0;

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    ?? 'Desculpe, não consegui processar sua mensagem. Tente novamente.';

  return { text, inputTokens, outputTokens };
}

// ── POST /api/chat ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const { messages, sessionId, custoSessaoUSD = 0 } = await req.json();

    // ── Rate Limiting ──
    const ip = req.headers.get('x-forwarded-for')
      ?? req.headers.get('x-real-ip')
      ?? 'desconhecido';

    const rateCheck = verificarRateLimit(ip);
    if (!rateCheck.permitido) {
      return NextResponse.json({
        content: [{ type: 'text', text: rateCheck.motivo }]
      });
    }

    // ── Validação de qualidade ──
    const ultimaMensagem = messages[messages.length - 1]?.content ?? '';

    const qualidadeCheck = validarMensagem(ultimaMensagem);
    if (!qualidadeCheck.valida) {
      return NextResponse.json({
        content: [{ type: 'text', text: 'Não entendi sua mensagem. Pode reformular? 😊' }]
      });
    }

    // ── Bloqueia prompt injection ──
    const padroesSuspeitos = [
      /ignore\s+(as\s+)?instru/i,
      /esqueça\s+(o\s+que|tudo)/i,
      /novo\s+prompt/i,
      /sem\s+restrições/i,
      /aja\s+como/i,
      /you\s+are\s+now/i,
      /jailbreak/i,
      /DAN\s+mode/i,
    ];

    if (padroesSuspeitos.some(p => p.test(ultimaMensagem))) {
      return NextResponse.json({
        content: [{ type: 'text', text: 'Só posso ajudar com informações sobre os produtos da TexFibra Brasil. Como posso ajudar?' }]
      });
    }

    if (ultimaMensagem.length > 1000) {
      return NextResponse.json({
        content: [{ type: 'text', text: 'Mensagem muito longa. Por favor, seja mais direto na sua pergunta.' }]
      });
    }

    // - Pedido Formal com CNPJ - Resposta sem chamar Gemini
    const isPedidoFormal = ultimaMensagem.length > 300 &&
    /CNPJ|razão social|orçamento|cotação/i.test(ultimaMensagem);

    if(isPedidoFormal) {
      const ufMatch = ultimaMensagem.match(
        /\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/
      );
      const uf = ufMatch?.[1] ?? null;
      const rep = pegarRepresentante(uf);

      const texto = `Obrigada pelo contato e pelas informações! 😊\n\nVou encaminhar seu pedido para o ${rep.nome}, nosso representante responsável pela sua região.\n\n${rep.nome}\n${rep.whatsapp}\n[WHATSAPP]`;

      const historicoCompleto = [
        ...messages,
        { role: 'assistant', content: texto }
      ];

      await Promise.allSettled([
        salvarConversa({
          sessionId: sessionId ?? 'sem-sessao',
          mensagens: historicoCompleto,
          agente: 'Clara — Consultora Virtual',
          ip,
          custoSessaoUSD: custoSessaoUSD,

        })
      ]);

      return NextResponse.json({
        content: [{ type: 'text', text: texto}],
        agente_usado: 'Clara — Consultora Virtual',
        versao_agente: '1.0',
        uso: { inputTokens: 0, outputTokens: 0, custoSessaoUSD },
      });
    }

    const mensagensLimitadas = messages.slice(-10);

    // ── Timeout ──
    const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 25000);

    // ── Etapa 1: Facilitador classifica a mensagem ──
    const promptFacilitador = agenteFacilitador.prompt_sistema
      .replace('{TEXTO_DO_USUARIO}', ultimaMensagem);

    let tipoClassificado = 'comercial';
    let inputTokens  = 0;
    let outputTokens = 0;

    try {
      const respostaFacilitador = await chamarGeminiComRetry(
        promptFacilitador,
        [{ role: 'user', content: ultimaMensagem }],
        agenteFacilitador.config.tokens_max,
        agenteFacilitador.config.temperatura,
        controller.signal,
        3,
        agenteFacilitador.config.modelo
      );

      inputTokens  += respostaFacilitador.inputTokens;
      outputTokens += respostaFacilitador.outputTokens;

      const textoLimpo = respostaFacilitador.text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const classificacao = JSON.parse(textoLimpo);
      tipoClassificado = classificacao.tipo ?? 'comercial';
      console.log(`📊 Classificado como: ${tipoClassificado}`);
    } catch {
      console.warn('⚠️ Facilitador falhou — usando padrão: comercial');
    }

    // ── Etapa 2: Chama o agente correto ──
    const agente = pegarAgentePorClassificacao(tipoClassificado);
    console.log(`🤖 Usando agente: ${agente.nome} v${agente.versao}`);

    const resultado = await chamarGeminiComRetry(
      agente.prompt_sistema,
      mensagensLimitadas,
      agente.config.tokens_max,
      agente.config.temperatura,
      controller.signal,
      3,
      agente.config.modelo
    );

    const texto = resultado.text;
    inputTokens  += resultado.inputTokens;
    outputTokens += resultado.outputTokens;

    clearTimeout(timeoutId);

    // ── Custo desta chamada (USD) ──
    const PRECO_INPUT  = 0.00000030;   // $0.30 por 1M tokens
    const PRECO_OUTPUT = 0.0000025;    // $2.50 por 1M tokens
    const custoEstaChama = (inputTokens * PRECO_INPUT) + (outputTokens * PRECO_OUTPUT);
    const custoSessaoAtualizado = custoSessaoUSD + custoEstaChama;

    console.log(`💰 Tokens: ${inputTokens} in / ${outputTokens} out — custo sessão: $${custoSessaoAtualizado.toFixed(8)}`);

    const historicoCompleto = [
      ...messages,
      { role: 'assistant', content: texto }
    ];

    await Promise.allSettled([
      salvarConversa({
        sessionId: sessionId ?? 'sem-sessao',
        mensagens: historicoCompleto,
        agente: 'Clara — Consultora Virtual',
        ip,
        custoSessaoUSD: custoSessaoAtualizado,
      })
    ]);

    return NextResponse.json({
      content: [{ type: 'text', text: texto }],
      agente_usado: 'Clara — Consultora Virtual',
      versao_agente: '1.0',
      uso: {
        inputTokens,
        outputTokens,
        custoSessaoUSD: custoSessaoAtualizado,
      }
    });

  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      return NextResponse.json({
        content: [{ type: 'text', text: `Não consegui processar sua mensagem a tempo. Por favor, envie novamente ou fale diretamente pelo WhatsApp. ${suporteTecnico.whatsapp} [WHATSAPP]` }]
      });
    }

    if (error.name === 'GeminiIndisponivelError') {
      console.error(`❌ ${error.message}`);
      return NextResponse.json({
        content: [{ type: 'text', text: `Estou com uma instabilidade no momento, mas não te deixo sem atendimento! 😊 Nossa consultora ${suporteTecnico.nome} pode te ajudar agora pelo WhatsApp. ${suporteTecnico.whatsapp} [WHATSAPP]` }]
      });
    }

    console.error('Route Error:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
