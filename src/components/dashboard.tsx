"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, Box, CheckCircle2, Clock3, MapPin, Package, Plus, Radio, Search, Smartphone, Tag, TriangleAlert } from "lucide-react";
import { date, datetime, expiry, zoneName } from "@/lib/format";
import { filterLots } from "@/lib/filters";
import type { DashboardData, Lote } from "@/lib/types";
import { Back, Empty, PageTitle, api } from "./ui";
import { LotForm, StationForm, ZoneForm, TagWriter } from "./management";
import { DeleteLotButton } from "./delete-lot";

export function Dashboard({ initialData: data, path }: { initialData: DashboardData; path: string[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [activation, setActivation] = useState("");
  useEffect(() => { setError(""); setActivation(""); }, [path.join("/")]);
  async function change(url: string, method: string, body?: unknown) {
    setError(""); setBusy(true);
    try { const result = await api<{ activationUrl?: string }>(url, method, body); if (result.activationUrl) setActivation(result.activationUrl); router.refresh(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  const [section, id, action] = path;
  let content;
  if (!section) content = <Overview data={data}/>;
  else if (section === "ajuda") content = <Help/>;
  else if (section === "lotes") {
    const lot = data.lotes.find(l => l.id === id);
    if (!id) content = <Lots data={data}/>;
    else if (id === "novo") content = <LotForm/>;
    else if (!lot) content = <Empty>Lote não encontrado. <Link href="/lotes">Voltar para lotes</Link></Empty>;
    else if (action === "gravar") content = <TagWriter lot={lot}/>;
    else if (action === "editar") content = <LotForm lot={lot}/>;
    else content = <LotDetail lot={lot} data={data}/>;
  } else if (section === "zonas") {
    const zone = data.zonas.find(z => z.id === id);
    if (id === "nova" || zone) content = <ZoneForm zone={zone}/>;
    else content = <><PageTitle eyebrow="ORGANIZAÇÃO DO GALPÃO" title="Zonas" description="Cada espaço, conectado à sua operação."><Link className="button primary" href="/zonas/nova"><Plus size={17}/>Nova zona</Link></PageTitle><div className="zone-grid">{data.zonas.map((zone, i) => <article className="panel zone-card" key={zone.id}><div className="card-top"><span className={"zone-icon tone-" + i % 3}><MapPin size={23}/></span><span className={"badge " + (zone.ativa ? "green" : "gray")}>{zone.ativa ? "Ativa" : "Inativa"}</span></div><h2>{zone.nome}</h2><p>{zone.descricao || "Sem descrição"}</p><div className="zone-counts"><Link href={"/lotes?zona=" + zone.id}><strong>{data.lotes.filter(l => !l.arquivado && l.zonaAtualId === zone.id).length}</strong> lotes</Link><span><strong>{data.celulares.filter(c => c.zonaId === zone.id && c.ativo).length}</strong> estações ativas</span></div><div className="card-actions"><Link className="text-link" href={"/zonas/" + zone.id}>Editar zona <ArrowUpRight size={15}/></Link><button className="text-button" disabled={busy} onClick={() => change("zonas/" + zone.id, "PATCH", { ativa: !zone.ativa })}>{zone.ativa ? "Desativar" : "Reativar"}</button></div></article>)}</div>{!data.zonas.length && <Empty>Cadastre a primeira zona do galpão.</Empty>}</>;
  } else if (section === "celulares") {
    const station = data.celulares.find(c => c.id === id);
    if (id === "novo" || station) content = <StationForm zones={data.zonas} station={station}/>;
    else content = <><PageTitle eyebrow="ESTAÇÕES DE OPERAÇÃO" title="Celulares" description="Uma estação para cada zona. Movimentações sem digitação."><Link className="button primary" href="/celulares/novo"><Plus size={17}/>Cadastrar celular</Link></PageTitle>{activation && <div className="info-box activation-box" role="status"><strong>Novo link de ativação</strong><p>O vínculo anterior foi invalidado. Abra este link no celular da estação.</p><CopyUrl url={activation}/></div>}<div className="panel table-scroll"><table><thead><tr><th>Estação</th><th>Zona vinculada</th><th>Última leitura</th><th>Status</th><th>Ações</th></tr></thead><tbody>{data.celulares.map(c => <tr key={c.id}><td><div className="cell-title"><Smartphone size={18}/><Link href={"/celulares/" + c.id}>{c.nome}</Link></div></td><td>{zoneName(data.zonas, c.zonaId)}</td><td>{datetime(c.ultimoUso)}</td><td><span className={"badge " + (c.ativo ? "green" : "gray")}>{c.ativo ? "Ativa" : "Inativa"}</span></td><td><div className="table-actions"><button className="text-button" disabled={busy} onClick={() => change("celulares/" + c.id + "/regenerar-token", "POST", {})}>Regenerar token</button><button className="text-button" disabled={busy} onClick={() => change("celulares/" + c.id, "PATCH", { ativo: !c.ativo })}>{c.ativo ? "Desativar" : "Reativar"}</button></div></td></tr>)}</tbody></table>{!data.celulares.length && <Empty>Cadastre um celular e vincule-o a uma zona.</Empty>}</div><div className="info-box"><Radio size={20}/><span>Abra o link de ativação no celular físico. Depois, basta aproximar uma etiqueta para registrar a movimentação.</span></div></>;
  }
  return <>{error && <div className="form-error" role="alert">{error}</div>}{content}</>;
}

function Overview({ data }: { data: DashboardData }) {
  const lots = data.lotes.filter(l => !l.arquivado);
  const located = lots.filter(l => l.zonaAtualId);
  const attention = lots.filter(l => expiry(l.dataValidade) !== "regular");
  const cards = [
    { label: "Total de lotes", value: lots.length, note: "Lotes ativos no estoque", icon: Package, tone: "blue" },
    { label: "Lotes localizados", value: located.length, note: "Vinculados a uma zona", icon: MapPin, tone: "green" },
    { label: "Aguardando leitura", value: lots.length - located.length, note: "Lotes atualmente Sem Zona", icon: Radio, tone: "purple" },
    { label: "Atenção à validade", value: attention.length, note: "Vencidos ou a vencer em 30 dias", icon: Clock3, tone: "amber" },
  ];
  return <><PageTitle eyebrow="SUA OPERAÇÃO, EM UM SÓ LUGAR" title="Visão geral" description="Acompanhe seus lotes. Mantenha tudo no lugar certo."><Link className="button secondary" href="/lotes">Ver todos os lotes <ArrowUpRight size={16}/></Link><Link className="button primary" href="/lotes/novo"><Plus size={18}/>Novo lote</Link></PageTitle>
    <section className="overview-banner"><div><span className="banner-kicker"><span className="live-dot"/>RASTREAMENTO NFC</span><h2>Do físico ao digital.<br/>Sem perder o caminho.</h2><p>Cada aproximação conecta um lote à sua localização.<br/>Mais visibilidade em cada etapa da operação.</p><Link href="/ajuda">Veja como funciona <ArrowRight size={17}/></Link></div><div className="warehouse-visual" aria-hidden="true"><div className="warehouse-orbit"/><div className="warehouse-orbit second"/><div className="warehouse-box"><Box size={76} strokeWidth={1}/><span className="box-tag"><Radio size={23}/></span></div><span className="warehouse-label"><span className="live-dot"/>Estoque conectado</span><span className="warehouse-node node-a"><MapPin size={16}/>Recebimento</span><span className="warehouse-node node-b"><CheckCircle2 size={16}/>Lote localizado</span></div></section>
    <div className="stats-grid">{cards.map(({ label, value, note, icon: Icon, tone }) => <article className="stat-card" key={label}><div><span>{label}</span><span className={"stat-icon " + tone}><Icon size={19}/></span></div><strong>{value.toLocaleString("pt-BR")}</strong><small>{note}</small></article>)}</div>
    <div className="overview-columns"><section className="panel"><div className="panel-heading"><div><h2>Distribuição por zona</h2><p>Onde seus lotes estão agora</p></div><Link href="/zonas" className="text-link">Ver zonas <ArrowUpRight size={15}/></Link></div><div className="distribution">{[...data.zonas.filter(z => z.ativa).map(z => ({ id: z.id as string | null, nome: z.nome })), { id: null, nome: "Sem Zona" }].map((z, i) => { const count = lots.filter(l => l.zonaAtualId === z.id).length; return <Link href={"/lotes?zona=" + (z.id || "sem-zona")} className="distribution-row" key={z.id || "none"}><span className={"distribution-mark tone-" + i % 4}><MapPin size={17}/></span><div><div className="distribution-label"><strong>{z.nome}</strong><span>{count} <small>lotes</small></span></div><div className="bar-track"><div className={"bar-fill tone-" + i % 4} style={{ width: (lots.length ? count / lots.length * 100 : 0) + "%" }}/></div></div></Link>; })}</div><div className="panel-foot"><span className="live-dot"/>{data.celulares.filter(c => c.ativo).length} estações ativas na operação</div></section>
    <section className="panel"><div className="panel-heading"><div><h2>Movimentações recentes</h2><p>Os últimos passos da sua operação</p></div><span className="soft-icon"><ArrowDownLeft size={20}/></span></div><div className="activity-list">{data.movimentacoes.slice(0, 4).map(m => <Link className="activity-item" href={"/lotes/" + m.loteId} key={m.id}><span className={"activity-icon " + (m.tipo === "CANCELAMENTO" ? "amber" : "green")}><ArrowRight size={17}/></span><div><strong>{data.lotes.find(l => l.id === m.loteId)?.codigo}</strong><p>{m.tipo === "CANCELAMENTO" ? "Cancelado · Sem Zona" : zoneName(data.zonas, m.zonaDestinoId)}</p><small>{data.celulares.find(c => c.id === m.celularId)?.nome}</small></div><time>{datetime(m.timestamp)}</time></Link>)}{!data.movimentacoes.length && <Empty>As movimentações aparecerão aqui após a primeira leitura NFC.</Empty>}</div></section></div>
    <section className="panel"><div className="panel-heading"><div><h2>Lotes no estoque <span className="count-pill">{lots.length}</span></h2><p>Rastreabilidade em cada item, do início ao fim</p></div><Link href="/lotes" className="text-link">Ver todos <ArrowRight size={16}/></Link></div><LotTable lots={lots.slice(0, 5)} data={data}/></section>
  </>;
}

function Lots({ data }: { data: DashboardData }) {
  const deleted = useSearchParams().get("excluido") === "1";
  const [search, setSearch] = useState(""); const [zone, setZone] = useState(""); const [status, setStatus] = useState("");
  useEffect(() => { const params = new URLSearchParams(window.location.search); setZone(params.get("zona") || ""); setStatus(params.get("status") || ""); setSearch(params.get("busca") || ""); }, []);
  const filtered = filterLots(data, new URLSearchParams({ busca: search, zona: zone, status }));
  return <><PageTitle eyebrow="CONTROLE DE ESTOQUE" title="Lotes" description="Localização, validade e histórico de cada lote."><Link className="button primary" href="/lotes/novo"><Plus size={18}/>Novo lote</Link></PageTitle>{deleted && <div className="info-box delete-success" role="status"><CheckCircle2 size={18}/>Lote excluído com sucesso.</div>}<div className="panel"><div className="filters"><label className="search-field"><Search size={18}/><input aria-label="Buscar lotes" placeholder="Buscar código ou descrição..." value={search} onChange={e => setSearch(e.target.value)}/></label><select aria-label="Filtrar por zona" value={zone} onChange={e => setZone(e.target.value)}><option value="">Todas as zonas</option><option value="sem-zona">Sem Zona</option>{data.zonas.map(z => <option key={z.id} value={z.id}>{z.nome}</option>)}</select><select aria-label="Filtrar por status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Todos os status</option><option value="regular">Validade regular</option><option value="proximo">Vence em até 30 dias</option><option value="vencido">Vencido</option><option value="sem-tag">Sem etiqueta gravada</option></select></div><LotTable lots={filtered} data={data}/><div className="panel-foot">{filtered.length} lote(s) encontrado(s)</div></div></>;
}

function LotTable({ lots, data }: { lots: Lote[]; data: DashboardData }) {
  return <div className="table-scroll"><table><thead><tr><th>Lote / descrição</th><th>Zona atual</th><th>Quantidade</th><th>Validade</th><th>Etiqueta NFC</th><th>Última movimentação</th><th>Ações</th></tr></thead><tbody>{lots.map(l => <tr key={l.id}><td><Link className="lot-cell" href={"/lotes/" + l.id}><span className="lot-icon"><Package size={18}/></span><span><strong>{l.codigo}</strong><small>{l.descricao || "Sem descrição"}</small></span></Link></td><td><span className={"badge " + (l.zonaAtualId ? "blue" : "gray")}><span className="badge-dot"/>{zoneName(data.zonas, l.zonaAtualId)}</span></td><td>{l.quantidade?.toLocaleString("pt-BR") ?? "—"}</td><td><span className={"expiry " + expiry(l.dataValidade)}>{expiry(l.dataValidade) !== "regular" && <Clock3 size={13}/>} {date(l.dataValidade)}</span></td><td><span className={"tag-status " + (l.tagGravada ? "tag-done" : "")}><Tag size={14}/>{l.tagGravada ? "Gravada" : "Pendente"}</span></td><td className="muted">{datetime(data.movimentacoes.find(m => m.loteId === l.id)?.timestamp)}</td><td><div className="lot-row-actions"><Link className="icon-button" aria-label={"Ver lote " + l.codigo} href={"/lotes/" + l.id}><ArrowUpRight size={17}/></Link><DeleteLotButton lot={l} compact/></div></td></tr>)}</tbody></table>{!lots.length && <Empty>Nenhum lote encontrado para esta seleção.</Empty>}</div>;
}

function LotDetail({ lot, data }: { lot: Lote; data: DashboardData }) {

  const movements = data.movimentacoes.filter(m => m.loteId === lot.id);
  return <><Back/><PageTitle eyebrow="DETALHES DO LOTE" title={lot.codigo} description={lot.descricao || "Sem descrição"}>{!lot.arquivado && <><DeleteLotButton lot={lot}/><Link className="button secondary" href={"/lotes/" + lot.id + "/editar"}>Editar lote</Link><Link className="button primary" href={"/lotes/" + lot.id + "/gravar"}><Radio size={18}/>{lot.tagGravada ? "Regravar etiqueta" : "Gravar etiqueta"}</Link></>}</PageTitle>{lot.arquivado && <div className="info-box">Lote excluído do estoque. Seu histórico continua disponível para consulta.</div>}<section className="panel detail-grid"><div><span>{lot.arquivado ? "Última zona registrada" : "Zona atual"}</span><strong>{zoneName(data.zonas, lot.zonaAtualId)}</strong></div><div><span>Quantidade</span><strong>{lot.quantidade?.toLocaleString("pt-BR") ?? "Não informada"}</strong></div><div><span>Validade</span><strong className={"expiry " + expiry(lot.dataValidade)}>{date(lot.dataValidade)}</strong></div><div><span>Cadastrado em</span><strong>{datetime(lot.criadoEm)}</strong></div></section><section className="panel"><div className="panel-heading"><div><h2>Histórico completo</h2><p>{movements.length} movimentação(ões) registrada(s)</p></div><span className="badge blue">Auditoria</span></div><div className="table-scroll"><table><thead><tr><th>Data e hora</th><th>Origem</th><th>Destino</th><th>Celular</th><th>Evento</th></tr></thead><tbody>{movements.map(m => <tr key={m.id}><td>{datetime(m.timestamp)}</td><td>{zoneName(data.zonas, m.zonaOrigemId)}</td><td>{zoneName(data.zonas, m.zonaDestinoId)}</td><td>{data.celulares.find(c => c.id === m.celularId)?.nome}</td><td><span className={"badge " + (m.tipo === "MOVIMENTO" ? "green" : "amber")}>{m.tipo === "MOVIMENTO" ? "Movimentação" : "Cancelamento"}</span></td></tr>)}</tbody></table>{!movements.length && <Empty>Sem Zona — aguardando primeira movimentação.</Empty>}</div></section></>;
}

export function CopyUrl({ url }: { url: string }) {
  const [message, setMessage] = useState("");
  return <div className="copy-url"><input aria-label="URL para copiar" readOnly value={url} onFocus={e => e.currentTarget.select()}/><button type="button" className="button secondary" onClick={async () => { try { await navigator.clipboard.writeText(url); setMessage("Link copiado."); } catch { setMessage("Selecione o link e copie manualmente."); } }}>Copiar</button><small role="status">{message}</small></div>;
}

function Help() {
  return <><PageTitle eyebrow="CENTRAL DE AJUDA" title="Um toque. Tudo localizado." description="Conheça o fluxo de rastreamento do LogTrack."/><div className="help-grid">{[{ n: "01", title: "Organize as zonas", text: "Cadastre as áreas do galpão e um celular para cada estação. Abra o link de ativação no Chrome do celular correspondente.", href: "/zonas", label: "Gerenciar zonas" }, { n: "02", title: "Identifique os lotes", text: "Cadastre um lote e grave a URL em uma etiqueta NFC pelo celular do supervisor. Cole a etiqueta no lote.", href: "/lotes/novo", label: "Cadastrar lote" }, { n: "03", title: "Aproxime para movimentar", text: "Com o celular ativado, aproxime a etiqueta. A página abre e registra a zona automaticamente. Aguarde a confirmação na tela.", href: "/celulares", label: "Ver estações" }].map(step => <article className="panel help-step" key={step.n}><span>{step.n}</span><h2>{step.title}</h2><p>{step.text}</p><Link className="text-link" href={step.href}>{step.label}<ArrowRight size={16}/></Link></article>)}</div><section className="panel help-rules"><h2>Como a movimentação funciona</h2><p><strong>Lote Sem Zona:</strong> vai para a zona do celular que fez a leitura.</p><p><strong>Nova leitura pelo mesmo celular:</strong> cancela a movimentação e volta para Sem Zona.</p><p><strong>Leitura por outro celular:</strong> vai para a zona desse outro celular, mesmo que ambos pertençam à mesma zona.</p><p><strong>Celular sem vínculo ativo:</strong> abre somente para consulta.</p><div className="info-box"><TriangleAlert size={21}/><span>Cada nova abertura ou atualização da página do lote em um celular ativado conta como uma leitura. Aguarde o resultado antes de aproximar novamente.</span></div><h2>Para gravar etiquetas</h2><p>Use Chrome no Android com NFC ativado e acesse o sistema por HTTPS. A gravação exige permissão do navegador. No computador, copie a URL e abra a tela de gravação no celular do supervisor.</p><p>Se um celular for perdido ou substituído, desative a estação ou regenere seu token na tela de celulares.</p></section></>;
}
