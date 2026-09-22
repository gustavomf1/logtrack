package com.logtrack.backend.resource;

import com.logtrack.backend.dto.MapaResponseDTO;
import com.logtrack.backend.dto.MapaUpdateRequestDTO;
import com.logtrack.backend.dto.PlantaUploadForm;
import com.logtrack.backend.dto.PlantaUploadResponseDTO;
import com.logtrack.backend.service.MapaService;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/mapa")
@Produces(MediaType.APPLICATION_JSON)
@RolesAllowed("supervisor")
public class MapaResource {

    @Inject
    MapaService service;

    @GET
    public Response get() {
        // Returning a bare null here would make RESTEasy Reactive answer 204 No
        // Content. The frontend contract expects 200 with a literal JSON "null"
        // body when no mapa exists yet, so build the Response explicitly.
        MapaResponseDTO mapa = service.get();
        if (mapa == null) {
            return Response.ok("null", MediaType.APPLICATION_JSON).build();
        }
        return Response.ok(mapa).build();
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    public MapaResponseDTO update(@Valid MapaUpdateRequestDTO request) {
        return service.update(request);
    }

    @POST
    @Path("/planta")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public PlantaUploadResponseDTO uploadPlanta(@BeanParam PlantaUploadForm form) {
        return service.uploadPlanta(form.planta);
    }
}
