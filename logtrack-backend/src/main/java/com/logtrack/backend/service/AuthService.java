package com.logtrack.backend.service;

import com.logtrack.backend.common.AppException;
import com.logtrack.backend.dto.LoginRequestDTO;
import com.logtrack.backend.dto.LoginResponseDTO;
import com.logtrack.backend.dto.SupervisorSummaryDTO;
import com.logtrack.backend.entity.Supervisor;
import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;

@ApplicationScoped
public class AuthService {

    private static final Duration SESSION_TTL = Duration.ofHours(8);

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        Supervisor supervisor = supervisorRepository.findByEmail(request.getEmail()).orElse(null);
        boolean valid = passwordHasher.verify(request.getPassword(), supervisor != null ? supervisor.getSenhaHash() : null);
        if (supervisor == null || !valid) {
            throw new AppException(401, "E-mail ou senha inválidos.");
        }
        Instant expiresAt = Instant.now().plus(SESSION_TTL);
        String token = Jwt.issuer("https://logtrack.local")
            .subject(supervisor.getId().toString())
            .groups(Set.of("supervisor"))
            .claim("nome", supervisor.getNome())
            .claim("email", supervisor.getEmail())
            .expiresAt(expiresAt)
            .sign();
        return LoginResponseDTO.builder()
            .token(token)
            .expiresAt(expiresAt)
            .supervisor(SupervisorSummaryDTO.builder()
                .id(supervisor.getId())
                .nome(supervisor.getNome())
                .email(supervisor.getEmail())
                .build())
            .build();
    }
}
