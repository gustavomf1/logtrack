package com.logtrack.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZonaMapaInputDTO {

    @NotNull
    private UUID zonaId;

    private double x;
    private double y;
}
