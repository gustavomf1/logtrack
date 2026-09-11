"use client";
import { useState } from "react";
import { PageTitle, Empty } from "../ui";
import type { DashboardData } from "@/lib/types";
import type { MapaData } from "@/lib/mapa-client-types";
import { OperationalView } from "./operational-view";
import { MapaEmptyState } from "./empty-state";

export function MapaPage({ data, mapaData }: { data: DashboardData; mapaData: MapaData | null }) {
  const [mode, setMode] = useState<"operacional" | "configuracao">("operacional");
  return <>
    <PageTitle title="Mapa da empresa" description="Acompanhe zonas, portais RFID e lotes na planta do armazém.">
      <div className="mode-toggle">
        <button className={mode === "operacional" ? "active" : ""} onClick={() => setMode("operacional")}>OPERACIONAL</button>
        <button className={mode === "configuracao" ? "active" : ""} onClick={() => setMode("configuracao")}>CONFIGURAÇÃO</button>
      </div>
    </PageTitle>
    {mode === "operacional"
      ? (mapaData ? <OperationalView mapaData={mapaData} data={data}/> : <Empty>Nenhuma planta cadastrada ainda. Abra o modo Configuração para enviar uma.</Empty>)
      : <ConfigPlaceholder/>}
  </>;
}
function ConfigPlaceholder() { return <p className="muted">Modo de configuração chega na Task 5.</p>; }
