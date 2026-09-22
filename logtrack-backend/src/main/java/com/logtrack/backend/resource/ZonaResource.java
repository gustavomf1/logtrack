package com.logtrack.backend.resource;

import com.logtrack.backend.dto.ZonaRequestDTO;
import com.logtrack.backend.dto.ZonaResponseDTO;
import com.logtrack.backend.dto.ZonaUpdateRequestDTO;
import com.logtrack.backend.service.ZonaService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.UUID;

@Path("/api/zonas")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("supervisor")
public class ZonaResource {

    @Inject
    ZonaService service;

    @GET
    public List<ZonaResponseDTO> list() {
        return service.list();
    }

    @POST
    public ZonaResponseDTO create(@Valid ZonaRequestDTO request) {
        return service.create(request);
    }

    @PATCH
    @Path("/{id}")
    public ZonaResponseDTO update(@PathParam("id") UUID id, @Valid ZonaUpdateRequestDTO request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public ZonaResponseDTO deactivate(@PathParam("id") UUID id) {
        return service.deactivate(id);
    }
}
