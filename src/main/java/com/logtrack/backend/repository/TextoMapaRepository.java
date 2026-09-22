package com.logtrack.backend.repository;

import com.logtrack.backend.entity.TextoMapa;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class TextoMapaRepository implements PanacheRepositoryBase<TextoMapa, UUID> {

    public List<TextoMapa> listByMapa(UUID mapaId) {
        return list("mapa.id", mapaId);
    }

    public void deleteOrphans(UUID mapaId, List<UUID> keepIds) {
        if (keepIds.isEmpty()) {
            delete("mapa.id = ?1", mapaId);
        } else {
            delete("mapa.id = ?1 and id not in ?2", mapaId, keepIds);
        }
    }
}
