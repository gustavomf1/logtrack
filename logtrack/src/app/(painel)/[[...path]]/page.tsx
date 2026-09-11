import { redirect, notFound } from "next/navigation";
import { cookies } from "next/headers";
import { session } from "@/lib/auth";
import { dashboard } from "@/lib/service";
import { getMapa } from "@/lib/mapa-store";
import { verifyStation, stationCookie } from "@/lib/security";
import { Shell } from "@/components/shell";
import { Dashboard } from "@/components/dashboard";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const user = await session();
  if (!user) {
    if (!path.length) {
      if (verifyStation((await cookies()).get(stationCookie)?.value)) redirect("/estacao");
    } else redirect("/login");
  }
  if (path.length && !["lotes", "zonas", "celulares", "mapa", "ajuda"].includes(path[0])) notFound();
  if (path.length > 3 || (path[0] === "ajuda" && path.length > 1) ||
    (path.length === 3 && (path[0] !== "lotes" || !["editar", "gravar"].includes(path[2]))) ||
    (path.length > 2 && path[1] === "novo")) notFound();
  const data = await dashboard();
  const mapaData = path[0] === "mapa" ? await getMapa() : null;
  if (path[1] && path[0] === "zonas" && path[1] !== "nova" && !data.zonas.some(z => z.id === path[1])) notFound();
  if (path[1] && path[0] === "celulares" && path[1] !== "novo" && !data.celulares.some(c => c.id === path[1])) notFound();
  if (path[1] && path[0] === "lotes" && path[1] !== "novo" && !data.lotes.some(l => l.id === path[1])) notFound();
  return <Shell name={user ? user.user?.name || "Supervisor" : null}><Dashboard key={path.join("/")} initialData={data} mapaData={mapaData} path={path} authenticated={Boolean(user)}/></Shell>;
}
