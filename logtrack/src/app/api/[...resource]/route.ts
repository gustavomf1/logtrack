import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { session } from "@/lib/auth";
import { AppError, dashboard, filterLots, mutate, registerRead } from "@/lib/service";
import { stationCookie } from "@/lib/security";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ resource: string[] }> };
async function handle(request: NextRequest, context: Context) {
  try {
    const [resource, id, action, extra] = (await context.params).resource;
    if (extra) throw new AppError(404, "Rota não encontrada.");
    if (request.method !== "GET") {
      const origin = request.headers.get("origin");
      const allowed = new URL(process.env.NEXTAUTH_URL || request.url).origin;
      if (!origin || origin !== allowed) throw new AppError(403, "Origem da requisição não autorizada.");
    }
    if (resource === "leituras" && request.method === "POST" && !id) {
      const body = await request.json();
      return NextResponse.json(await registerRead(body.loteId, body.requestId, request.cookies.get(stationCookie)?.value), { headers: { "Cache-Control": "no-store" } });
    }
    if (!(await session())) throw new AppError(401, "Faça login para continuar.");
    if (request.method === "GET") {
      const data = await dashboard();
      if (resource === "painel" && !id) return NextResponse.json(data);
      if (resource === "zonas" && !id) return NextResponse.json(data.zonas);
      if (resource === "celulares" && !id) return NextResponse.json(data.celulares);
      if (resource === "lotes" && !action) {
        if (!id) return NextResponse.json(filterLots(data, request.nextUrl.searchParams));
        const lote = data.lotes.find(x => x.id === id);
        if (!lote) throw new AppError(404, "Lote não encontrado.");
        return NextResponse.json({ ...lote, historico: data.movimentacoes.filter(x => x.loteId === id) });
      }
      throw new AppError(404, "Rota não encontrada.");
    }
    if (!["zonas", "celulares", "lotes"].includes(resource)) throw new AppError(404, "Rota não encontrada.");
    const allowedAction = request.method === "POST" && id && ((resource === "lotes" && action === "gravar-tag") || (resource === "celulares" && action === "regenerar-token"));
    const allowedCrud = !action && ((request.method === "POST" && !id) || (id && ["PATCH","DELETE"].includes(request.method)));
    if (!allowedAction && !allowedCrud) throw new AppError(405, "Método não permitido.");
    const body = request.method === "DELETE" ? {} : await request.json();
    const result = await mutate(resource, id, action, request.method, body, new URL(process.env.NEXTAUTH_URL || request.url).origin);
    return NextResponse.json(result, { status: request.method === "POST" && !id ? 201 : 200 });
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues.map(x => x.path.join(".") + ": " + x.message).join(" ") }, { status: 400 });
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Dados JSON inválidos." }, { status: 400 });
    console.error("LogTrack API:", error);
    return NextResponse.json({ error: "Não foi possível concluir a operação. Tente novamente." }, { status: 500 });
  }
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
