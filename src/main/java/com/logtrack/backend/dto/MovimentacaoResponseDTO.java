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
public class MovimentacaoResponseDTO {
    private UUID id;
    private UUID loteId;
    private UUID zonaOrigemId;
    private UUID zonaDestinoId;
    private UUID portalId;
    private String tipo;
    private Instant timestamp;
}
