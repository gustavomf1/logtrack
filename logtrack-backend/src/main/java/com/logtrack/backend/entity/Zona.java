package com.logtrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "zonas")
@Data
@NoArgsConstructor
public class Zona {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nome;

    private String descricao;

    @Column(nullable = false)
    private boolean ativa = true;

    @Column(name = "criado_em", updatable = false, nullable = false)
    private Instant criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) criadoEm = Instant.now();
    }
}
