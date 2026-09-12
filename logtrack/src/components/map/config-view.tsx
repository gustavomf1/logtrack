"use client";
import { useEffect, useState } from "react";
import useImage from "use-image";
import { GripVertical, MapPin, Plus, Radio, Save, Type } from "lucide-react";
import type * as ReactKonva from "react-konva";
import type { MapaData, MapaEstacao, MapaTexto, MapaZona } from "@/lib/mapa-client-types";
import type { DashboardData } from "@/lib/types";

const STAGE_W = 900, STAGE_H = 600;

// Carregado via useEffect (em vez de next/dynamic por export) porque o Turbopack
// resolve mal os exports nomeados do react-konva através de next/dynamic,
// deixando m.Layer etc. como a string do nome em vez do componente.
export function ConfigView({ mapaData, data, onSaved }: { mapaData: MapaData; data: DashboardData; onSaved: () => void }) {
  const [konva, setKonva] = useState<typeof ReactKonva | null>(null);
  useEffect(() => { import("react-konva").then(setKonva); }, []);
  const [image] = useImage(mapaData.imagemUrl || "");
  const [estacoes, setEstacoes] = useState<MapaEstacao[]>(mapaData.estacoes);
  const [textos, setTextos] = useState<MapaTexto[]>(mapaData.textos);
  const [zonasMapa, setZonasMapa] = useState<MapaZona[]>(mapaData.zonas);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const loteCounts = new Map(data.zonas.map(z => [z.id, data.lotes.filter(l => !l.arquivado && l.zonaAtualId === z.id).length]));

  if (!konva) return <div className="map-panel" style={{ minHeight: STAGE_H }}/>;
  const { Stage, Layer, Image: KonvaImage, Group, Circle, Rect, Label, Tag, Text } = konva;

  const placedIds = new Set(estacoes.map(e => e.portalId));
  const unplaced = data.portais.filter(c => !placedIds.has(c.id));
  const placedZonaIds = new Set(zonasMapa.map(z => z.zonaId));
  const unplacedZonas = data.zonas.filter(z => !placedZonaIds.has(z.id));

  function addEstacao(portalId: string) {
    const portal = data.portais.find(c => c.id === portalId)!;
    const zona = data.zonas.find(z => z.id === portal.zonaId);
    setEstacoes(prev => [...prev, { id: "novo-" + portalId, portalId, portalNome: portal.nome, zonaId: portal.zonaId, zonaNome: zona?.nome || "", apelido: null, x: 0.5, y: 0.5 }]);
  }
  function moveEstacao(portalId: string, x: number, y: number) {
    setEstacoes(prev => prev.map(e => e.portalId === portalId ? { ...e, x, y } : e));
  }
  function renameEstacao(portalId: string, apelido: string) {
    setEstacoes(prev => prev.map(e => e.portalId === portalId ? { ...e, apelido: apelido || null } : e));
  }
  function addTexto() {
    setTextos(prev => [...prev, { id: "novo-" + Date.now(), texto: "Novo texto", x: 0.5, y: 0.5 }]);
  }
  function moveTexto(id: string, x: number, y: number) {
    setTextos(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
  }
  function renameTexto(id: string, texto: string) {
    setTextos(prev => prev.map(t => t.id === id ? { ...t, texto } : t));
  }
  function addZona(zonaId: string) {
    const zona = data.zonas.find(z => z.id === zonaId)!;
    setZonasMapa(prev => [...prev, { id: "novo-" + zonaId, zonaId, zonaNome: zona.nome, x: 0.5, y: 0.5 }]);
  }
  function moveZona(zonaId: string, x: number, y: number) {
    setZonasMapa(prev => prev.map(z => z.zonaId === zonaId ? { ...z, x, y } : z));
  }

  async function save() {
    setBusy(true); setError("");
    try {
      const body = {
        estacoes: estacoes.map(e => ({ portalId: e.portalId, apelido: e.apelido, x: e.x, y: e.y })),
        textos: textos.map(t => ({ id: t.id.startsWith("novo-") ? undefined : t.id, texto: t.texto, x: t.x, y: t.y })),
        zonas: zonasMapa.map(z => ({ zonaId: z.zonaId, x: z.x, y: z.y })),
      };
      const response = await fetch("/api/mapa", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar o mapa.");
      const saved = result as MapaData;
      setEstacoes(saved.estacoes);
      setTextos(saved.textos);
      setZonasMapa(saved.zonas);
      onSaved();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return <div className="workspace-row">
    <div className="elements-panel">
      <div className="elements-heading">PORTAIS RFID</div>
      {estacoes.map(e => <div className="el-item" key={e.portalId}>
        <GripVertical className="grip" size={14}/>
        <span className="el-icon"><Radio size={12}/></span>
        <div>
          <input value={e.apelido || ""} placeholder={e.portalNome} onChange={ev => renameEstacao(e.portalId, ev.target.value)}/>
          <small>{e.portalNome} · Zona: {e.zonaNome}</small>
        </div>
      </div>)}
      {unplaced.length > 0 && <div className="elements-heading">NÃO POSICIONADAS</div>}
      {unplaced.map(c => <button key={c.id} className="el-add" onClick={() => addEstacao(c.id)}>
        <Plus size={14}/><span>{c.nome}</span>
      </button>)}

      <div className="el-divider"/>
      <div className="elements-heading">TEXTOS</div>
      {textos.map(t => <div className="el-item" key={t.id}>
        <GripVertical className="grip" size={14}/>
        <span className="el-icon"><Type size={12}/></span>
        <div><input value={t.texto} onChange={ev => renameTexto(t.id, ev.target.value)}/></div>
      </div>)}
      <button className="el-add" onClick={addTexto}><Plus size={14}/><span>Novo texto</span></button>

      <div className="el-divider"/>
      <div className="elements-heading">ZONAS (LOTES)</div>
      {zonasMapa.map(z => <div className="el-item" key={z.zonaId}>
        <GripVertical className="grip" size={14}/>
        <span className="el-icon"><MapPin size={12}/></span>
        <div><strong>{z.zonaNome}</strong><small>{loteCounts.get(z.zonaId) ?? 0} lotes</small></div>
      </div>)}
      {unplacedZonas.length > 0 && <div className="elements-heading">NÃO POSICIONADAS</div>}
      {unplacedZonas.map(z => <button key={z.id} className="el-add" onClick={() => addZona(z.id)}>
        <Plus size={14}/><span>{z.nome}</span>
      </button>)}
    </div>

    <div className="map-panel">
      {error && <div className="form-error" style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 2 }}>{error}</div>}
      <Stage width={STAGE_W} height={STAGE_H} style={{ background: "#0e1218", borderRadius: 4 }}>
        <Layer>
          {image && <KonvaImage image={image} width={STAGE_W} height={STAGE_H}/>}
          {estacoes.map(e => <Group key={e.portalId} x={e.x * STAGE_W} y={e.y * STAGE_H} draggable
            onDragEnd={ev => moveEstacao(e.portalId, ev.target.x() / STAGE_W, ev.target.y() / STAGE_H)}>
            <Circle radius={15} fill="#1f2733" stroke="#2c3546"/>
            <Label x={-50} y={12} width={100} align="center">
              <Tag fill="rgba(14,18,24,0.8)" cornerRadius={3}/>
              <Text text={e.apelido || e.portalNome} fontSize={10} fill="#e8ebf2" padding={3} align="center" width={100}/>
            </Label>
          </Group>)}
          {textos.map(t => <Label key={t.id} x={t.x * STAGE_W} y={t.y * STAGE_H} draggable
            onDragEnd={ev => moveTexto(t.id, ev.target.x() / STAGE_W, ev.target.y() / STAGE_H)}>
            <Tag fill="rgba(14,18,24,0.8)" cornerRadius={4}/>
            <Text text={t.texto} fontSize={11} fill="#e8ebf2" padding={5}/>
          </Label>)}
          {zonasMapa.map(z => <Group key={z.zonaId} x={z.x * STAGE_W} y={z.y * STAGE_H} draggable
            onDragEnd={ev => moveZona(z.zonaId, ev.target.x() / STAGE_W, ev.target.y() / STAGE_H)}>
            <Rect x={-60} y={-24} width={120} height={48} fill="rgba(22,27,35,0.9)" stroke="#2c3546" cornerRadius={6}/>
            <Text text={z.zonaNome.toUpperCase()} fontSize={8} fill="#8b96ab" x={-52} y={-17} width={104}/>
            <Text text={String(loteCounts.get(z.zonaId) ?? 0) + " lotes"} fontSize={15} fill="#e8ebf2" x={-52} y={-4} width={104}/>
          </Group>)}
        </Layer>
      </Stage>
    </div>

    <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
      <button className="button primary" disabled={busy} onClick={save}><Save size={15}/>{busy ? "Salvando…" : "Salvar"}</button>
    </div>
  </div>;
}
