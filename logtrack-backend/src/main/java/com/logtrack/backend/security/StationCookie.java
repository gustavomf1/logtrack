package com.logtrack.backend.security;

import jakarta.ws.rs.core.NewCookie;

public final class StationCookie {

    public static final String NAME = "logtrack_station";
    private static final int MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

    private StationCookie() {
    }

    public static NewCookie build(String value, boolean secure) {
        return new NewCookie.Builder(NAME)
            .value(value)
            .path("/")
            .httpOnly(true)
            .sameSite(NewCookie.SameSite.LAX)
            .secure(secure)
            .maxAge(MAX_AGE_SECONDS)
            .build();
    }
}
