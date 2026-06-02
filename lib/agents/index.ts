import { Agent } from './tipos';
import { agenteFacilitador } from './facilitador';
import { agenteComercial } from './comercial';
import { agenteRH } from './rh';
import { agenteCompras } from './compras';

export const AGENTES = {
  facilitador: agenteFacilitador,
  comercial:   agenteComercial,
  rh:          agenteRH,
  compras:     agenteCompras,
} as const;

export type TipoAgente = keyof typeof AGENTES;

export function pegarAgente(tipo: TipoAgente): Agent {
  const agente = AGENTES[tipo];
  if (!agente) throw new Error(`Agente "${tipo}" não encontrado`);
  if (!agente.ativo) throw new Error(`Agente "${tipo}" está desativado`);
  return agente;
}

export function pegarAgentePorClassificacao(tipo: string): Agent {
  switch (tipo) {
    case 'comercial':     return pegarAgente('comercial');
    case 'rh':            return pegarAgente('rh');
    case 'compras':       return pegarAgente('compras');
    case 'financeiro':    return pegarAgente('comercial');
    case 'transporte':    return pegarAgente('comercial');
    case 'institucional': return pegarAgente('comercial');
    default:              return pegarAgente('comercial');
  }
}

export { agenteFacilitador, agenteComercial, agenteRH, agenteCompras };