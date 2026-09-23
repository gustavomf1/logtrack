package com.logtrack.backend.resource;

import com.logtrack.backend.dto.LeituraRequestDTO;
import com.logtrack.backend.dto.ReadResultDTO;
import com.logtrack.backend.security.OriginGuard;
import com.logtrack.backend.security.StationCookie;
import com.logtrack.backend.service.LeituraService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/leituras")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class LeituraResource {

    @Inject
    LeituraService service;

    @Inject
    OriginGuard originGuard;

    @POST
    public Response registrar(@Valid LeituraRequestDTO request,
                               @HeaderParam("Origin") String origin,
                               @CookieParam(StationCookie.NAME) String stationCookie) {
        originGuard.require(origin);
        ReadResultDTO result = service.registrar(request, stationCookie);
        return Response.ok(result).header("Cache-Control", "no-store").build();
    }
}
