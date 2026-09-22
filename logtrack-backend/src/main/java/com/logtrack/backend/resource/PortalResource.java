package com.logtrack.backend.resource;

import com.logtrack.backend.dto.*;
import com.logtrack.backend.service.PortalService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.UUID;

@Path("/api/portais")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("supervisor")
public class PortalResource {

    @Inject
    PortalService service;

    @GET
    public List<PortalResponseDTO> list() {
        return service.list();
    }

    @POST
    public PortalResponseDTO create(@Valid PortalRequestDTO request) {
        return service.create(request);
    }

    @PATCH
    @Path("/{id}")
    public PortalResponseDTO update(@PathParam("id") UUID id, @Valid PortalUpdateRequestDTO request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public PortalResponseDTO deactivate(@PathParam("id") UUID id) {
        return service.deactivate(id);
    }

    @POST
    @Path("/{id}/regenerar-token")
    public ActivationResponseDTO regenerateToken(@PathParam("id") UUID id) {
        return service.regenerateToken(id);
    }
}
