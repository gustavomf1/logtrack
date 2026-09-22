package com.logtrack.backend.util;

import com.logtrack.backend.entity.Lote;
import com.logtrack.backend.entity.Portal;

import java.util.UUID;

public final class MovementDecision {

    private MovementDecision() {
    }

    public static Result decide(Lote lote, Portal portal) {
        boolean cancelamento = lote.getZonaAtual() != null && lote.getUltimoPortal() != null
            && lote.getUltimoPortal().getId().equals(portal.getId());
        UUID zonaOrigemId = lote.getZonaAtual() != null ? lote.getZonaAtual().getId() : null;
        UUID zonaDestinoId = cancelamento ? null : portal.getZona().getId();
        String tipo = cancelamento ? "CANCELAMENTO" : "MOVIMENTO";
        return new Result(zonaOrigemId, zonaDestinoId, tipo);
    }

    // Resultado interno de cálculo — nunca serializado, fica como record.
    public record Result(UUID zonaOrigemId, UUID zonaDestinoId, String tipo) {
    }
}
