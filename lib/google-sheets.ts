// lib/google-sheets.ts
import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const CAMBIO = 5.5;
// Preços Gemini 2.5 Flash (USD por token)
const PRECO_INPUT  = 0.00000030;   // $0.30 por 1M tokens
const PRECO_OUTPUT = 0.0000025;    // $2.50 por 1M tokens

function getAuth() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY ?? '';
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!privateKey || !clientEmail) {
    throw new Error('Credenciais do Google não configuradas');
  }

  if (privateKey.startsWith('"')) privateKey = privateKey.slice(1);
  if (privateKey.endsWith('"'))   privateKey = privateKey.slice(0, -1);

  privateKey = privateKey
    .replace(/\\n/g, '\n')
    .replace(/\n\n/g, '\n');

  return new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: SCOPES,
  });
}

async function buscarLinhaPorSessionId(
  sheets: any,
  sheetId: string,
  sessionId: string
): Promise<number | null> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A:A',
  });
  const linhas = res.data.values ?? [];
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i][0] === sessionId) return i + 1;
  }
  return null;
}

// Busca custo acumulado de todas as sessões anteriores (coluna N)
async function buscarCustoAcumulado(
  sheets: any,
  sheetId: string
): Promise<number> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'M:M',
    });
    const linhas = res.data.values ?? [];
    // Soma todas as linhas da coluna M (Custo Sessão), ignora cabeçalho
    let total = 0;
    for (let i = 1; i < linhas.length; i++) {
      const val = parseFloat(linhas[i][0]);
      if (!isNaN(val)) total += val;
    }
    return total;
  } catch {
    return 0;
  }
}

export async function salvarConversa(dados: {
  sessionId: string;
  mensagens: { role: string; content: string }[];
  agente: string;
  ip: string;
  custoSessaoUSD?: number; // custo acumulado da sessão em USD
}) {
  try {
    console.log(`📋 Salvando conversa: ${dados.sessionId} — ${dados.mensagens.length} mensagens`);

    const auth   = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;
    if (!sheetId) throw new Error('GOOGLE_SHEET_ID não configurado');

    // Garante cabeçalho com 15 colunas (A-O)
    const cab = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:P1',
    });

    if (!cab.data.values?.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'A1:P1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            'Session ID', 'Data/Hora', 'Nome', 'Cidade', 'UF',
            'Segmento', 'Empresa', 'Total Mensagens',
            'Encaminhamento', 'Agente', 'IP', 'Transcrição',
            'Custo Sessão (R$)', 'Custo Total (R$)', 'Resultado', 'Observação'
          ]]
        }
      });
    }

    // ── Extração de dados ──────────────────────────────────────────────────
    const mensagensUsuario = dados.mensagens.filter(m => m.role === 'user').map(m => m.content);
    const mensagensSuh     = dados.mensagens.filter(m => m.role === 'assistant').map(m => m.content);
    const todasRespostas   = mensagensSuh.join(' ');
    const todasMensagens   = mensagensUsuario.join(' ');

    const nomePatterns = [
      // "meu nome é X", "me chamo X", etc.
      /(?:meu nome [eé]|me chamo|aqui [eé] o?a?|sou o?a?|pode me chamar de)\s+([A-ZÀ-Úa-záàâãéèêíïóôõúüç][A-Za-z0-9áàâãéèêíïóôõúüç]{1,30}(?:\s[A-ZÀ-Úa-záàâãéèêíïóôõúüç][A-Za-z0-9áàâãéèêíïóôõúüç]{1,30})?)/i,
      // Cliente se apresenta: "sou a Marcela", "sou o João", "aqui é a Ana"
      /(?:sou a|sou o|aqui é a|aqui é o|me chamo)\s+([A-ZÀ-Úa-záàâãéèêíïóôõúüç][A-Za-z0-9áàâãéèêíïóôõúüç]{2,30})/i,
      // Resposta direta ao pedido de nome — só o nome na mensagem, com ou sem sobrenome
      /^([A-ZÀ-Úa-záàâãéèêíïóôõúüç][a-záàâãéèêíïóôõúüç]{2,20}(?:\s[A-ZÀ-Úa-záàâãéèêíïóôõúüç][a-záàâãéèêíïóôõúüç]{2,20})?)\.?$/i,
    ];

    let nome = '—';
    for (const msg of mensagensUsuario) {
      for (const pattern of nomePatterns) {
        const m = msg.match(pattern);
        if (m) { nome = m[1].trim(); break; }
      }
      if (nome !== '—') break;
    }

    const cidadeEstadoMatch = todasMensagens.match(
      /(?:falo de|sou de|estou em|fico em|moro em|cidade[:\s]+|estado[:\s]+)?\s*([A-ZÀ-Úa-záàâãéèêíïóôõúüç]{2,20}(?:\s[A-ZÀ-Úa-záàâãéèêíïóôõúüç]{2,20})?)[,\/\s-]+\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i
    ) ?? todasMensagens.match(
      /\b([A-ZÀ-Úa-záàâãéèêíïóôõúüç]{3,20}(?:\s[A-ZÀ-Úa-záàâãéèêíïóôõúüç]{3,20})?)[,\s\/]+\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/
    );
    const ufMatch = todasMensagens.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/);
    const cidade  = cidadeEstadoMatch ? cidadeEstadoMatch[1].trim() : '—';
    const uf      = cidadeEstadoMatch ? cidadeEstadoMatch[2] : (ufMatch ? ufMatch[1] : '—');

    const segMatch  = todasRespostas.match(/\[SEG:([^\]]+)\]/);
    const segmento  = segMatch ? segMatch[1] : '—';

    const empresaMatch = todasRespostas.match(
      /(?:da|pela|representando a?|empresa)\s+([A-ZÀ-Ú][A-Za-záàâãéèêíïóôõúüç\s]+?)(?:\s*[,!.]|\s*que|\s*aqui)/
    );
    const empresaBruta  = empresaMatch ? empresaMatch[1].trim() : null;
    const empresasIgnorar = ['[EMPRESA]', '[MARCA]', '[AGENTE]'];
    const empresa = empresaBruta && !empresasIgnorar.some(e => empresaBruta.includes(e))
      ? empresaBruta : '—';

    const ultimaResposta = mensagensSuh[mensagensSuh.length - 1] ?? '';
    let encaminhamento = '—';
    const waMatch = ultimaResposta.match(/https?:\/\/wa\.me\/(\d+)/);
    if (ultimaResposta.includes('[DISTRIBUIDOR]'))       encaminhamento = 'Distribuidor';
    else if (ultimaResposta.includes('[TRABALHE_CONOSCO]')) encaminhamento = 'RH';
    else if (waMatch)                                    encaminhamento = `WhatsApp: ${waMatch[1]}`;

    const transcricao = dados.mensagens
      .map(m => `${m.role === 'user' ? 'Cliente' : '[AGENTE]'}: ${m.content.slice(0, 1000)}`)
      .join(' | ')
      .slice(0, 40000);

    // ── Custo ─────────────────────────────────────────────────────────────
    const custoSessaoBRL = ((dados.custoSessaoUSD ?? 0) * CAMBIO);
    const custoAcumuladoAnterior = await buscarCustoAcumulado(sheets, sheetId);
    const custoTotalBRL = custoAcumuladoAnterior + custoSessaoBRL;

    const agora = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const linha = [
      dados.sessionId, agora, nome, cidade, uf,
      segmento, empresa, dados.mensagens.length,
      encaminhamento, dados.agente, dados.ip, transcricao,
      custoSessaoBRL.toFixed(6),
      custoTotalBRL.toFixed(6),
      '', // Resultado
      ''  // Observação
    ];

    const numLinha = await buscarLinhaPorSessionId(sheets, sheetId, dados.sessionId);

    if (numLinha) {
      // Atualiza mas preserva o Resultado (coluna O) se já preenchido
      const resAtual = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `O${numLinha}`,
      });
      const resultadoAtual = resAtual.data.values?.[0]?.[0] ?? '';
      linha[14] = resultadoAtual;

      const obsAtual = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: `P${numLinha}`,
      });
      const observacaoAtual = obsAtual.data.values?.[0]?.[0] ?? '';
      linha[15] = observacaoAtual;

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `A${numLinha}:P${numLinha}`,
        valueInputOption: 'RAW',
        requestBody: { values: [linha] }
      });
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'A:P',
        valueInputOption: 'RAW',
        requestBody: { values: [linha] }
      });
    }

  } catch (error: any) {
    console.error('Erro ao salvar no Sheets:', error.message);
  }
}

// ── Lê todas as conversas para o painel ───────────────────────────────────
export async function lerConversas() {
  const auth    = getAuth();
  const sheets  = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID não configurado');

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A:P',
  });

  const linhas = res.data.values ?? [];
  if (linhas.length < 2) return [];

  return linhas.slice(1).map((l, i) => ({
    linha: i + 2,
    sessionId:     l[0]  ?? '',
    dataHora:      l[1]  ?? '',
    nome:          l[2]  ?? '—',
    cidade:        l[3]  ?? '—',
    uf:            l[4]  ?? '—',
    segmento:      l[5]  ?? '—',
    empresa:       l[6]  ?? '—',
    totalMensagens: l[7] ?? '0',
    encaminhamento: l[8] ?? '—',
    agente:        l[9]  ?? '',
    ip:            l[10] ?? '',
    transcricao:   l[11] ?? '',
    custoSessao:   l[12] ?? '0',
    custoTotal:    l[13] ?? '0',
    resultado:     l[14] ?? '',
    observacao: l[15] ?? '',
  }));
}

// ── Atualiza resultado de uma conversa ────────────────────────────────────
export async function atualizarResultado(linha: number, resultado: 'Sucesso' | 'Falha') {
  const auth    = getAuth();
  const sheets  = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID não configurado');

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `O${linha}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[resultado]] }
  });
  
}

export async function atualizarObservacao(linha: number, observacao: string) {
  const auth    = getAuth();
  const sheets  = google.sheets({ version: 'v4', auth });
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error('GOOGLE_SHEET_ID não configurado');

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `P${linha}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[observacao]] }
  });
}
