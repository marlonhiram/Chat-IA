export interface Representante {
  nome: string;
  whatsapp: string;
}

export interface Distribuidor {
  estado: string;
  nome: string;
  telefone: string;
}

const UF_PARA_REGIAO: Record<string, string> = {
  SP:       'SP',
  RS:       'SUL',  SC: 'SUL',  PR: 'SUL',
  BA:       'NORDESTE', CE: 'NORDESTE', PE: 'NORDESTE',
  MA:       'NORDESTE', PI: 'NORDESTE', RN: 'NORDESTE',
  PB:       'NORDESTE', AL: 'NORDESTE', SE: 'NORDESTE',
};

export const representantesPorEstado: Record<string, Representante> = {
  SP:       { nome: 'Carlos Mendes',  whatsapp: 'https://wa.me/5511988880001' },
  SUL:      { nome: 'Ana Ferreira',   whatsapp: 'https://wa.me/5551988880002' },
  NORDESTE: { nome: 'Roberto Alves',  whatsapp: 'https://wa.me/5581988880003' },
  DEFAULT:  { nome: 'Fernanda Lima',  whatsapp: 'https://wa.me/5541988880004' },
};

export const representanteParceiros: Representante = {
  nome: 'Marcelo Costa',
  whatsapp: 'https://wa.me/5551988880005',
};

export const suporteTecnico: Representante = {
  nome: 'Fernanda Lima',
  whatsapp: 'https://wa.me/5541988880004',
};

export const distribuidores: Distribuidor[] = [
  { estado: 'SP',       nome: 'Agrocenter Paulista',    telefone: '(11) 3888-1234' },
  { estado: 'Sul',      nome: 'Sul Agro Distribuidora', telefone: '(51) 3888-5678' },
  { estado: 'Nordeste', nome: 'Nordeste Insumos',        telefone: '(81) 3888-9012' },
];

export function pegarRepresentante(estado?: string | null): Representante {
  if (estado) {
    const regiao = UF_PARA_REGIAO[estado.toUpperCase()];
    if (regiao && representantesPorEstado[regiao]) {
      return representantesPorEstado[regiao];
    }
  }
  return representantesPorEstado.DEFAULT;
}
