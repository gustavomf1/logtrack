package com.logtrack.backend.service;

import com.logtrack.backend.common.LogtrackConfig;
import com.logtrack.backend.entity.Portal;
import com.logtrack.backend.repository.PortalRepository;
import com.logtrack.backend.security.StationCookie;
import com.logtrack.backend.security.StationSigner;
import com.logtrack.backend.security.StationTokens;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;

import java.net.URI;
import java.time.Instant;
import java.util.regex.Pattern;

@ApplicationScoped
public class AtivacaoService {

    private static final Pattern HEX64 = Pattern.compile("^[a-f0-9]{64}$");

    @Inject
    PortalRepository portalRepository;

    @Inject
    StationTokens stationTokens;

    @Inject
    StationSigner stationSigner;

    @Inject
    LogtrackConfig config;

    @Transactional
    public Response activate(String token) {
        if (!HEX64.matcher(token).matches()) {
            return redirect("erro=token", null);
        }
        Portal portal = portalRepository.findByTokenHash(stationTokens.hashToken(token))
            .filter(p -> p.isAtivo() && p.getZona().isAtiva())
            .orElse(null);
        if (portal == null) {
            return redirect("erro=token", null);
        }
        portal.setUltimoUso(Instant.now());
        String cookieValue = stationSigner.sign(portal.getId(), portal.getTokenCookie());
        boolean secure = config.backendOrigin().startsWith("https://");
        return redirect("ativado=1", StationCookie.build(cookieValue, secure));
    }

    private Response redirect(String query, NewCookie cookie) {
        Response.ResponseBuilder builder = Response.status(302)
            .location(URI.create(config.frontendUrl() + "/estacao?" + query))
            .header("Cache-Control", "no-store")
            .header("Referrer-Policy", "no-referrer");
        if (cookie != null) builder.cookie(cookie);
        return builder.build();
    }
}
