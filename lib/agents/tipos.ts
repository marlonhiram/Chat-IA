// tipos.ts
// Define a estrutura padrão que todos os agentes devem seguir.

export interface Agent {
  id: string;
  nome: string;
  tipo: TipoAgente;
  descricao: string;
  prompt_sistema: string;
  config: {
    modelo: string;
    temperatura: number;
    tokens_max: number;
  };
  ativo: boolean;
  versao: string;
}

export type TipoAgente =
  | 'facilitador'
  | 'comercial'
  | 'financeiro'
  | 'rh'
  | 'transporte'
  | 'compras';

// Resultado que o Facilitador retorna após classificar a mensagem
export interface ClassificacaoResult {
  tipo: 'comercial' | 'financeiro' | 'rh' | 'transporte' | 'institucional' | 'compras';
  confianca: number;
  palavras_detectadas: string[];
}
