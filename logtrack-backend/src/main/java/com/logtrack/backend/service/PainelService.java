package com.logtrack.backend.service;

import com.logtrack.backend.dto.MovimentacaoResponseDTO;
import com.logtrack.backend.dto.PainelResponseDTO;
import com.logtrack.backend.entity.Movimentacao;
import com.logtrack.backend.repository.LeituraRepository;
import com.logtrack.backend.repository.LoteRepository;
import com.logtrack.backend.repository.MovimentacaoRepository;
import com.logtrack.backend.repository.PortalRepository;
import com.logtrack.backend.repository.ZonaRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class PainelService {

    @Inject
    ZonaRepository zonaRepository;

    @Inject
    LoteRepository loteRepository;

    @Inject
    PortalRepository portalRepository;

    @Inject
    MovimentacaoRepository movimentacaoRepository;

    @Inject
    LeituraRepository leituraRepository;

    @Inject
    ZonaService zonaService;

    @Inject
    LoteService loteService;

    @Inject
    PortalService portalService;

    public PainelResponseDTO get() {
        List<Movimentacao> movs = movimentacaoRepository.listAllOrderByTimestampDesc();
        return PainelResponseDTO.builder()
            .zonas(zonaRepository.listAll().stream().map(zonaService::toDTO).collect(Collectors.toList()))
            .lotes(loteRepository.listAll().stream().map(l -> loteService.toDTO(l, null)).collect(Collectors.toList()))
            .portais(portalRepository.listAll().stream().map(p -> portalService.toDTO(p, null)).collect(Collectors.toList()))
            .movimentacoes(movs.stream().map(this::toMovimentacaoDTO).collect(Collectors.toList()))
            .totalLeituras(leituraRepository.count())
            .build();
    }

    private MovimentacaoResponseDTO toMovimentacaoDTO(Movimentacao m) {
        return MovimentacaoResponseDTO.builder()
            .id(m.getId()).loteId(m.getLote().getId())
            .zonaOrigemId(m.getZonaOrigem() != null ? m.getZonaOrigem().getId() : null)
            .zonaDestinoId(m.getZonaDestino() != null ? m.getZonaDestino().getId() : null)
            .portalId(m.getPortal().getId()).tipo(m.getTipo().name()).timestamp(m.getTimestamp())
            .build();
    }
}
