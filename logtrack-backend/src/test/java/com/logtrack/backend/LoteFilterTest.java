package com.logtrack.backend;

import com.logtrack.backend.entity.Lote;
import com.logtrack.backend.entity.Zona;
import com.logtrack.backend.util.LoteFilter;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LoteFilterTest {

    private Lote lote(String codigo, Zona zona, boolean tagGravada, boolean arquivado) {
        Lote l = new Lote();
        l.setId(UUID.randomUUID());
        l.setCodigo(codigo);
        l.setZonaAtual(zona);
        l.setTagGravada(tagGravada);
        l.setArquivado(arquivado);
        return l;
    }

    @Test
    void excludesArchivedByDefault() {
        Lote ativo = lote("A1", null, true, false);
        Lote arquivado = lote("A2", null, true, true);
        List<Lote> result = LoteFilter.apply(List.of(ativo, arquivado), null, null, null);
        assertEquals(1, result.size());
        assertEquals("A1", result.get(0).getCodigo());
    }

    @Test
    void filtersBySemZona() {
        Zona zona = new Zona();
        zona.setId(UUID.randomUUID());
        Lote semZona = lote("B1", null, true, false);
        Lote comZona = lote("B2", zona, true, false);
        List<Lote> result = LoteFilter.apply(List.of(semZona, comZona), "sem-zona", null, null);
        assertEquals(1, result.size());
        assertEquals("B1", result.get(0).getCodigo());
    }

    @Test
    void filtersBySemTag() {
        Lote semTag = lote("C1", null, false, false);
        Lote comTag = lote("C2", null, true, false);
        List<Lote> result = LoteFilter.apply(List.of(semTag, comTag), null, "sem-tag", null);
        assertEquals(1, result.size());
        assertEquals("C1", result.get(0).getCodigo());
    }

    @Test
    void filtersByBusca() {
        Lote a = lote("XPTO-1", null, true, false);
        Lote b = lote("OUTRO-2", null, true, false);
        List<Lote> result = LoteFilter.apply(List.of(a, b), null, null, "xpto");
        assertEquals(1, result.size());
        assertEquals("XPTO-1", result.get(0).getCodigo());
    }
}
