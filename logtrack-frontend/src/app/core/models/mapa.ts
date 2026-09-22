export type MapaEstacao = { id: string; portalId: string; portalNome: string; zonaId: string; zonaNome: string; apelido: string | null; x: number; y: number };
export type MapaTexto = { id: string; texto: string; x: number; y: number };
export type MapaZona = { id: string; zonaId: string; zonaNome: string; x: number; y: number };
export type MapaData = { id: string; nome: string; imagemUrl: string | null; estacoes: MapaEstacao[]; textos: MapaTexto[]; zonas: MapaZona[] };

export const MOVEMENT_CHANNEL = 'logtrack-movements';

export type MovementEvent = {
  loteId: string;
  zonaOrigemId: string | null;
  zonaDestinoId: string | null;
  portalId: string;
  tipo: 'MOVIMENTO' | 'CANCELAMENTO';
  timestamp: string;
};
