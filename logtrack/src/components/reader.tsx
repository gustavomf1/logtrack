"use client";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, Undo2, Radio, Clock, MapPin } from "lucide-react";
import { Brand } from "./brand";
import { date, datetime } from "@/lib/format";
import type { ReadResult } from "@/lib/types";
export function Reader({ id, codigo, descricao }: { id: string; codigo: string; descricao: string | null }) {
  const [result, setResult] = useState<ReadResult | null>(null); const [error, setError] = useState("");
  const pending = useRef<Promise<ReadResult> | null>(null);
  useEffect(() => {
    // Mesma promessa no replay de efeitos do React; mesmo requestId nos retries de rede.
    if (!pending.current) {
      const requestId = crypto.randomUUID();
      pending.current = (async () => {
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const response = await fetch("/api/leituras", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loteId: id, requestId }), cache: "no-store" });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Falha ao registrar leitura.");
            return data as ReadResult;
          } catch (error) { if (attempt === 2) throw error; await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1))); }
        }
        throw new Error("Sem conexão.");
      })();
    }
    pending.current.then(setResult).catch(e => setError(e.message));
  }, [id]);
  const Icon = result?.modo === "MOVIMENTO" ? CheckCircle2 : result?.modo === "CANCELAMENTO" ? Undo2 : Info;
  return <div className="public-page"><header><Brand/><span className="public-label">LEITURA RFID</span></header><main className="reader-card"><span className="eyebrow">IDENTIFICAÇÃO DO LOTE</span><h1>{codigo}</h1><p className="muted">{descricao || "Sem descrição"}</p>{error ? <div className="read-result error"><Info size={32}/><h2>Não foi possível registrar</h2><p>{error}</p><small>Verifique a conexão antes de aproximar a etiqueta novamente.</small></div> : !result ? <div className="read-result loading" role="status"><Radio className="pulse" size={38}/><h2>Processando leitura...</h2><p>Aguarde a confirmação da movimentação.</p></div> : <><div className={"read-result " + result.modo.toLowerCase()} role="status"><Icon size={38}/><h2>{result.mensagem}</h2><p>{datetime(result.timestamp)}</p></div><div className="reader-details"><div><MapPin size={18}/><span>Zona atual<strong>{result.zona}</strong></span></div><div><Clock size={18}/><span>Validade<strong>{date(result.lote.dataValidade)}</strong></span></div><div><span>Quantidade<strong>{result.lote.quantidade?.toLocaleString("pt-BR") ?? "Não informada"}</strong></span></div><div><span>Última movimentação<strong>{result.historico[0] ? datetime(result.historico[0].timestamp) : "Aguardando primeira leitura"}</strong></span></div></div><details className="reader-history" open><summary>Últimas movimentações <span>{result.historico.length}</span></summary>{result.historico.length ? result.historico.map(item => <div className="history-entry" key={item.id}><span className={"timeline-dot " + (item.tipo === "CANCELAMENTO" ? "amber" : "")}/><div><strong>{item.origem} → {item.destino}</strong><p>{item.celular}</p><small>{datetime(item.timestamp)}</small></div></div>) : <p className="empty-copy">Este lote ainda não foi movimentado.</p>}</details></>}<noscript>Ative o JavaScript para registrar a leitura automaticamente.</noscript></main><footer>LogTrack · CTMAQ<br/><small>Rastreabilidade em cada aproximação.</small></footer></div>;
}
