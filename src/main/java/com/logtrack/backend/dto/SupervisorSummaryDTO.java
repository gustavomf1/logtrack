package com.logtrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.jackson.Jacksonized;

import java.util.UUID;

@Jacksonized
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SupervisorSummaryDTO {
    private UUID id;
    private String nome;
    private String email;
}
