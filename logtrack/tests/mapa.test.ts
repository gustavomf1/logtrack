import { test } from "node:test";
import assert from "node:assert/strict";
import { clampNormalized, mapaUpdateInput } from "../src/lib/mapa";

test("clampNormalized mantém valores dentro de 0 e 1", () => {
  assert.equal(clampNormalized(0.42), 0.42);
  assert.equal(clampNormalized(-0.1), 0);
  assert.equal(clampNormalized(1.3), 1);
  assert.equal(clampNormalized(Number.NaN), 0);
});

test("mapaUpdateInput aceita um payload válido", () => {
  const result = mapaUpdateInput.parse({
    estacoes: [{ portalId: "11111111-1111-1111-1111-111111111111", apelido: "Entrada Principal", x: 0.5, y: 0.86 }],
    textos: [{ texto: "Escritório", x: 0.21, y: 0.67 }],
    zonas: [{ zonaId: "22222222-2222-2222-2222-222222222222", x: 0.3, y: 0.4 }],
  });
  assert.equal(result.estacoes[0].apelido, "Entrada Principal");
  assert.equal(result.textos[0].texto, "Escritório");
});

test("mapaUpdateInput rejeita coordenadas fora de 0..1", () => {
  assert.throws(() => mapaUpdateInput.parse({
    estacoes: [{ portalId: "11111111-1111-1111-1111-111111111111", x: 1.5, y: 0.2 }],
    textos: [],
    zonas: [],
  }));
});

test("mapaUpdateInput normaliza apelido em branco para null", () => {
  const result = mapaUpdateInput.parse({
    estacoes: [{ portalId: "11111111-1111-1111-1111-111111111111", apelido: "   ", x: 0.1, y: 0.1 }],
    textos: [],
    zonas: [],
  });
  assert.equal(result.estacoes[0].apelido, null);
});
