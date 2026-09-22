package com.logtrack.backend;

import com.logtrack.backend.util.ExpiryCalculator;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ExpiryCalculatorTest {

    @Test
    void nullDateIsRegular() {
        assertEquals("regular", ExpiryCalculator.expiry(null));
    }

    @Test
    void pastDateIsVencido() {
        LocalDate yesterday = LocalDate.now(ZoneId.of("America/Sao_Paulo")).minusDays(1);
        assertEquals("vencido", ExpiryCalculator.expiry(yesterday));
    }

    @Test
    void within30DaysIsProximo() {
        LocalDate soon = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(10);
        assertEquals("proximo", ExpiryCalculator.expiry(soon));
    }

    @Test
    void farFutureIsRegular() {
        LocalDate far = LocalDate.now(ZoneId.of("America/Sao_Paulo")).plusDays(90);
        assertEquals("regular", ExpiryCalculator.expiry(far));
    }
}
