package com.logtrack.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EstacaoInputDTO {

    @NotNull
    private UUID portalId;

    @Size(max = 100)
    private String apelido;

    private double x;
    private double y;
}
