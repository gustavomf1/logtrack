package com.logtrack.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoteRequestDTO {

    @NotBlank
    @Size(max = 100)
    private String codigo;

    @Size(max = 2000)
    private String descricao;

    @Min(0)
    private Integer quantidade;

    private LocalDate dataValidade;
}
