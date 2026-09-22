package com.logtrack.backend.repository;

import com.logtrack.backend.entity.Zona;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class ZonaRepository implements PanacheRepositoryBase<Zona, UUID> {

    public boolean existsByNomeIgnoreCase(String nome, UUID excludeId) {
        if (excludeId == null) {
            return count("lower(nome) = ?1", nome.toLowerCase()) > 0;
        }
        return count("lower(nome) = ?1 and id != ?2", nome.toLowerCase(), excludeId) > 0;
    }
}
