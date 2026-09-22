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
public class HistoricoItemDTO {
    private UUID id;
    private String origem;
    private String destino;
    private String portal;
    private Instant timestamp;
    private String tipo;
}
