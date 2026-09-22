package com.logtrack.backend.common;

import com.logtrack.backend.dto.ErrorResponseDTO;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import org.jboss.logging.Logger;

@Provider
public class GenericExceptionMapper implements ExceptionMapper<Exception> {
    private static final Logger LOG = Logger.getLogger(GenericExceptionMapper.class);

    @Override
    public Response toResponse(Exception e) {
        if (e instanceof WebApplicationException wae) {
            return wae.getResponse();
        }
        LOG.error("Erro não tratado", e);
        return Response.status(500)
            .entity(new ErrorResponseDTO("Não foi possível concluir a operação. Tente novamente."))
            .build();
    }
}
