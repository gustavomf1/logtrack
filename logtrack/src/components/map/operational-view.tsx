"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Radio } from "lucide-react";
import { MOVEMENT_CHANNEL, type MovementEvent } from "@/lib/realtime";
import type { MapaData } from "@/lib/mapa-client-types";
import type { DashboardData } from "@/lib/types";

export function OperationalView({ mapaData, data }: { mapaData: MapaData; data: DashboardData }) {
  const [highlight, setHighlight] = useState<{ celularId: string; zonaId: string | null } | null>(null);
  const router = useRouter();
  const mapaRef = useRef(mapaData);
  useEffect(() => { mapaRef.current = mapaData; }, [mapaData]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const supabase = createClient(url, key);
    const channel = supabase.channel(MOVEMENT_CHANNEL);
    channel.on("broadcast", { event: "movement" }, ({ payload }: { payload: MovementEvent }) => {
      if (!mapaRef.current.estacoes.some(e => e.celularId === payload.celularId)) return;
      setHighlight({ celularId: payload.celularId, zonaId: payload.zonaDestinoId });
      setTimeout(() => setHighlight(null), 5000);
      router.refresh();
    }).subscribe();
    return () => { channel.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loteCounts = new Map(data.zonas.map(z => [z.id, data.lotes.filter(l => !l.arquivado && l.zonaAtualId === z.id).length]));

  return <div className="map-panel">
    <div className="live-indicator"><span className="live-dot"/>ATUALIZADO {highlight ? "AGORA" : "—"}</div>
    <div className="plan-frame">
      {mapaData.imagemUrl && <img src={mapaData.imagemUrl} alt={mapaData.nome}/>}
      {[...new Set(mapaData.estacoes.map(e => e.zonaId))].map(zonaId => {
        const zona = data.zonas.find(z => z.id === zonaId);
        if (!zona) return null;
        const anchor = mapaData.estacoes.find(e => e.zonaId === zonaId);
        if (!anchor) return null;
        return <div key={zonaId} className={"map-zone-card" + (highlight?.zonaId === zonaId ? " highlight" : "")} style={{ left: (anchor.x * 100) + "%", top: (Math.max(anchor.y - 0.12, 0.03) * 100) + "%" }}>
          <span>{zona.nome.toUpperCase()}</span>
          <strong>{loteCounts.get(zonaId) ?? 0}<small>lotes</small></strong>
        </div>;
      })}
      {mapaData.textos.map(t => <div key={t.id} className="text-label" style={{ left: (t.x * 100) + "%", top: (t.y * 100) + "%" }}>{t.texto}</div>)}
      {mapaData.estacoes.map(e => <div key={e.id} className={"portal" + (highlight?.celularId === e.celularId ? " highlight" : "")} style={{ left: (e.x * 100) + "%", top: (e.y * 100) + "%" }}>
        <Radio size={15}/>
      </div>)}
    </div>
  </div>;
}
