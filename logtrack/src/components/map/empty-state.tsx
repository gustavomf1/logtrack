"use client";
import { Upload } from "lucide-react";
export function MapaEmptyState({ onUpload, busy }: { onUpload: (file: File) => void; busy: boolean }) {
  return <div className="empty-panel">
    <div className="empty-inner">
      <div className="empty-icon"><Upload size={28}/></div>
      <h2>Nenhuma planta enviada</h2>
      <p>Envie uma imagem da planta do armazém (PNG ou JPG) para começar a posicionar zonas, portais e textos sobre ela.</p>
      <label className="button">
        <Upload size={15}/>{busy ? "Enviando…" : "Fazer upload da planta"}
        <input type="file" accept="image/png,image/jpeg" hidden disabled={busy}
          onChange={e => { const file = e.target.files?.[0]; if (file) onUpload(file); e.target.value = ""; }}/>
      </label>
      <small>PNG ou JPG · até 10 MB</small>
    </div>
  </div>;
}
