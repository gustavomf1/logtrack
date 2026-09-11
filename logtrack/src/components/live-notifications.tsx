"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Radio } from "lucide-react";
import { MOVEMENT_CHANNEL, type MovementEvent } from "@/lib/realtime";
import { zoneName } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

type Toast = { id: string; text: string };

export function LiveNotifications({ data }: { data: DashboardData }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dataRef = useRef(data);
  const router = useRouter();

  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const supabase = createClient(url, key);
    const channel = supabase.channel(MOVEMENT_CHANNEL);
    channel.on("broadcast", { event: "movement" }, ({ payload }: { payload: MovementEvent }) => {
      const current = dataRef.current;
      const codigo = current.lotes.find(l => l.id === payload.loteId)?.codigo || "Lote";
      const text = payload.tipo === "CANCELAMENTO"
        ? codigo + " · movimentação cancelada, voltou para Sem Zona"
        : codigo + " → " + zoneName(current.zonas, payload.zonaDestinoId);
      const id = crypto.randomUUID();
      setToasts(t => [...t, { id, text }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 5000);
      router.refresh();
    }).subscribe();
    return () => { channel.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!toasts.length) return null;
  return <div className="toast-stack" role="status">{toasts.map(t => <div className="toast" key={t.id}><Radio size={16}/>{t.text}</div>)}</div>;
}
