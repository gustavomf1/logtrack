package com.logtrack.backend.repository;

import com.logtrack.backend.entity.Leitura;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class LeituraRepository {

    @Inject
    EntityManager entityManager;

    public void persist(Leitura leitura) {
        entityManager.persist(leitura);
    }

    public Optional<Leitura> findById(UUID id) {
        return Optional.ofNullable(entityManager.find(Leitura.class, id));
    }

    public long count() {
        return entityManager.createQuery("select count(l) from Leitura l", Long.class).getSingleResult();
    }
}
