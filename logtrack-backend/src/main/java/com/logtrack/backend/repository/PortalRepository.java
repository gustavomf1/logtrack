package com.logtrack.backend.repository;

import com.logtrack.backend.entity.Portal;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class PortalRepository implements PanacheRepositoryBase<Portal, UUID> {

    public boolean existsActiveByZona(UUID zonaId) {
        return count("zona.id = ?1 and ativo = true", zonaId) > 0;
    }

    public Optional<Portal> findByTokenHash(String tokenHash) {
        return find("tokenCookie", tokenHash).firstResultOptional();
    }
}
