package com.logtrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.util.List;

@Jacksonized
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PainelResponseDTO {
    private List<ZonaResponseDTO> zonas;
    private List<LoteResponseDTO> lotes;
    private List<MovimentacaoResponseDTO> movimentacoes;
    private List<PortalResponseDTO> portais;
    private long totalLeituras;
}
