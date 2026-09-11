"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import type { Lote } from "@/lib/types";
import { api } from "./ui";

export function DeleteLotButton({ lot, compact = false }: { lot: Lote; compact?: boolean }) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await api("lotes/" + lot.id, "DELETE");
      dialog.current?.close();
      router.push("/lotes?excluido=1");
      router.refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return <>
    <button type="button" className={compact ? "icon-button delete-lot-button" : "button danger"} aria-label={"Excluir lote " + lot.codigo} title="Excluir lote" onClick={() => { setError(""); dialog.current?.showModal(); }}>
      <Trash2 size={17}/>{!compact && "Excluir lote"}
    </button>
    <dialog ref={dialog} className="delete-lot-dialog" aria-label={"Excluir lote " + lot.codigo} onCancel={event => { if (busy) event.preventDefault(); }}>
      <span className="delete-lot-icon"><Trash2 size={25}/></span>
      <h2>Excluir lote {lot.codigo}?</h2>
      <p>O lote será removido do estoque e não poderá receber novas movimentações. Seu histórico será preservado para consulta.</p>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="form-actions">
        <button type="button" className="button secondary" autoFocus disabled={busy} onClick={() => dialog.current?.close()}>Cancelar</button>
        <button type="button" className="button danger" disabled={busy} onClick={remove}>{busy ? "Excluindo..." : "Confirmar exclusão"}</button>
      </div>
    </dialog>
  </>;
}
