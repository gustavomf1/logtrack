"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import useImage from "use-image";
import { GripVertical, Plus, Radio, Save, Type } from "lucide-react";
import type { MapaData, MapaEstacao, MapaTexto } from "@/lib/mapa-client-types";
import type { DashboardData } from "@/lib/types";

const Stage = dynamic(() => import("react-konva").then(m => m.Stage), { ssr: false });
const Layer = dynamic(() => import("react-konva").then(m => m.Layer), { ssr: false });
const KonvaImage = dynamic(() => import("react-konva").then(m => m.Image), { ssr: false });
const Group = dynamic(() => import("react-konva").then(m => m.Group), { ssr: false });
const Circle = dynamic(() => import("react-konva").then(m => m.Circle), { ssr: false });
const Text = dynamic(() => import("react-konva").then(m => m.Text), { ssr: false });

const STAGE_W = 900, STAGE_H = 600;

export function ConfigView({ mapaData, data, onSaved }: { mapaData: MapaData; data: DashboardData; onSaved: () => void }) {
  const [image] = useImage(mapaData.imagemUrl || "");
  const [estacoes, setEstacoes] = useState<MapaEstacao[]>(mapaData.estacoes);
  const [textos, setTextos] = useState<MapaTexto[]>(mapaData.textos);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const placedIds = new Set(estacoes.map(e => e.celularId));
  const unplaced = data.celulares.filter(c => !placedIds.has(c.id));

  function addEstacao(celularId: string) {
    const celular = data.celulares.find(c => c.id === celularId)!;
    const zona = data.zonas.find(z => z.id === celular.zonaId);
    setEstacoes(prev => [...prev, { id: "novo-" + celularId, celularId, celularNome: celular.nome, zonaId: celular.zonaId, zonaNome: zona?.nome || "", apelido: null, x: 0.5, y: 0.5 }]);
  }
  function moveEstacao(celularId: string, x: number, y: number) {
    setEstacoes(prev => prev.map(e => e.celularId === celularId ? { ...e, x, y } : e));
  }
  function renameEstacao(celularId: string, apelido: string) {
    setEstacoes(prev => prev.map(e => e.celularId === celularId ? { ...e, apelido: apelido || null } : e));
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

  async function save() {
    setBusy(true); setError("");
    try {
      const body = {
        estacoes: estacoes.map(e => ({ celularId: e.celularId, apelido: e.apelido, x: e.x, y: e.y })),
        textos: textos.map(t => ({ id: t.id.startsWith("novo-") ? undefined : t.id, texto: t.texto, x: t.x, y: t.y })),
      };
      const response = await fetch("/api/mapa", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar o mapa.");
      onSaved();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return <div className="workspace-row">
    <div className="elements-panel">
      <div className="elements-heading">PORTAIS RFID</div>
      {estacoes.map(e => <div className="el-item" key={e.celularId}>
        <GripVertical className="grip" size={14}/>
        <span className="el-icon"><Radio size={12}/></span>
        <div>
          <input value={e.apelido || ""} placeholder={e.celularNome} onChange={ev => renameEstacao(e.celularId, ev.target.value)}/>
          <small>{e.celularNome} · Zona: {e.zonaNome}</small>
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
    </div>

    <div className="map-panel">
      {error && <div className="form-error" style={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 2 }}>{error}</div>}
      <Stage width={STAGE_W} height={STAGE_H} style={{ background: "#0e1218", borderRadius: 4 }}>
        <Layer>
          {image && <KonvaImage image={image} width={STAGE_W} height={STAGE_H}/>}
          {estacoes.map(e => <Group key={e.celularId} x={e.x * STAGE_W} y={e.y * STAGE_H} draggable
            onDragEnd={ev => moveEstacao(e.celularId, ev.target.x() / STAGE_W, ev.target.y() / STAGE_H)}>
            <Circle radius={15} fill="#1f2733" stroke="#2c3546"/>
            <Text text={e.apelido || e.celularNome} fontSize={10} fill="#c9cede" y={18} offsetX={-(-20)} align="center" width={100} x={-50}/>
          </Group>)}
          {textos.map(t => <Text key={t.id} x={t.x * STAGE_W} y={t.y * STAGE_H} text={t.texto} fontSize={11}
            fill="#c9cede" draggable
            onDragEnd={ev => moveTexto(t.id, ev.target.x() / STAGE_W, ev.target.y() / STAGE_H)}/>)}
        </Layer>
      </Stage>
    </div>

    <div className="form-actions" style={{ gridColumn: "1 / -1" }}>
      <button className="button primary" disabled={busy} onClick={save}><Save size={15}/>{busy ? "Salvando…" : "Salvar"}</button>
    </div>
  </div>;
}
