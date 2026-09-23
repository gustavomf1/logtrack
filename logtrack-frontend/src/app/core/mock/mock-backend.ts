import type { DashboardData, Lote, Movimentacao, Portal, ReadResult, Zona } from '../models/types';
import type { MapaData } from '../models/mapa';

/**
 * Backend FALSO, apenas para visualizar o frontend enquanto a API não existe.
 * Intercepta o fetch para qualquer URL com /api/ e responde com dados de exemplo em memória
 * (recarregar a página volta tudo ao estado inicial). Ativado por `mockApi` em src/environments/.
 * Qualquer e-mail/senha é aceito no login.
 */

const SESSION_KEY = 'logtrack-mock-logado';
const agora = Date.now();
const iso = (minutosAtras: number) => new Date(agora - minutosAtras * 60_000).toISOString();
const dia = (dias: number) => new Date(agora + dias * 86_400_000).toISOString().slice(0, 10);
const uuid = () => crypto.randomUUID();

const zonas: Zona[] = [
  { id: 'z-a', nome: 'Zona A — Recebimento', descricao: 'Entrada e conferência de materiais', ativa: true, criadoEm: iso(60 * 24 * 30) },
  { id: 'z-b', nome: 'Zona B — Almoxarifado', descricao: 'Armazenamento e controle de estoque', ativa: true, criadoEm: iso(60 * 24 * 30) },
  { id: 'z-c', nome: 'Zona C — Expedição', descricao: 'Preparação e saída de pedidos', ativa: true, criadoEm: iso(60 * 24 * 30) },
];

const portais: Portal[] = [
  { id: 'p-1', nome: 'Portal 1 — Recebimento', zonaId: 'z-a', ativo: true, ultimoUso: iso(4), criadoEm: iso(60 * 24 * 30) },
  { id: 'p-2', nome: 'Portal 2 — Almoxarifado', zonaId: 'z-b', ativo: true, ultimoUso: iso(12), criadoEm: iso(60 * 24 * 30) },
  { id: 'p-3', nome: 'Portal 3 — Expedição', zonaId: 'z-c', ativo: true, ultimoUso: iso(35), criadoEm: iso(60 * 24 * 30) },
];

const lotes: Lote[] = [
  ['Rolamentos de precisão', 240, 120, 'z-b', 'p-2'],
  ['Chapas de aço inox', 80, 12, 'z-a', 'p-1'],
  ['Conectores hidráulicos', 150, 64, 'z-c', 'p-3'],
  ['Anéis de vedação', 500, -3, 'z-b', 'p-2'],
  ['Parafusos sextavados', 1200, 180, 'z-a', 'p-1'],
  ['Mangueiras de alta pressão', 60, 45, null, null],
].map(([descricao, quantidade, validade, zonaAtualId, ultimoPortalId], i) => ({
  id: 'l-' + (i + 1),
  codigo: 'LT-2026-' + String(i + 1).padStart(4, '0'),
  descricao: descricao as string,
  quantidade: quantidade as number,
  dataValidade: dia(validade as number),
  zonaAtualId: zonaAtualId as string | null,
  ultimoPortalId: ultimoPortalId as string | null,
  tagGravada: zonaAtualId !== null,
  arquivado: false,
  criadoEm: iso(60 * 24 * (10 - i)),
}));

const movimentacoes: Movimentacao[] = (
  [
    ['l-1', null, 'z-a', 'p-1', 60 * 26],
    ['l-1', 'z-a', 'z-b', 'p-2', 12],
    ['l-2', null, 'z-a', 'p-1', 4],
    ['l-3', null, 'z-a', 'p-1', 60 * 50],
    ['l-3', 'z-a', 'z-b', 'p-2', 60 * 30],
    ['l-3', 'z-b', 'z-c', 'p-3', 35],
    ['l-4', null, 'z-a', 'p-1', 60 * 8],
    ['l-4', 'z-a', 'z-b', 'p-2', 90],
    ['l-5', null, 'z-a', 'p-1', 20],
  ] as const
).map(([loteId, zonaOrigemId, zonaDestinoId, portalId, min]) => ({
  id: uuid(), loteId, zonaOrigemId, zonaDestinoId, portalId, tipo: 'MOVIMENTO' as const, timestamp: iso(min),
}));

let mapa: MapaData | null = null;
let totalLeituras = 147;

const nomeZona = (id: string | null) => zonas.find(z => z.id === id)?.nome ?? '—';
const logado = () => { try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; } };
const setLogado = (v: boolean) => { try { v ? sessionStorage.setItem(SESSION_KEY, '1') : sessionStorage.removeItem(SESSION_KEY); } catch { /* ignora */ } };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

function lerCorpo(init?: RequestInit): Record<string, any> {
  if (typeof init?.body !== 'string') return {};
  try { return JSON.parse(init.body); } catch { return Object.fromEntries(new URLSearchParams(init.body)); }
}

async function responder(caminho: string, metodo: string, init?: RequestInit): Promise<Response> {
  const corpo = lerCorpo(init);
  const partes = caminho.split('/').filter(Boolean);
  const origem = window.location.origin;

  // Autenticação (mesmas rotas do NextAuth)
  if (caminho === 'auth/csrf') return json({ csrfToken: 'mock' });
  if (caminho === 'auth/session') return json(logado() ? { user: { name: 'Supervisor Demo', email: 'supervisor@logtrack.com' } } : {});
  if (caminho === 'auth/callback/credentials') { setLogado(true); return json({ url: origem }); }
  if (caminho === 'auth/signout') { setLogado(false); return json({ url: origem }); }

  if (caminho === 'painel' && metodo === 'GET') {
    const recentes = [...movimentacoes].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const dados: DashboardData = { zonas, lotes: lotes.filter(l => !l.arquivado), movimentacoes: recentes, portais, totalLeituras };
    return json(structuredClone(dados));
  }
  if (caminho === 'estacao') return json({ vinculada: false });

  // Mapa
  if (caminho === 'mapa' && metodo === 'GET') return json(mapa);
  if (caminho === 'mapa/planta' && metodo === 'POST') {
    const arquivo = (init?.body as FormData | undefined)?.get('planta');
    const imagemUrl = arquivo instanceof File ? URL.createObjectURL(arquivo) : null;
    mapa = mapa ? { ...mapa, imagemUrl } : { id: uuid(), nome: 'Planta principal', imagemUrl, estacoes: [], textos: [], zonas: [] };
    return json(mapa);
  }
  if (caminho === 'mapa' && metodo === 'PUT' && mapa) {
    mapa = {
      ...mapa,
      estacoes: (corpo['estacoes'] ?? []).map((e: any) => {
        const portal = portais.find(p => p.id === e.portalId)!;
        return { id: uuid(), portalId: e.portalId, portalNome: portal.nome, zonaId: portal.zonaId, zonaNome: nomeZona(portal.zonaId), apelido: e.apelido, x: e.x, y: e.y };
      }),
      textos: (corpo['textos'] ?? []).map((t: any) => ({ ...t, id: t.id ?? uuid() })),
      zonas: (corpo['zonas'] ?? []).map((z: any) => ({ id: uuid(), zonaId: z.zonaId, zonaNome: nomeZona(z.zonaId), x: z.x, y: z.y })),
    };
    return json(mapa);
  }

  // Zonas
  if (partes[0] === 'zonas') {
    if (metodo === 'POST') {
      const zona: Zona = { id: uuid(), nome: String(corpo['nome']), descricao: corpo['descricao'] || null, ativa: true, criadoEm: new Date().toISOString() };
      zonas.push(zona);
      return json(zona);
    }
    const zona = zonas.find(z => z.id === partes[1]);
    if (!zona) return json({ error: 'Zona não encontrada.' }, 404);
    Object.assign(zona, corpo);
    return json(zona);
  }

  // Portais (estações)
  if (partes[0] === 'portais') {
    const activationUrl = origem + '/ativar/exemplo-' + uuid().slice(0, 8);
    if (metodo === 'POST' && partes.length === 1) {
      const portal: Portal = { id: uuid(), nome: String(corpo['nome']), zonaId: String(corpo['zonaId']), ativo: true, ultimoUso: null, criadoEm: new Date().toISOString() };
      portais.push(portal);
      return json({ ...portal, activationUrl });
    }
    const portal = portais.find(p => p.id === partes[1]);
    if (!portal) return json({ error: 'Portal não encontrado.' }, 404);
    if (partes[2] === 'regenerar-token') return json({ activationUrl });
    Object.assign(portal, corpo);
    return json(portal);
  }

  // Lotes
  if (partes[0] === 'lotes') {
    if (metodo === 'POST' && partes.length === 1) {
      const lote: Lote = { id: uuid(), codigo: String(corpo['codigo']), descricao: corpo['descricao'] || null, quantidade: corpo['quantidade'] ?? null, dataValidade: corpo['dataValidade'] ?? null, zonaAtualId: null, ultimoPortalId: null, tagGravada: false, arquivado: false, criadoEm: new Date().toISOString() };
      lotes.push(lote);
      return json(lote);
    }
    const lote = lotes.find(l => l.id === partes[1]);
    if (!lote) return json({ error: 'Lote não encontrado.' }, 404);
    if (metodo === 'DELETE') { lote.arquivado = true; return json({ ok: true }); }
    if (partes[2] === 'gravar-tag') { lote.tagGravada = true; return json(lote); }
    Object.assign(lote, corpo);
    return json(lote);
  }

  // Leitura pela página pública do lote (/l/:id): simula passagem pela próxima zona
  if (caminho === 'leituras' && metodo === 'POST') {
    const lote = lotes.find(l => l.id === corpo['loteId'] || l.codigo === corpo['loteId']);
    if (!lote) return json({ error: 'Lote não encontrado.' }, 404);
    const indice = zonas.findIndex(z => z.id === lote.zonaAtualId);
    const destino = zonas[Math.min(indice + 1, zonas.length - 1)];
    const portal = portais.find(p => p.zonaId === destino.id) ?? portais[0];
    const mov: Movimentacao = { id: uuid(), loteId: lote.id, zonaOrigemId: lote.zonaAtualId, zonaDestinoId: destino.id, portalId: portal.id, tipo: 'MOVIMENTO', timestamp: new Date().toISOString() };
    movimentacoes.push(mov);
    Object.assign(lote, { zonaAtualId: destino.id, ultimoPortalId: portal.id });
    totalLeituras++;
    const resultado: ReadResult = {
      modo: 'MOVIMENTO',
      mensagem: 'Lote movido para ' + destino.nome,
      lote, zona: destino.nome, timestamp: mov.timestamp,
      historico: movimentacoes.filter(m => m.loteId === lote.id).reverse().map(m => ({
        id: m.id, origem: nomeZona(m.zonaOrigemId), destino: nomeZona(m.zonaDestinoId),
        portal: portais.find(p => p.id === m.portalId)?.nome ?? '—', timestamp: m.timestamp, tipo: m.tipo,
      })),
    };
    return json(resultado);
  }

  return json({ error: 'Rota não simulada no mock: ' + metodo + ' /api/' + caminho }, 404);
}

export function installMockBackend() {
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.origin);
    const i = url.pathname.indexOf('/api/');
    if (i === -1) return fetchOriginal(input, init);
    await new Promise(r => setTimeout(r, 150)); // pequena latência para parecer real
    return responder(url.pathname.slice(i + 5), (init?.method ?? 'GET').toUpperCase(), init);
  };
  console.info('[LogTrack] API simulada ativa — dados de exemplo em memória.');
}
