package com.logtrack.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MapaUpdateRequestDTO {

    @NotNull
    private List<@Valid EstacaoInputDTO> estacoes;

    @NotNull
    private List<@Valid TextoInputDTO> textos;

    @NotNull
    private List<@Valid ZonaMapaInputDTO> zonas;
}
