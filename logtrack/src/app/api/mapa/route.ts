import { NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { AppError } from "@/lib/service";
import { getMapa } from "@/lib/mapa-store";
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
