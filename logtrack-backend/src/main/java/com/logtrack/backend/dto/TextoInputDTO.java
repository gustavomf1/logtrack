package com.logtrack.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TextoInputDTO {
    private UUID id;

    @NotBlank
    @Size(max = 200)
    private String texto;

    private double x;
    private double y;
}
