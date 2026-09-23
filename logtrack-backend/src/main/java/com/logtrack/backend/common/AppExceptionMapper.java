package com.logtrack.backend.common;

import com.logtrack.backend.dto.ErrorResponseDTO;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class AppExceptionMapper implements ExceptionMapper<AppException> {
    @Override
    public Response toResponse(AppException e) {
        return Response.status(e.status).entity(new ErrorResponseDTO(e.getMessage())).build();
    }
}
