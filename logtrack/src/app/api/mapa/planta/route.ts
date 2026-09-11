import { NextRequest, NextResponse } from "next/server";
import { session } from "@/lib/auth";
import { AppError } from "@/lib/service";
import { uploadPlanta } from "@/lib/mapa-store";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const allowed = new URL(process.env.NEXTAUTH_URL || request.url).origin;
    if (!origin || origin !== allowed) throw new AppError(403, "Origem da requisição não autorizada.");
    if (!(await session())) throw new AppError(401, "Faça login para continuar.");
    const form = await request.formData();
    const file = form.get("planta");
    if (!(file instanceof File)) throw new AppError(400, "Envie um arquivo de imagem.");
    if (!["image/png", "image/jpeg"].includes(file.type)) throw new AppError(400, "Envie um arquivo PNG ou JPG.");
    if (file.size > 10 * 1024 * 1024) throw new AppError(400, "A imagem deve ter até 10 MB.");
    return NextResponse.json(await uploadPlanta(file));
  } catch (error) {
    if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("LogTrack API (mapa/planta):", error);
    return NextResponse.json({ error: "Não foi possível enviar a imagem." }, { status: 500 });
  }
}
