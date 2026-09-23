package com.logtrack.backend.service;

import com.logtrack.backend.common.LogtrackConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@ApplicationScoped
public class PlantaStorage {

    @Inject
    LogtrackConfig config;

    public String save(byte[] bytes, String extension) {
        try {
            Path dir = Path.of(config.uploadsDir());
            Files.createDirectories(dir);
            String filename = "mapa-" + System.currentTimeMillis() + "." + extension;
            Files.write(dir.resolve(filename), bytes);
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new IllegalStateException("Falha ao salvar a imagem", e);
        }
    }
}
