import { cookies } from "next/headers";
import Link from "next/link";
import { Radio, CheckCircle2, Smartphone, Info } from "lucide-react";
import { readState } from "@/lib/store";
import { stationCookie, verifyStation } from "@/lib/security";
import { Brand } from "@/components/brand";
import { zoneName } from "@/lib/format";
export const dynamic = "force-dynamic";
export const metadata = { title: "Estação de operação" };
export default async function Station({ searchParams }: { searchParams: Promise<{ erro?: string; ativado?: string }> }) {
  const params = await searchParams;
  const identity = verifyStation((await cookies()).get(stationCookie)?.value);
  const state = await readState();
  const station = state.celulares.find(c => c.id === identity?.id && c.tokenCookie === identity.tokenHash && c.ativo && state.zonas.some(z => z.id === c.zonaId && z.ativa));
  return <div className="public-page"><header><Brand/><Smartphone size={21}/></header><main className="reader-card station-card">{params.erro ? <><Info size={42}/><h1>Link de ativação inválido</h1><p>Peça ao supervisor um novo link de ativação para este celular.</p></> : station ? <><div className="station-ready"><CheckCircle2 size={18}/>Estação {params.ativado ? "ativada com sucesso" : "pronta para operar"}</div><div className="station-nfc"><Radio size={64}/></div><h1>{station.nome}</h1><p className="station-zone">{zoneName(state.zonas, station.zonaId)}</p><h2>Aproxime uma etiqueta NFC</h2><p>A URL da etiqueta abrirá o lote e registrará a movimentação automaticamente.</p><div className="info-box">No Chrome, abra o menu e escolha <strong>Adicionar à tela inicial</strong> para salvar esta estação. Mantenha o NFC do Android ativado.</div><small>Uma segunda leitura pelo mesmo celular cancela a movimentação.</small></> : <><Smartphone size={46}/><h1>Vincule este celular</h1><p>Abra o link de ativação fornecido pelo supervisor para vincular este aparelho a uma zona.</p><Link className="button secondary" href="/login">Acesso do supervisor</Link></>}</main><footer>LogTrack · Operação NFC</footer></div>;
}
