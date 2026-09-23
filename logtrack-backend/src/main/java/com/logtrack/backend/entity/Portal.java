package com.logtrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "portais")
@Data
@NoArgsConstructor
public class Portal {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @ManyToOne(optional = false)
    @JoinColumn(name = "zona_id")
    private Zona zona;

    @Column(name = "token_cookie", nullable = false, unique = true)
    private String tokenCookie;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "ultimo_uso")
    private Instant ultimoUso;

    @Column(name = "criado_em", updatable = false, nullable = false)
    private Instant criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) criadoEm = Instant.now();
    }
}
