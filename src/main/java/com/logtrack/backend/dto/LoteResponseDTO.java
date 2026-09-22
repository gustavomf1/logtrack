package com.logtrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Jacksonized
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LoteResponseDTO {
    private UUID id;
    private String codigo;
    private String descricao;
    private Integer quantidade;
    private LocalDate dataValidade;
    private UUID zonaAtualId;
    private UUID ultimoPortalId;
    private boolean tagGravada;
    private boolean arquivado;
    private Instant criadoEm;
    private String url;
}
