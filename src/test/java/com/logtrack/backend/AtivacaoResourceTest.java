package com.logtrack.backend;

import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class AtivacaoResourceTest {

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    String token() {
        return TestAuth.token(supervisorRepository, passwordHasher);
    }

    String createPortalAndGetActivationToken(String auth) {
        String zonaId = given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .body("{\"nome\":\"Zona Ativacao " + System.nanoTime() + "\"}")
            .when().post("/api/zonas")
            .then().statusCode(200).extract().path("id");

        String activationUrl = given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .body("{\"nome\":\"Portal Ativacao\",\"zonaId\":\"" + zonaId + "\"}")
            .when().post("/api/portais")
            .then().statusCode(200).extract().path("activationUrl");

        return activationUrl.substring(activationUrl.lastIndexOf('/') + 1);
    }

    @Test
    void validTokenRedirectsAndSetsCookie() {
        String activationToken = createPortalAndGetActivationToken(token());

        given().redirects().follow(false)
            .when().get("/ativar/" + activationToken)
            .then()
            .statusCode(302)
            .header("Location", containsString("/estacao?ativado=1"))
            .cookie("logtrack_station", notNullValue());
    }

    @Test
    void invalidTokenFormatRedirectsWithError() {
        given().redirects().follow(false)
            .when().get("/ativar/not-a-valid-token")
            .then()
            .statusCode(302)
            .header("Location", containsString("erro=token"));
    }

    @Test
    void unknownTokenRedirectsWithError() {
        String fakeToken = "a".repeat(64);
        given().redirects().follow(false)
            .when().get("/ativar/" + fakeToken)
            .then()
            .statusCode(302)
            .header("Location", containsString("erro=token"));
    }
}
