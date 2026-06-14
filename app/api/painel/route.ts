// app/api/painel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { lerConversas, atualizarResultado, atualizarObservacao } from '@/lib/google-sheets';


const SENHA = process.env.PAINEL_SENHA ?? '';

export async function GET(req: NextRequest) {
  const senha = req.headers.get('x-painel-senha');
  if (senha !== SENHA) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const conversas = await lerConversas();
    return NextResponse.json({ conversas });
  } catch (error: any) {
    console.error('Erro ao ler conversas:', error.message);
    return NextResponse.json({ error: 'Erro ao carregar dados' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const senha = req.headers.get('x-painel-senha');
  if (senha !== SENHA) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { linha, resultado, observacao } = await req.json();

    if (observacao !== undefined) {
      await atualizarObservacao(linha, observacao);
      return NextResponse.json({ ok: true });
    }

    if (!linha || !['Sucesso', 'Falha'].includes(resultado)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    await atualizarResultado(linha, resultado);
        return NextResponse.json({ ok: true });
      } catch (error: any) {
    console.error('Erro ao atualizar resultado:', error.message);
    return NextResponse.json({ error: 'Erro ao atualizar' }, { status: 500 });
  }
}
