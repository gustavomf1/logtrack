package com.logtrack.backend.resource;

import com.logtrack.backend.dto.EstacaoStatusDTO;
import com.logtrack.backend.security.StationCookie;
import com.logtrack.backend.service.EstacaoService;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.CookieParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/estacao")
@Produces(MediaType.APPLICATION_JSON)
@PermitAll
public class EstacaoResource {

    @Inject
    EstacaoService service;

    @GET
    public EstacaoStatusDTO status(@CookieParam(StationCookie.NAME) String stationCookie) {
        return service.status(stationCookie);
    }
}
