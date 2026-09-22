package com.logtrack.backend.repository;

import com.logtrack.backend.entity.ZonaMapa;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class ZonaMapaRepository implements PanacheRepositoryBase<ZonaMapa, UUID> {

    public Optional<ZonaMapa> findByMapaAndZona(UUID mapaId, UUID zonaId) {
        return find("mapa.id = ?1 and zona.id = ?2", mapaId, zonaId).firstResultOptional();
    }

    public List<ZonaMapa> listByMapa(UUID mapaId) {
        return list("mapa.id", mapaId);
    }
}
