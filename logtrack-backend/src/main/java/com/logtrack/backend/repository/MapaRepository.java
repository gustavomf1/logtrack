package com.logtrack.backend.repository;

import com.logtrack.backend.entity.Mapa;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class MapaRepository implements PanacheRepositoryBase<Mapa, UUID> {

    public Optional<Mapa> findFirst() {
        return find("order by criadoEm asc").firstResultOptional();
    }
}
