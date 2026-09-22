package com.logtrack.backend.service;

import com.logtrack.backend.common.AppException;
import com.logtrack.backend.dto.*;
import com.logtrack.backend.entity.EstacaoMapa;
import com.logtrack.backend.entity.Mapa;
import com.logtrack.backend.entity.Portal;
import com.logtrack.backend.entity.TextoMapa;
import com.logtrack.backend.entity.Zona;
import com.logtrack.backend.entity.ZonaMapa;
import com.logtrack.backend.repository.EstacaoMapaRepository;
import com.logtrack.backend.repository.MapaRepository;
import com.logtrack.backend.repository.PortalRepository;
import com.logtrack.backend.repository.TextoMapaRepository;
import com.logtrack.backend.repository.ZonaMapaRepository;
import com.logtrack.backend.repository.ZonaRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.nio.file.Files;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class MapaService {

    @Inject
    MapaRepository mapaRepository;

    @Inject
    EstacaoMapaRepository estacaoMapaRepository;

    @Inject
    TextoMapaRepository textoMapaRepository;

    @Inject
    ZonaMapaRepository zonaMapaRepository;

    @Inject
    PortalRepository portalRepository;

    @Inject
    ZonaRepository zonaRepository;

    @Inject
    PlantaStorage plantaStorage;

    public MapaResponseDTO get() {
        return mapaRepository.findFirst().map(this::toDTO).orElse(null);
    }

    @Transactional
    public PlantaUploadResponseDTO uploadPlanta(FileUpload upload) {
        if (upload == null) throw new AppException(400, "Envie um arquivo de imagem.");
        String contentType = upload.contentType();
        if (!"image/png".equals(contentType) && !"image/jpeg".equals(contentType)) {
            throw new AppException(400, "Envie um arquivo PNG ou JPG.");
        }
        if (upload.size() > 10 * 1024 * 1024) {
            throw new AppException(400, "A imagem deve ter até 10 MB.");
        }
        byte[] bytes;
        try {
            bytes = Files.readAllBytes(upload.filePath());
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao ler o arquivo enviado", e);
        }
        String extension = "image/png".equals(contentType) ? "png" : "jpg";
        String imagemUrl = plantaStorage.save(bytes, extension);

        Mapa mapa = mapaRepository.findFirst().orElseGet(() -> {
            Mapa m = new Mapa();
            m.setNome("Mapa da empresa");
            return m;
        });
        mapa.setImagemUrl(imagemUrl);
        if (mapa.getId() == null) mapaRepository.persist(mapa);
        return PlantaUploadResponseDTO.builder().id(mapa.getId()).imagemUrl(mapa.getImagemUrl()).build();
    }

    @Transactional
    public MapaResponseDTO update(MapaUpdateRequestDTO request) {
        Mapa mapa = mapaRepository.findFirst().orElseThrow(() -> new AppException(409, "Envie a planta antes de posicionar elementos."));

        for (EstacaoInputDTO e : request.getEstacoes()) {
            Portal portal = portalRepository.findByIdOptional(e.getPortalId())
                .orElseThrow(() -> new AppException(404, "Portal não encontrado."));
            EstacaoMapa estacao = estacaoMapaRepository.findByMapaAndPortal(mapa.getId(), e.getPortalId()).orElseGet(EstacaoMapa::new);
            estacao.setMapa(mapa);
            estacao.setPortal(portal);
            estacao.setApelido(e.getApelido());
            estacao.setX(clamp(e.getX()));
            estacao.setY(clamp(e.getY()));
            if (estacao.getId() == null) estacaoMapaRepository.persist(estacao);
        }

        List<UUID> keepIds = request.getTextos().stream()
            .map(TextoInputDTO::getId)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
        textoMapaRepository.deleteOrphans(mapa.getId(), keepIds);
        for (TextoInputDTO t : request.getTextos()) {
            TextoMapa texto = t.getId() != null
                ? textoMapaRepository.findByIdOptional(t.getId()).orElseThrow(() -> new AppException(404, "Texto não encontrado."))
                : new TextoMapa();
            texto.setMapa(mapa);
            texto.setTexto(t.getTexto());
            texto.setX(clamp(t.getX()));
            texto.setY(clamp(t.getY()));
            if (texto.getId() == null) textoMapaRepository.persist(texto);
        }

        for (ZonaMapaInputDTO z : request.getZonas()) {
            Zona zona = zonaRepository.findByIdOptional(z.getZonaId())
                .orElseThrow(() -> new AppException(404, "Zona não encontrada."));
            ZonaMapa zonaMapa = zonaMapaRepository.findByMapaAndZona(mapa.getId(), z.getZonaId()).orElseGet(ZonaMapa::new);
            zonaMapa.setMapa(mapa);
            zonaMapa.setZona(zona);
            zonaMapa.setX(clamp(z.getX()));
            zonaMapa.setY(clamp(z.getY()));
            if (zonaMapa.getId() == null) zonaMapaRepository.persist(zonaMapa);
        }

        return toDTO(mapa);
    }

    private double clamp(double value) {
        if (Double.isNaN(value)) return 0;
        return Math.min(1, Math.max(0, value));
    }

    private MapaResponseDTO toDTO(Mapa mapa) {
        List<EstacaoDTO> estacoes = estacaoMapaRepository.listByMapa(mapa.getId()).stream()
            .map(e -> EstacaoDTO.builder()
                .id(e.getId()).portalId(e.getPortal().getId()).portalNome(e.getPortal().getNome())
                .zonaId(e.getPortal().getZona().getId()).zonaNome(e.getPortal().getZona().getNome())
                .apelido(e.getApelido()).x(e.getX()).y(e.getY()).build())
            .collect(Collectors.toList());
        List<TextoDTO> textos = textoMapaRepository.listByMapa(mapa.getId()).stream()
            .map(t -> TextoDTO.builder().id(t.getId()).texto(t.getTexto()).x(t.getX()).y(t.getY()).build())
            .collect(Collectors.toList());
        List<ZonaMapaDTO> zonas = zonaMapaRepository.listByMapa(mapa.getId()).stream()
            .map(z -> ZonaMapaDTO.builder().id(z.getId()).zonaId(z.getZona().getId()).zonaNome(z.getZona().getNome()).x(z.getX()).y(z.getY()).build())
            .collect(Collectors.toList());
        return MapaResponseDTO.builder().id(mapa.getId()).nome(mapa.getNome()).imagemUrl(mapa.getImagemUrl())
            .estacoes(estacoes).textos(textos).zonas(zonas).build();
    }
}
