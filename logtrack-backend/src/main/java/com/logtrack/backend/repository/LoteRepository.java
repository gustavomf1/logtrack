package com.logtrack.backend.repository;

import com.logtrack.backend.entity.Lote;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.UUID;

@ApplicationScoped
public class LoteRepository implements PanacheRepositoryBase<Lote, UUID> {

    public boolean existsByCodigoIgnoreCase(String codigo, UUID excludeId) {
        if (excludeId == null) {
            return count("lower(codigo) = ?1", codigo.toLowerCase()) > 0;
        }
        return count("lower(codigo) = ?1 and id != ?2", codigo.toLowerCase(), excludeId) > 0;
    }

    public boolean existsAtivoByZonaAtual(UUID zonaId) {
        return count("zonaAtual.id = ?1 and arquivado = false", zonaId) > 0;
    }
}
