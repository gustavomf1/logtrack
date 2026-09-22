package com.logtrack.backend.util;

import com.logtrack.backend.dto.HistoricoItemDTO;
import com.logtrack.backend.entity.Movimentacao;

import java.util.List;
import java.util.stream.Collectors;

public final class HistoryBuilder {

    private HistoryBuilder() {
    }

    public static List<HistoricoItemDTO> build(List<Movimentacao> movimentacoes) {
        return movimentacoes.stream()
            .map(m -> HistoricoItemDTO.builder()
                .id(m.getId())
                .origem(ExpiryCalculator.zoneName(m.getZonaOrigem()))
                .destino(ExpiryCalculator.zoneName(m.getZonaDestino()))
                .portal(m.getPortal() != null ? m.getPortal().getNome() : "Estação")
                .timestamp(m.getTimestamp())
                .tipo(m.getTipo().name())
                .build())
            .collect(Collectors.toList());
    }
}
