export type Zona = { id: string; nome: string; descricao: string | null; ativa: boolean; criadoEm: string };
export type Portal = { id: string; nome: string; zonaId: string; ativo: boolean; ultimoUso: string | null; criadoEm: string };
export type Lote = { id: string; codigo: string; descricao: string | null; quantidade: number | null; dataValidade: string | null; zonaAtualId: string | null; ultimoPortalId: string | null; tagGravada: boolean; arquivado: boolean; criadoEm: string };
export type Movimentacao = { id: string; loteId: string; zonaOrigemId: string | null; zonaDestinoId: string | null; portalId: string; tipo: 'MOVIMENTO' | 'CANCELAMENTO'; timestamp: string };
export type ReadResult = { modo: 'MOVIMENTO' | 'CANCELAMENTO' | 'CONSULTA'; mensagem: string; lote: Lote; zona: string; timestamp: string; historico: { id: string; origem: string; destino: string; portal: string; timestamp: string; tipo: string }[] };
export type DashboardData = { zonas: Zona[]; lotes: Lote[]; movimentacoes: Movimentacao[]; portais: Portal[]; totalLeituras: number };
export type LoteDetail = Lote & { historico: Movimentacao[] };
