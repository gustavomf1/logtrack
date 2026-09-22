package com.logtrack.backend.service;

import com.logtrack.backend.common.AppException;
import com.logtrack.backend.common.LogtrackConfig;
import com.logtrack.backend.dto.*;
import com.logtrack.backend.entity.Lote;
import com.logtrack.backend.repository.LoteRepository;
import com.logtrack.backend.util.LoteFilter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class LoteService {

    @Inject
    LoteRepository repository;

    @Inject
    LogtrackConfig config;

    @Inject
    com.logtrack.backend.repository.MovimentacaoRepository movimentacaoRepository;

    public List<LoteResponseDTO> list(String zona, String status, String busca) {
        return LoteFilter.apply(repository.listAll(), zona, status, busca).stream()
            .map(l -> toDTO(l, null))
            .collect(Collectors.toList());
    }

    public LoteDetailResponseDTO get(UUID id) {
        Lote lote = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Lote não encontrado."));
        var historico = com.logtrack.backend.util.HistoryBuilder.build(
            movimentacaoRepository.listByLoteOrderByTimestampDesc(id, 5));
        return toDetailDTO(lote, historico);
    }

    public LotePublicoResponseDTO getPublico(UUID id) {
        Lote lote = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Lote não encontrado."));
        return LotePublicoResponseDTO.builder().id(lote.getId()).codigo(lote.getCodigo()).descricao(lote.getDescricao()).build();
    }

    @Transactional
    public LoteResponseDTO create(LoteRequestDTO request) {
        if (repository.existsByCodigoIgnoreCase(request.getCodigo(), null)) {
            throw new AppException(409, "Esse código já pertence a um lote.");
        }
        Lote lote = new Lote();
        apply(lote, request);
        repository.persist(lote);
        return toDTO(lote, config.frontendUrl() + "/l/" + lote.getId());
    }

    @Transactional
    public LoteResponseDTO update(UUID id, LoteRequestDTO request) {
        Lote lote = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Lote não encontrado."));
        if (lote.isArquivado()) throw new AppException(409, "Este lote foi excluído e está disponível apenas para consulta.");
        if (repository.existsByCodigoIgnoreCase(request.getCodigo(), id)) {
            throw new AppException(409, "Esse código já pertence a um lote.");
        }
        apply(lote, request);
        return toDTO(lote, null);
    }

    @Transactional
    public LoteResponseDTO archive(UUID id) {
        Lote lote = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Lote não encontrado."));
        lote.setArquivado(true);
        return toDTO(lote, null);
    }

    @Transactional
    public LoteResponseDTO gravarTag(UUID id) {
        Lote lote = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Lote não encontrado."));
        lote.setTagGravada(true);
        return toDTO(lote, null);
    }

    private void apply(Lote lote, LoteRequestDTO request) {
        lote.setCodigo(request.getCodigo());
        lote.setDescricao(request.getDescricao());
        lote.setQuantidade(request.getQuantidade());
        lote.setDataValidade(request.getDataValidade());
    }

    public LoteResponseDTO toDTO(Lote l, String url) {
        return LoteResponseDTO.builder()
            .id(l.getId()).codigo(l.getCodigo()).descricao(l.getDescricao()).quantidade(l.getQuantidade())
            .dataValidade(l.getDataValidade())
            .zonaAtualId(l.getZonaAtual() != null ? l.getZonaAtual().getId() : null)
            .ultimoPortalId(l.getUltimoPortal() != null ? l.getUltimoPortal().getId() : null)
            .tagGravada(l.isTagGravada()).arquivado(l.isArquivado()).criadoEm(l.getCriadoEm()).url(url)
            .build();
    }

    public LoteDetailResponseDTO toDetailDTO(Lote l, List<HistoricoItemDTO> historico) {
        return LoteDetailResponseDTO.builder()
            .id(l.getId()).codigo(l.getCodigo()).descricao(l.getDescricao()).quantidade(l.getQuantidade())
            .dataValidade(l.getDataValidade())
            .zonaAtualId(l.getZonaAtual() != null ? l.getZonaAtual().getId() : null)
            .ultimoPortalId(l.getUltimoPortal() != null ? l.getUltimoPortal().getId() : null)
            .tagGravada(l.isTagGravada()).arquivado(l.isArquivado()).criadoEm(l.getCriadoEm()).historico(historico)
            .build();
    }
}
