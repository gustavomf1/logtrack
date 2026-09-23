package com.logtrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.util.List;
import java.util.UUID;

@Jacksonized
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MapaResponseDTO {
    private UUID id;
    private String nome;
    private String imagemUrl;
    private List<EstacaoDTO> estacoes;
    private List<TextoDTO> textos;
    private List<ZonaMapaDTO> zonas;
}
