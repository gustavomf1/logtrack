package com.logtrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "estacoes_mapa")
@Data
@NoArgsConstructor
public class EstacaoMapa {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "mapa_id")
    private Mapa mapa;

    @ManyToOne(optional = false)
    @JoinColumn(name = "portal_id")
    private Portal portal;

    private String apelido;

    @Column(nullable = false)
    private double x;

    @Column(nullable = false)
    private double y;

    @Column(nullable = false)
    private double rotacao = 0;

    @Column(name = "criado_em", updatable = false, nullable = false)
    private Instant criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) criadoEm = Instant.now();
    }
}
