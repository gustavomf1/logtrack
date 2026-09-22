package com.logtrack.backend.service;

import com.logtrack.backend.dto.EstacaoStatusDTO;
import com.logtrack.backend.entity.Portal;
import com.logtrack.backend.repository.PortalRepository;
import com.logtrack.backend.security.StationSigner;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class EstacaoService {

    @Inject
    PortalRepository portalRepository;

    @Inject
    StationSigner stationSigner;

    @Transactional
    public EstacaoStatusDTO status(String cookieValue) {
        Portal portal = stationSigner.verify(cookieValue)
            .flatMap(identity -> portalRepository.findByIdOptional(identity.portalId())
                .filter(p -> p.getTokenCookie().equals(identity.tokenHash())))
            .filter(Portal::isAtivo)
            .filter(p -> p.getZona().isAtiva())
            .orElse(null);

        if (portal == null) {
            return EstacaoStatusDTO.builder().vinculada(false).build();
        }
        return EstacaoStatusDTO.builder()
            .vinculada(true)
            .nome(portal.getNome())
            .zona(portal.getZona().getNome())
            .build();
    }
}
