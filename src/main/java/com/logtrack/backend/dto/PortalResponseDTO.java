package com.logtrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.time.Instant;
import java.util.UUID;

@Jacksonized
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PortalResponseDTO {
    private UUID id;
    private String nome;
    private UUID zonaId;
    private boolean ativo;
    private Instant ultimoUso;
    private Instant criadoEm;
    private String activationUrl;
}
