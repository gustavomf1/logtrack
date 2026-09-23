package com.logtrack.backend.security;

import at.favre.lib.crypto.bcrypt.BCrypt;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PasswordHasher {

    // Hash fixo só para equalizar o tempo de resposta de e-mails inexistentes.
    private static final String DUMMY_HASH = "$2a$12$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    public String hash(String raw) {
        return BCrypt.withDefaults().hashToString(12, raw.toCharArray());
    }

    public boolean verify(String raw, String hash) {
        return BCrypt.verifyer().verify(raw.toCharArray(), hash != null ? hash : DUMMY_HASH).verified && hash != null;
    }
}
