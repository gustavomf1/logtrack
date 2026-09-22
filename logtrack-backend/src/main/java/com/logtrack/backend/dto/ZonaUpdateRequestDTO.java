package com.logtrack.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZonaUpdateRequestDTO {

    @Size(max = 100)
    private String nome;

    @Size(max = 2000)
    private String descricao;

    private Boolean ativa;
}
