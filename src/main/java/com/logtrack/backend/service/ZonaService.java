package com.logtrack.backend.service;

import com.logtrack.backend.common.AppException;
import com.logtrack.backend.dto.ZonaRequestDTO;
import com.logtrack.backend.dto.ZonaResponseDTO;
import com.logtrack.backend.dto.ZonaUpdateRequestDTO;
import com.logtrack.backend.entity.Zona;
import com.logtrack.backend.repository.ZonaRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class ZonaService {

    @Inject
    ZonaRepository repository;

    public List<ZonaResponseDTO> list() {
        return repository.listAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public ZonaResponseDTO create(ZonaRequestDTO request) {
        if (repository.existsByNomeIgnoreCase(request.getNome(), null)) {
            throw new AppException(409, "Já existe uma zona com esse nome.");
        }
        Zona zona = new Zona();
        zona.setNome(request.getNome());
        zona.setDescricao(request.getDescricao());
        repository.persist(zona);
        return toDTO(zona);
    }

    @Transactional
    public ZonaResponseDTO update(UUID id, ZonaUpdateRequestDTO request) {
        Zona zona = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Zona não encontrada."));
        if (request.getNome() != null) {
            if (request.getNome().isBlank()) {
                throw new AppException(400, "Preencha o nome.");
            }
            if (repository.existsByNomeIgnoreCase(request.getNome(), id)) {
                throw new AppException(409, "Já existe uma zona com esse nome.");
            }
            zona.setNome(request.getNome());
        }
        if (request.getDescricao() != null) zona.setDescricao(request.getDescricao());
        if (request.getAtiva() != null) zona.setAtiva(request.getAtiva());
        return toDTO(zona);
    }

    @Transactional
    public ZonaResponseDTO deactivate(UUID id) {
        Zona zona = repository.findByIdOptional(id).orElseThrow(() -> new AppException(404, "Zona não encontrada."));
        zona.setAtiva(false);
        return toDTO(zona);
    }

    public ZonaResponseDTO toDTO(Zona z) {
        return ZonaResponseDTO.builder()
            .id(z.getId()).nome(z.getNome()).descricao(z.getDescricao()).ativa(z.isAtiva()).criadoEm(z.getCriadoEm())
            .build();
    }
}
