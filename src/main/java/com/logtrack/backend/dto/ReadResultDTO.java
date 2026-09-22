package com.logtrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.time.Instant;
import java.util.List;

@Jacksonized
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReadResultDTO {
    private String modo;
    private String mensagem;
    private LoteResponseDTO lote;
    private String zona;
    private Instant timestamp;
    private List<HistoricoItemDTO> historico;
}
