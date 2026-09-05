"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, Radio, Smartphone } from "lucide-react";
import type { DashboardData, Lote, Zona } from "@/lib/types";
import { Back, PageTitle, api } from "./ui";
import { CopyUrl } from "./dashboard";

export function LotForm({ lot }: { lot?: Lote }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const f = new FormData(event.currentTarget);
    try {
      const result = await api<Lote>("lotes" + (lot ? "/" + lot.id : ""), lot ? "PATCH" : "POST", { codigo: f.get("codigo"), descricao: f.get("descricao"), quantidade: f.get("quantidade") === "" ? null : Number(f.get("quantidade")), dataValidade: f.get("dataValidade") || null });
      router.push("/lotes/" + result.id + (lot ? "" : "/gravar")); router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <><Back/><PageTitle eyebrow="IDENTIFICAÇÃO E RASTREABILIDADE" title={lot ? "Editar lote" : "Novo lote"} description="Cadastre as informações do lote para acompanhar cada movimentação."/><form className="panel management-form" onSubmit={submit}><div className="form-section-heading"><h2>Informações do lote</h2><p>O código identifica este lote em toda a operação.</p></div><label>Código do lote <span className="required">*</span><input name="codigo" defaultValue={lot?.codigo} required maxLength={100} placeholder="Ex.: LT-2026-0006"/></label><label>Descrição<textarea name="descricao" defaultValue={lot?.descricao || ""} maxLength={2000} rows={3} placeholder="Descreva o material ou as peças deste lote"/></label><div className="form-row"><label>Quantidade<input name="quantidade" type="number" min={0} max={2147483647} step={1} defaultValue={lot?.quantidade ?? ""} placeholder="Ex.: 240"/></label><label>Data de validade<input name="dataValidade" type="date" defaultValue={lot?.dataValidade?.slice(0, 10) || ""}/></label></div>{!lot && <div className="info-box"><Radio size={21}/><span>O lote será criado como <strong>Sem Zona</strong>. A primeira leitura por uma estação define sua localização.</span></div>}{error && <div className="form-error" role="alert">{error}</div>}<div className="form-actions"><Link href="/lotes" className="button secondary">Cancelar</Link><button className="button primary" disabled={busy}>{busy ? "Salvando..." : lot ? "Salvar alterações" : "Salvar e gerar URL"}</button></div></form></>;
}

export function ZoneForm({ zone }: { zone?: Zona }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const f = new FormData(event.currentTarget);
    try { await api("zonas" + (zone ? "/" + zone.id : ""), zone ? "PATCH" : "POST", { nome: f.get("nome"), descricao: f.get("descricao") }); router.push("/zonas"); router.refresh(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <><Back href="/zonas">Voltar para zonas</Back><PageTitle eyebrow="ORGANIZAÇÃO DO GALPÃO" title={zone ? "Editar zona" : "Nova zona"} description="Defina uma área física para localizar seus lotes."/><form className="panel management-form" onSubmit={submit}><label>Nome da zona<input name="nome" required maxLength={100} defaultValue={zone?.nome} placeholder="Ex.: Zona D — Qualidade"/></label><label>Descrição<textarea name="descricao" maxLength={2000} rows={3} defaultValue={zone?.descricao || ""} placeholder="O que acontece nesta área?"/></label>{error && <div className="form-error" role="alert">{error}</div>}<div className="form-actions"><Link className="button secondary" href="/zonas">Cancelar</Link><button className="button primary" disabled={busy}>{busy ? "Salvando..." : "Salvar zona"}</button></div></form></>;
}

export function StationForm({ zones, station }: { zones: Zona[]; station?: DashboardData["celulares"][number] }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [activation, setActivation] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const f = new FormData(event.currentTarget);
    try {
      const result = await api<{ activationUrl?: string }>("celulares" + (station ? "/" + station.id : ""), station ? "PATCH" : "POST", { nome: f.get("nome"), ...(!station ? { zonaId: f.get("zonaId") } : {}) });
      if (result.activationUrl) setActivation(result.activationUrl); else router.push("/celulares"); router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <><Back href="/celulares">Voltar para celulares</Back><PageTitle eyebrow="ESTAÇÕES DE OPERAÇÃO" title={station ? "Editar celular" : "Cadastrar celular"} description="Vincule um celular a uma zona do galpão."/>{activation ? <section className="panel management-form"><CheckCircle2 className="success-icon" size={40}/><h2>Celular cadastrado</h2><p>Abra este link no Chrome do celular que será a estação. Guarde-o para uma futura reativação.</p><CopyUrl url={activation}/><div className="info-box">Depois da ativação, adicione a página da estação à tela inicial do celular.</div><Link className="button primary" href="/celulares">Ver celulares</Link></section> : <form className="panel management-form" onSubmit={submit}><label>Nome do celular<input name="nome" required maxLength={100} defaultValue={station?.nome} placeholder="Ex.: Celular 4 — Qualidade"/></label><label>Zona vinculada<select name="zonaId" required defaultValue={station?.zonaId || ""} disabled={Boolean(station)}><option value="" disabled>Selecione uma zona</option>{zones.filter(z => z.ativa || z.id === station?.zonaId).map(z => <option key={z.id} value={z.id}>{z.nome}</option>)}</select></label><div className="info-box"><Smartphone size={21}/><span>A zona de uma estação é fixa. Para mudar de área, desative esta estação e cadastre outra.</span></div>{!zones.some(z => z.ativa) && !station && <p>Cadastre uma <Link className="text-link" href="/zonas/nova">zona ativa</Link> primeiro.</p>}{error && <div className="form-error" role="alert">{error}</div>}<div className="form-actions"><Link className="button secondary" href="/celulares">Cancelar</Link><button className="button primary" disabled={busy || (!station && !zones.some(z => z.ativa))}>{busy ? "Salvando..." : station ? "Salvar alterações" : "Cadastrar e gerar link"}</button></div></form>}</>;
}

type NFCWindow = Window & { NDEFReader?: new () => { write: (message: { records: { recordType: "url"; data: string }[] }, options: { signal: AbortSignal }) => Promise<void> } };
export function TagWriter({ lot }: { lot: Lote }) {
  const router = useRouter(); const [url, setUrl] = useState(""); const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<"idle" | "writing" | "saving" | "written" | "done">("idle"); const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { setUrl(window.location.origin + "/l/" + lot.id); setSupported("NDEFReader" in window && window.isSecureContext); return () => controller.current?.abort(); }, [lot.id]);
  useEffect(() => { if (phase === "writing") dialog.current?.showModal(); else dialog.current?.close(); }, [phase]);
  async function markWritten() {
    setPhase("saving"); setError("");
    try { await api("lotes/" + lot.id + "/gravar-tag", "POST", {}); setPhase("done"); router.refresh(); }
    catch { setPhase("written"); setError("A etiqueta foi gravada, mas não foi possível salvar a confirmação. Tente salvar novamente."); }
  }
  async function write() {
    const NDEFReader = (window as NFCWindow).NDEFReader;
    if (!NDEFReader || !window.isSecureContext) { setError("Use Chrome no Android com NFC e acesse por HTTPS."); return; }
    if (!url.startsWith("https://")) { setError("Abra o sistema pelo endereço HTTPS antes de gravar a etiqueta para uso no celular."); return; }
    setError(""); setPhase("writing"); controller.current = new AbortController();
    try { await new NDEFReader().write({ records: [{ recordType: "url", data: url }] }, { signal: controller.current.signal }); await markWritten(); }
    catch (e) { setPhase("idle"); if ((e as Error).name !== "AbortError") setError("Falha ao gravar. Verifique a permissão, o NFC e a etiqueta, e tente novamente."); }
  }
  return <><Back/><PageTitle eyebrow="IDENTIFICAÇÃO NFC" title="Gravar etiqueta" description={lot.codigo + " · " + (lot.descricao || "Lote cadastrado")}/><section className="panel nfc-writer"><div className="nfc-write-icon"><Radio size={45}/></div><h2>{phase === "done" ? "Etiqueta gravada" : "Seu lote, a uma aproximação de distância."}</h2><p>Grave o endereço abaixo na etiqueta NFC e cole-a no lote.</p><CopyUrl url={url}/>{!supported && <div className="info-box">A gravação NFC não está disponível neste navegador. Abra esta mesma tela no Chrome de um Android com NFC, pelo endereço HTTPS do sistema.</div>}{error && <div className="form-error" role="alert">{error}</div>}{phase === "done" ? <div role="status"><CheckCircle2 className="success-icon" size={34}/><p>Etiqueta gravada com sucesso. O lote está pronto para leitura.</p><Link href="/lotes" className="button primary">Voltar para lotes</Link></div> : phase === "written" ? <button className="button primary" onClick={markWritten}>Salvar confirmação novamente</button> : <button className="button primary" disabled={!supported || phase !== "idle" || lot.arquivado} onClick={write}><Radio size={18}/>{phase === "saving" ? "Salvando..." : "Gravar etiqueta"}</button>}<small>A leitura da etiqueta por um celular ativado registra a movimentação automaticamente.</small></section><dialog ref={dialog} className="nfc-dialog" aria-labelledby="nfc-dialog-title" onCancel={() => controller.current?.abort()}><Radio size={48} className="pulse"/><h2 id="nfc-dialog-title">Aproxime uma etiqueta NFC virgem do celular</h2><p>Mantenha a etiqueta próxima até a confirmação.</p><button className="button secondary" onClick={() => controller.current?.abort()}>Cancelar gravação</button></dialog></>;
}
