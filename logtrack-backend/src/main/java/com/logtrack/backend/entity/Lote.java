package com.logtrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "lotes")
@Data
@NoArgsConstructor
public class Lote {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String codigo;

    private String descricao;

    private Integer quantidade;

    @Column(name = "data_validade")
    private LocalDate dataValidade;

    @ManyToOne
    @JoinColumn(name = "zona_atual_id")
    private Zona zonaAtual;

    @ManyToOne
    @JoinColumn(name = "ultimo_portal_id")
    private Portal ultimoPortal;

    @Column(name = "tag_gravada", nullable = false)
    private boolean tagGravada = false;

    @Column(nullable = false)
    private boolean arquivado = false;

    @Column(name = "criado_em", updatable = false, nullable = false)
    private Instant criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) criadoEm = Instant.now();
    }
}
