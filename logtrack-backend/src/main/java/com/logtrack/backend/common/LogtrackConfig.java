package com.logtrack.backend.common;

import io.smallrye.config.ConfigMapping;
import jakarta.validation.constraints.Size;

@ConfigMapping(prefix = "logtrack")
public interface LogtrackConfig {

    String backendOrigin();

    String frontendUrl();

    String uploadsDir();

    @Size(min = 32, message = "logtrack.station-secret precisa ter pelo menos 32 caracteres")
    String stationSecret();
}
