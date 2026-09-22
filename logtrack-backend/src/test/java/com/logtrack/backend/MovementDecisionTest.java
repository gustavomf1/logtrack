package com.logtrack.backend;

import com.logtrack.backend.entity.Lote;
import com.logtrack.backend.entity.Portal;
import com.logtrack.backend.entity.Zona;
import com.logtrack.backend.util.MovementDecision;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class MovementDecisionTest {

    private Zona zona(UUID id) {
        Zona z = new Zona();
        z.setId(id);
        return z;
    }

    private Portal portal(UUID id, Zona zona) {
        Portal p = new Portal();
        p.setId(id);
        p.setZona(zona);
        return p;
    }

    @Test
    void firstReadIsMovimentoIntoPortalZone() {
        Lote lote = new Lote();
        Zona destino = zona(UUID.randomUUID());
        Portal portal = portal(UUID.randomUUID(), destino);

        MovementDecision.Result result = MovementDecision.decide(lote, portal);

        assertNull(result.zonaOrigemId());
        assertEquals(destino.getId(), result.zonaDestinoId());
        assertEquals("MOVIMENTO", result.tipo());
    }

    @Test
    void rereadAtSamePortalIsCancelamento() {
        Zona origem = zona(UUID.randomUUID());
        Portal portal = portal(UUID.randomUUID(), origem);
        Lote lote = new Lote();
        lote.setZonaAtual(origem);
        lote.setUltimoPortal(portal);

        MovementDecision.Result result = MovementDecision.decide(lote, portal);

        assertEquals(origem.getId(), result.zonaOrigemId());
        assertNull(result.zonaDestinoId());
        assertEquals("CANCELAMENTO", result.tipo());
    }

    @Test
    void readAtDifferentPortalIsMovimentoBetweenZones() {
        Zona origem = zona(UUID.randomUUID());
        Zona destino = zona(UUID.randomUUID());
        Portal portalOrigem = portal(UUID.randomUUID(), origem);
        Portal portalDestino = portal(UUID.randomUUID(), destino);
        Lote lote = new Lote();
        lote.setZonaAtual(origem);
        lote.setUltimoPortal(portalOrigem);

        MovementDecision.Result result = MovementDecision.decide(lote, portalDestino);

        assertEquals(origem.getId(), result.zonaOrigemId());
        assertEquals(destino.getId(), result.zonaDestinoId());
        assertEquals("MOVIMENTO", result.tipo());
    }
}
