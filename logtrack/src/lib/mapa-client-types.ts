export type MapaEstacao = { id: string; portalId: string; portalNome: string; zonaId: string; zonaNome: string; apelido: string | null; x: number; y: number };
export type MapaTexto = { id: string; texto: string; x: number; y: number };
export type MapaData = { id: string; nome: string; imagemUrl: string | null; estacoes: MapaEstacao[]; textos: MapaTexto[] };
