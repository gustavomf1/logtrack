package com.logtrack.backend.service;

import com.logtrack.backend.dto.MovementEventDTO;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.enterprise.event.TransactionPhase;

/**
 * Observa MovementEventDTO disparado por LeituraService.registrar() - AFTER_SUCCESS
 * garante que so propaga depois que a transacao (e a movimentacao) ja commitou, senao
 * um assinante SSE poderia disparar GET /api/painel antes do commit e ver o estado antigo.
 */
@ApplicationScoped
public class EventoBroadcaster {

    private final BroadcastProcessor<MovementEventDTO> processor = BroadcastProcessor.create();

    void on(@Observes(during = TransactionPhase.AFTER_SUCCESS) MovementEventDTO event) {
        processor.onNext(event);
    }

    public Multi<MovementEventDTO> stream() {
        return processor;
    }
}
