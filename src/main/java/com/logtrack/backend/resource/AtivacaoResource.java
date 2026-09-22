package com.logtrack.backend.resource;

import com.logtrack.backend.service.AtivacaoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;

@Path("/ativar")
public class AtivacaoResource {

    @Inject
    AtivacaoService service;

    @GET
    @Path("/{token}")
    public Response activate(@PathParam("token") String token) {
        return service.activate(token);
    }
}
