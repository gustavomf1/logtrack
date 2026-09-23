package com.logtrack.backend.util;

import com.logtrack.backend.entity.Lote;

import java.util.List;
import java.util.stream.Collectors;

public final class LoteFilter {

    private LoteFilter() {
    }

    public static List<Lote> apply(List<Lote> lotes, String zona, String status, String busca) {
        String search = busca == null ? "" : busca.toLowerCase();
        return lotes.stream()
            .filter(l -> !l.isArquivado())
            .filter(l -> zona == null
                || (zona.equals("sem-zona") ? l.getZonaAtual() == null : l.getZonaAtual() != null && zona.equals(l.getZonaAtual().getId().toString())))
            .filter(l -> status == null
                || (status.equals("sem-tag") ? !l.isTagGravada() : status.equals(ExpiryCalculator.expiry(l.getDataValidade()))))
            .filter(l -> search.isEmpty() || (l.getCodigo() + " " + (l.getDescricao() == null ? "" : l.getDescricao())).toLowerCase().contains(search))
            .collect(Collectors.toList());
    }
}
