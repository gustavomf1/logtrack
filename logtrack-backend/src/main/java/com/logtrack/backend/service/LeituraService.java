package com.logtrack.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logtrack.backend.common.AppException;
import com.logtrack.backend.dto.HistoricoItemDTO;
import com.logtrack.backend.dto.LeituraRequestDTO;
import com.logtrack.backend.dto.MovementEventDTO;
import com.logtrack.backend.dto.ReadResultDTO;
import com.logtrack.backend.entity.Leitura;
import com.logtrack.backend.entity.Lote;
import com.logtrack.backend.entity.Movimentacao;
import com.logtrack.backend.entity.Portal;
import com.logtrack.backend.repository.LeituraRepository;
import com.logtrack.backend.repository.LoteRepository;
import com.logtrack.backend.repository.MovimentacaoRepository;
import com.logtrack.backend.repository.PortalRepository;
import com.logtrack.backend.security.StationSigner;
import com.logtrack.backend.util.ExpiryCalculator;
import com.logtrack.backend.util.HistoryBuilder;
import com.logtrack.backend.util.MovementDecision;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@ApplicationScoped
public class LeituraService {

    private static final long ADVISORY_LOCK_KEY = 742019L;

    @Inject
    EntityManager entityManager;

    @Inject
    LoteRepository loteRepository;

    @Inject
    PortalRepository portalRepository;

    @Inject
    MovimentacaoRepository movimentacaoRepository;

    @Inject
    LeituraRepository leituraRepository;

    @Inject
    StationSigner stationSigner;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    LoteService loteService;

    @Inject
    Event<MovementEventDTO> movementEvent;

    @Transactional
    public ReadResultDTO registrar(LeituraRequestDTO request, String stationCookieValue) {
        // Mesmo lock que o store.ts original usava — leituras concorrentes com o
        // mesmo requestId (rajada de fila offline do firmware ao reconectar) são
        // esperadas, não uma condição de borda.
        entityManager.createNativeQuery("SELECT pg_advisory_xact_lock(:key)")
            .setParameter("key", ADVISORY_LOCK_KEY)
            .getSingleResult();

        Lote lote = loteRepository.findByIdOptional(request.getLoteId())
            .orElseThrow(() -> new AppException(404, "Lote não encontrado."));

        Portal portal = stationSigner.verify(stationCookieValue)
            .flatMap(identity -> portalRepository.findByIdOptional(identity.portalId())
                .filter(p -> p.getTokenCookie().equals(identity.tokenHash())))
            .filter(p -> p.isAtivo() && p.getZona().isAtiva())
            .orElse(null);

        Leitura existing = leituraRepository.findById(request.getRequestId()).orElse(null);
        if (existing != null) {
            UUID existingPortalId = existing.getPortal() != null ? existing.getPortal().getId() : null;
            UUID incomingPortalId = portal != null ? portal.getId() : null;
            if (!existing.getLote().getId().equals(request.getLoteId()) || !Objects.equals(existingPortalId, incomingPortalId)) {
                throw new AppException(409, "Identificador de leitura já utilizado.");
            }
            return deserialize(existing.getResultado());
        }

        Instant timestamp = Instant.now();
        String modo;

        if (portal != null && !lote.isArquivado()) {
            MovementDecision.Result decision = MovementDecision.decide(lote, portal);
            Movimentacao movimentacao = new Movimentacao();
            movimentacao.setLote(lote);
            movimentacao.setPortal(portal);
            movimentacao.setZonaOrigem(lote.getZonaAtual());
            movimentacao.setZonaDestino(decision.tipo().equals("CANCELAMENTO") ? null : portal.getZona());
            movimentacao.setTipo(Movimentacao.Tipo.valueOf(decision.tipo()));
            movimentacao.setTimestamp(timestamp);
            movimentacaoRepository.persist(movimentacao);

            lote.setZonaAtual(movimentacao.getZonaDestino());
            lote.setUltimoPortal(portal);
            portal.setUltimoUso(timestamp);
            modo = decision.tipo();

            movementEvent.fire(MovementEventDTO.builder()
                .loteId(lote.getId())
                .zonaOrigemId(movimentacao.getZonaOrigem() != null ? movimentacao.getZonaOrigem().getId() : null)
                .zonaDestinoId(movimentacao.getZonaDestino() != null ? movimentacao.getZonaDestino().getId() : null)
                .portalId(portal.getId())
                .tipo(decision.tipo())
                .timestamp(timestamp)
                .build());
        } else {
            modo = "CONSULTA";
        }

        String zonaNome = ExpiryCalculator.zoneName(lote.getZonaAtual());
        String mensagem = switch (modo) {
            case "MOVIMENTO" -> "Movido para " + zonaNome;
            case "CANCELAMENTO" -> "Movimentação cancelada — Sem Zona";
            default -> lote.isArquivado() ? "Modo consulta — lote excluído" : "Modo consulta — sem portal vinculado";
        };
        List<HistoricoItemDTO> historico = HistoryBuilder.build(movimentacaoRepository.listByLoteOrderByTimestampDesc(lote.getId(), 5));
        ReadResultDTO result = ReadResultDTO.builder()
            .modo(modo).mensagem(mensagem).lote(loteService.toDTO(lote, null)).zona(zonaNome).timestamp(timestamp).historico(historico)
            .build();

        Leitura leitura = new Leitura();
        leitura.setId(request.getRequestId());
        leitura.setLote(lote);
        leitura.setPortal(portal);
        leitura.setModo(modo);
        leitura.setTimestamp(timestamp);
        leitura.setResultado(serialize(result));
        leituraRepository.persist(leitura);

        return result;
    }

    private ReadResultDTO deserialize(String json) {
        try {
            return objectMapper.readValue(json, ReadResultDTO.class);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao desserializar leitura armazenada", e);
        }
    }

    private String serialize(ReadResultDTO result) {
        try {
            return objectMapper.writeValueAsString(result);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao serializar resultado da leitura", e);
        }
    }
}
