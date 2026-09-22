package com.logtrack.backend.resource;

import com.logtrack.backend.dto.PainelResponseDTO;
import com.logtrack.backend.service.PainelService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/painel")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("supervisor")
public class PainelResource {

    @Inject
    PainelService service;

    @GET
    public PainelResponseDTO get() {
        return service.get();
    }
}
