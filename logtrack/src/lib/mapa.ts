import { z } from "zod";
const idSchema = z.string().uuid();
export const coordSchema = z.number().min(0).max(1);
export function clampNormalized(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
export const estacaoMapaInput = z.object({
  portalId: idSchema,
  apelido: z.string().trim().max(100).nullable().optional().transform(v => v || null),
  x: coordSchema,
  y: coordSchema,
});
export const textoMapaInput = z.object({
  id: idSchema.optional(),
  texto: z.string().trim().min(1, "Preencha o texto.").max(200),
  x: coordSchema,
  y: coordSchema,
});
export const mapaUpdateInput = z.object({
  estacoes: z.array(estacaoMapaInput).max(200),
  textos: z.array(textoMapaInput).max(200),
});
export type MapaUpdateInput = z.infer<typeof mapaUpdateInput>;
