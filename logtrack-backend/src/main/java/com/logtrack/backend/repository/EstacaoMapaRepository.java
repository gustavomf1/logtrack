package com.logtrack.backend.repository;

import com.logtrack.backend.entity.EstacaoMapa;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class EstacaoMapaRepository implements PanacheRepositoryBase<EstacaoMapa, UUID> {

    public Optional<EstacaoMapa> findByMapaAndPortal(UUID mapaId, UUID portalId) {
        return find("mapa.id = ?1 and portal.id = ?2", mapaId, portalId).firstResultOptional();
    }

    public List<EstacaoMapa> listByMapa(UUID mapaId) {
        return list("mapa.id", mapaId);
    }
}
