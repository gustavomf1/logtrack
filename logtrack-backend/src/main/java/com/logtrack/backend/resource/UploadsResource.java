package com.logtrack.backend.resource;

import com.logtrack.backend.common.LogtrackConfig;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

import java.io.IOException;
import java.nio.file.Files;

@Path("/uploads")
public class UploadsResource {

    @Inject
    LogtrackConfig config;

    @GET
    @Path("/{filename}")
    public Response get(@PathParam("filename") String filename) throws IOException {
        java.nio.file.Path base = java.nio.file.Path.of(config.uploadsDir()).normalize();
        java.nio.file.Path file = base.resolve(filename).normalize();
        if (!file.startsWith(base) || !Files.exists(file)) {
            return Response.status(404).build();
        }
        String contentType = filename.endsWith(".png") ? "image/png" : "image/jpeg";
        return Response.ok(Files.readAllBytes(file)).header("Content-Type", contentType).build();
    }
}
