import { NextRequest, NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { AppError } from "@/lib/service";
import { getMapa, updateMapa } from "@/lib/mapa-store";
import { mapaUpdateInput } from "@/lib/mapa";
import { ZodError } from "zod";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    if (!(await session())) throw new AppError(401, "Faça login para continuar.");
    return NextResponse.json(await getMapa());
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("LogTrack API (mapa):", error);
    return NextResponse.json({ error: "Não foi possível carregar o mapa." }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const allowed = new URL(process.env.NEXTAUTH_URL || request.url).origin;
    if (!origin || origin !== allowed) throw new AppError(403, "Origem da requisição não autorizada.");
    if (!(await session())) throw new AppError(401, "Faça login para continuar.");
    const body = mapaUpdateInput.parse(await request.json());
    return NextResponse.json(await updateMapa(body));
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues.map(x => x.path.join(".") + ": " + x.message).join(" ") }, { status: 400 });
    console.error("LogTrack API (mapa PUT):", error);
    return NextResponse.json({ error: "Não foi possível salvar o mapa." }, { status: 500 });
  }
}
