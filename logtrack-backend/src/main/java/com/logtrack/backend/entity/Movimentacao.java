package com.logtrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "movimentacoes")
@Data
@NoArgsConstructor
public class Movimentacao {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "lote_id")
    private Lote lote;

    @ManyToOne
    @JoinColumn(name = "zona_origem_id")
    private Zona zonaOrigem;

    @ManyToOne
    @JoinColumn(name = "zona_destino_id")
    private Zona zonaDestino;

    @ManyToOne(optional = false)
    @JoinColumn(name = "portal_id")
    private Portal portal;

    // NAMED_ENUM: "tipo" no banco é o tipo nativo tipo_movimentacao (Postgres
    // ENUM), não VARCHAR — sem isso o driver envia o parâmetro como
    // character varying e o Postgres rejeita o cast implícito.
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    private Tipo tipo;

    @Column(name = "`timestamp`", nullable = false)
    private Instant timestamp;

    @PrePersist
    void prePersist() {
        if (timestamp == null) timestamp = Instant.now();
    }

    public enum Tipo { MOVIMENTO, CANCELAMENTO }
}
