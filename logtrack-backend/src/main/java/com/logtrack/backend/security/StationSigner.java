package com.logtrack.backend.security;

import com.logtrack.backend.common.LogtrackConfig;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

@ApplicationScoped
public class StationSigner {

    private static final Pattern HEX64 = Pattern.compile("^[a-f0-9]{64}$");

    @Inject
    LogtrackConfig config;

    public String sign(UUID portalId, String tokenHash) {
        String payload = portalId + "." + tokenHash;
        return payload + "." + hmac(payload);
    }

    public Optional<StationIdentity> verify(String cookieValue) {
        if (cookieValue == null) return Optional.empty();
        String[] parts = cookieValue.split("\\.");
        if (parts.length != 3 || !HEX64.matcher(parts[1]).matches() || !HEX64.matcher(parts[2]).matches()) {
            return Optional.empty();
        }
        String expected = hmac(parts[0] + "." + parts[1]);
        if (!MessageDigest.isEqual(HexFormat.of().parseHex(expected), HexFormat.of().parseHex(parts[2]))) {
            return Optional.empty();
        }
        try {
            return Optional.of(new StationIdentity(UUID.fromString(parts[0]), parts[1]));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    private String hmac(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(config.stationSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    // Resultado interno de verificação — nunca serializado, por isso fica como
    // record aninhado em vez de virar um DTO em dto/.
    public record StationIdentity(UUID portalId, String tokenHash) {
    }
}
