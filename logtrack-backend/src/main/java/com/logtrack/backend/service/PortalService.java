package com.logtrack.backend.service;

import com.logtrack.backend.common.AppException;
import com.logtrack.backend.common.LogtrackConfig;
import com.logtrack.backend.dto.ActivationResponseDTO;
import com.logtrack.backend.dto.PortalRequestDTO;
import com.logtrack.backend.dto.PortalResponseDTO;
import com.logtrack.backend.dto.PortalUpdateRequestDTO;
import com.logtrack.backend.entity.Portal;
import com.logtrack.backend.entity.Zona;
import com.logtrack.backend.repository.PortalRepository;
import com.logtrack.backend.repository.ZonaRepository;
import com.logtrack.backend.security.StationTokens;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class PortalService {

    @Inject
    PortalRepository repository;

    @Inject
    ZonaRepository zonaRepository;

    @Inject
    StationTokens stationTokens;

    @Inject
    LogtrackConfig config;

    public List<PortalResponseDTO> list() {
        return repository.listAll().stream().map(p -> toDTO(p, null)).collect(Collectors.toList());
    }

    @Transactional
    public PortalResponseDTO create(PortalRequestDTO request) {
        Zona zona = zonaRepository.findByIdOptional(request.getZonaId())
            .filter(Zona::isAtiva)
            .orElseThrow(() -> new AppException(400, "Selecione uma zona ativa."));
        String token = stationTokens.newToken();
        Portal portal = new Portal();
        portal.setNome(request.getNome());
        portal.setZona(zona);
        portal.setTokenCookie(stationTokens.hashToken(token));
        repository.persist(portal);
        return toDTO(portal, config.backendOrigin() + "/ativar/" + token);
    }

    @Transactional
    public ActivationResponseDTO regenerateToken(UUID id) {
        Portal portal = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Portal não encontrado."));
        String token = stationTokens.newToken();
        portal.setTokenCookie(stationTokens.hashToken(token));
        return new ActivationResponseDTO(config.backendOrigin() + "/ativar/" + token);
    }

    @Transactional
    public PortalResponseDTO update(UUID id, PortalUpdateRequestDTO request) {
        Portal portal = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Portal não encontrado."));
        // nome é opcional no PATCH (null = não alterar); @NotBlank rejeitaria o
        // null também, então a checagem de "não-branco quando presente" é em
        // runtime (mesmo padrão do bug encontrado em ZonaService.update, Task 4).
        if (request.getNome() != null) {
            if (request.getNome().isBlank()) {
                throw new AppException(400, "Preencha o nome.");
            }
            portal.setNome(request.getNome());
        }
        if (request.getAtivo() != null) {
            if (request.getAtivo() && !portal.getZona().isAtiva()) {
                throw new AppException(409, "Reative a zona antes de ativar esta estação.");
            }
            portal.setAtivo(request.getAtivo());
        }
        return toDTO(portal, null);
    }

    @Transactional
    public PortalResponseDTO deactivate(UUID id) {
        Portal portal = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Portal não encontrado."));
        portal.setAtivo(false);
        return toDTO(portal, null);
    }

    public PortalResponseDTO toDTO(Portal p, String activationUrl) {
        return PortalResponseDTO.builder()
            .id(p.getId()).nome(p.getNome()).zonaId(p.getZona().getId()).ativo(p.isAtivo())
            .ultimoUso(p.getUltimoUso()).criadoEm(p.getCriadoEm()).activationUrl(activationUrl)
            .build();
    }
}
