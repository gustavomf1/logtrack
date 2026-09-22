package com.logtrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PortalUpdateRequestDTO {
    private String nome;
    private Boolean ativo;
}
