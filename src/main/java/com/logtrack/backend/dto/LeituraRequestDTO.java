package com.logtrack.backend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeituraRequestDTO {

    @NotNull
    private UUID loteId;

    @NotNull
    private UUID requestId;
}
