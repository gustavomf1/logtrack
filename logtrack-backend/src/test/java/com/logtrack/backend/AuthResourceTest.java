package com.logtrack.backend;

import com.logtrack.backend.entity.Supervisor;
import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
class AuthResourceTest {

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    @Test
    void loginWithValidCredentialsReturnsToken() {
        QuarkusTransaction.requiringNew().run(() -> {
            Supervisor supervisor = new Supervisor();
            supervisor.setEmail("supervisor@logtrack.local");
            supervisor.setSenhaHash(passwordHasher.hash("LogTrack123!"));
            supervisor.setNome("Supervisor Teste");
            supervisorRepository.persist(supervisor);
        });

        given()
            .contentType("application/json")
            .body("""
                {"email":"supervisor@logtrack.local","password":"LogTrack123!"}
                """)
            .when().post("/api/auth/login")
            .then()
            .statusCode(200)
            .body("token", notNullValue())
            .body("supervisor.email", equalTo("supervisor@logtrack.local"));
    }

    @Test
    void loginWithWrongPasswordReturns401() {
        QuarkusTransaction.requiringNew().run(() -> {
            Supervisor supervisor = new Supervisor();
            supervisor.setEmail("outro@logtrack.local");
            supervisor.setSenhaHash(passwordHasher.hash("SenhaCorreta1!"));
            supervisor.setNome("Outro");
            supervisorRepository.persist(supervisor);
        });

        given()
            .contentType("application/json")
            .body("""
                {"email":"outro@logtrack.local","password":"SenhaErrada1!"}
                """)
            .when().post("/api/auth/login")
            .then()
            .statusCode(401)
            .body("error", notNullValue());
    }

    @Test
    void loginWithBlankEmailReturns400() {
        given()
            .contentType("application/json")
            .body("""
                {"email":"","password":"x"}
                """)
            .when().post("/api/auth/login")
            .then()
            .statusCode(400);
    }
}
