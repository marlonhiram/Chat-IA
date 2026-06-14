export interface Representante {
  nome: string;
  whatsapp: string;
}

export interface Distribuidor {
  estado: string;
  nome: string;
  telefone: string;
}

export const representantesPorEstado: Record<string, Representante> = {
  ESTADO_1: { nome: '[REPRESENTANTE_ESTADO_1]', whatsapp: 'https://wa.me/XXXXXXXXXXX' },
  ESTADO_2: { nome: '[REPRESENTANTE_ESTADO_2]', whatsapp: 'https://wa.me/XXXXXXXXXXX' },
  ESTADO_3: { nome: '[REPRESENTANTE_ESTADO_3]', whatsapp: 'https://wa.me/XXXXXXXXXXX' },
  DEFAULT:  { nome: '[SUPORTE_GERAL]',           whatsapp: 'https://wa.me/XXXXXXXXXXX' },
};

export const representanteParceiros: Representante = {
  nome: '[RESPONSAVEL_PARCERIAS]',
  whatsapp: 'https://wa.me/XXXXXXXXXXX',
};

export const suporteTecnico: Representante = {
  nome: '[SUPORTE_TECNICO_NOME]',
  whatsapp: 'https://wa.me/XXXXXXXXXXX',
};

export const distribuidores: Distribuidor[] = [
  { estado: 'ESTADO_1', nome: '[DISTRIBUIDOR_1]', telefone: '(XX) XXXX-XXXX' },
  { estado: 'ESTADO_2', nome: '[DISTRIBUIDOR_2]', telefone: '(XX) XXXX-XXXX' },
  { estado: 'ESTADO_3', nome: '[DISTRIBUIDOR_3]', telefone: '(XX) XXXX-XXXX' },
];

export function pegarRepresentante(estado?: string | null): Representante {
  if (estado && representantesPorEstado[estado]) {
    return representantesPorEstado[estado];
  }
  return representantesPorEstado.DEFAULT;
}
