package com.logtrack.backend.util;

import com.logtrack.backend.entity.Zona;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

public final class ExpiryCalculator {

    private ExpiryCalculator() {
    }

    public static String expiry(LocalDate dataValidade) {
        if (dataValidade == null) return "regular";
        LocalDate today = LocalDate.now(ZoneId.of("America/Sao_Paulo"));
        long days = ChronoUnit.DAYS.between(today, dataValidade);
        if (days < 0) return "vencido";
        if (days <= 30) return "proximo";
        return "regular";
    }

    public static String zoneName(Zona zona) {
        return zona == null ? "Sem Zona" : zona.getNome();
    }
}
