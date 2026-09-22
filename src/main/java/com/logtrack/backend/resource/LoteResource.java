package com.logtrack.backend.resource;

import com.logtrack.backend.dto.*;
import com.logtrack.backend.service.LoteService;
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

import java.util.List;
import java.util.UUID;

@Path("/api/lotes")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("supervisor")
public class LoteResource {

    @Inject
    LoteService service;

    @GET
    public List<LoteResponseDTO> list(@QueryParam("zona") String zona, @QueryParam("status") String status, @QueryParam("busca") String busca) {
        return service.list(zona, status, busca);
    }

    @GET
    @Path("/{id}")
    public LoteDetailResponseDTO get(@PathParam("id") UUID id) {
        return service.get(id);
    }

    @GET
    @Path("/publico/{id}")
    @PermitAll
    public LotePublicoResponseDTO getPublico(@PathParam("id") UUID id) {
        return service.getPublico(id);
    }

    @POST
    public LoteResponseDTO create(@Valid LoteRequestDTO request) {
        return service.create(request);
    }

    @PATCH
    @Path("/{id}")
    public LoteResponseDTO update(@PathParam("id") UUID id, @Valid LoteRequestDTO request) {
        return service.update(id, request);
    }

    @DELETE
    @Path("/{id}")
    public LoteResponseDTO archive(@PathParam("id") UUID id) {
        return service.archive(id);
    }

    @POST
    @Path("/{id}/gravar-tag")
    public LoteResponseDTO gravarTag(@PathParam("id") UUID id) {
        return service.gravarTag(id);
    }
}
