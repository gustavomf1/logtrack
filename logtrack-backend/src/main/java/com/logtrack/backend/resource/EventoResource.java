package com.logtrack.backend.resource;

import com.logtrack.backend.dto.MovementEventDTO;
import com.logtrack.backend.service.EventoBroadcaster;
import io.smallrye.mutiny.Multi;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.jboss.resteasy.reactive.RestStreamElementType;

@Path("/api/eventos")
public class EventoResource {

    @Inject
    EventoBroadcaster broadcaster;

    // Publico (sem @RolesAllowed): o payload so tem UUIDs internos, nada sensivel, e o
    // EventSource nativo do browser nao manda header Authorization - autenticar aqui
    // exigiria token via query string, o que nao ganha nada em troca aqui.
    @GET
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @RestStreamElementType(MediaType.APPLICATION_JSON)
    public Multi<MovementEventDTO> stream() {
        return broadcaster.stream();
    }
}
