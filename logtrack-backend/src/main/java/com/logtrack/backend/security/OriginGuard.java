package com.logtrack.backend.security;

import com.logtrack.backend.common.AppException;
import com.logtrack.backend.common.LogtrackConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class OriginGuard {

    @Inject
    LogtrackConfig config;

    public void require(String originHeader) {
        if (originHeader == null || !originHeader.equals(config.backendOrigin())) {
            throw new AppException(403, "Origem da requisição não autorizada.");
        }
    }
}
