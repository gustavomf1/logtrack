"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageTitle } from "../ui";
import type { DashboardData } from "@/lib/types";
import type { MapaData } from "@/lib/mapa-client-types";
import { OperationalView } from "./operational-view";
import { MapaEmptyState } from "./empty-state";

export function MapaPage({ data, mapaData }: { data: DashboardData; mapaData: MapaData | null }) {
  const [mode, setMode] = useState<"operacional" | "configuracao">("operacional");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function upload(file: File) {
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("planta", file);
      const response = await fetch("/api/mapa/planta", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível enviar a imagem.");
      router.refresh();
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  return <>
    <PageTitle title="Mapa da empresa" description="Acompanhe zonas, portais RFID e lotes na planta do armazém.">
      <div className="mode-toggle">
        <button className={mode === "operacional" ? "active" : ""} onClick={() => setMode("operacional")}>OPERACIONAL</button>
        <button className={mode === "configuracao" ? "active" : ""} onClick={() => setMode("configuracao")}>CONFIGURAÇÃO</button>
      </div>
    </PageTitle>
    {error && <div className="form-error">{error}</div>}
    {!mapaData?.imagemUrl && <MapaEmptyState onUpload={upload} busy={busy}/>}
    {mapaData?.imagemUrl && mode === "operacional" && <OperationalView mapaData={mapaData} data={data}/>}
    {mapaData?.imagemUrl && mode === "configuracao" && <p className="muted">Modo de configuração chega na Task 5.</p>}
  </>;
}
