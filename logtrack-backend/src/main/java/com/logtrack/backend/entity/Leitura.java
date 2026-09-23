package com.logtrack.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

// id NÃO é gerado aqui — é o requestId enviado pelo firmware, chave de idempotência.
@Entity
@Table(name = "leituras")
@Data
@NoArgsConstructor
public class Leitura {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "lote_id")
    private Lote lote;

    @ManyToOne
    @JoinColumn(name = "portal_id")
    private Portal portal;

    @Column(nullable = false)
    private String modo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String resultado;

    @Column(name = "`timestamp`", nullable = false)
    private Instant timestamp;
}
