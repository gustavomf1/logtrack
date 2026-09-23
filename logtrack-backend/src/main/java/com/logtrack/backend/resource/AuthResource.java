package com.logtrack.backend.resource;

import com.logtrack.backend.dto.LoginRequestDTO;
import com.logtrack.backend.dto.LoginResponseDTO;
import com.logtrack.backend.service.AuthService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/auth")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AuthResource {

    @Inject
    AuthService authService;

    @POST
    @Path("/login")
    public LoginResponseDTO login(@Valid LoginRequestDTO request) {
        return authService.login(request);
    }
}
