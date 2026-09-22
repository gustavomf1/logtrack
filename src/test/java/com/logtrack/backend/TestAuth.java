package com.logtrack.backend;

import com.logtrack.backend.entity.Supervisor;
import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.narayana.jta.QuarkusTransaction;

import static io.restassured.RestAssured.given;

public class TestAuth {

    public static final String EMAIL = "test-auth@logtrack.local";
    public static final String PASSWORD = "TestAuth123!";

    /** Ensures a supervisor exists (idempotent) and returns a bearer token for it. */
    public static String token(SupervisorRepository repository, PasswordHasher hasher) {
        QuarkusTransaction.requiringNew().run(() -> {
            if (repository.findByEmail(EMAIL).isEmpty()) {
                Supervisor supervisor = new Supervisor();
                supervisor.setEmail(EMAIL);
                supervisor.setSenhaHash(hasher.hash(PASSWORD));
                supervisor.setNome("Test Auth");
                repository.persist(supervisor);
            }
        });
        return given()
            .contentType("application/json")
            .body("{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD + "\"}")
            .when().post("/api/auth/login")
            .jsonPath().getString("token");
    }
}
