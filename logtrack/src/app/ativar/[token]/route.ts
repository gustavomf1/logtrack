import { NextRequest, NextResponse } from "next/server";
import { readState } from "@/lib/store";
import { cookieOptions, hashToken, signStation, stationCookie } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const origin = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  function redirectToStation(query: string) {
    const response = NextResponse.redirect(new URL("/estacao?" + query, origin));
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  }
  if (!/^[a-f0-9]{64}$/.test(token)) return redirectToStation("erro=token");
  const state = await readState();
  const celular = state.celulares.find(x => x.tokenCookie === hashToken(token) && x.ativo && state.zonas.some(z => z.id === x.zonaId && z.ativa));
  if (!celular) return redirectToStation("erro=token");
  const response = redirectToStation("ativado=1");
  response.cookies.set(stationCookie, signStation(celular.id, celular.tokenCookie), cookieOptions());
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
