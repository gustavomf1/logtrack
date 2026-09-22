package com.logtrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.util.UUID;

@Jacksonized
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ZonaMapaDTO {
    private UUID id;
    private UUID zonaId;
    private String zonaNome;
    private double x;
    private double y;
}
