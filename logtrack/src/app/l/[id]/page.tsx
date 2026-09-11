import { notFound } from "next/navigation";
import { readState } from "@/lib/store";
import { Reader } from "@/components/reader";
export const dynamic = "force-dynamic";
export const metadata = { title: "Leitura de lote", referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await readState();
  const lote = state.lotes.find(x => x.id === id);
  if (!lote) notFound();
  return <Reader key={id} id={id} codigo={lote.codigo} descricao={lote.descricao}/>;
}
