package com.logtrack.backend.repository;

import com.logtrack.backend.entity.Supervisor;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

import java.util.Optional;
import java.util.UUID;

@ApplicationScoped
public class SupervisorRepository implements PanacheRepositoryBase<Supervisor, UUID> {

    public Optional<Supervisor> findByEmail(String email) {
        return find("email", email.trim().toLowerCase()).firstResultOptional();
    }
}
