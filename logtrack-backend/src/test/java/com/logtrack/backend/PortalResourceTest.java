package com.logtrack.backend;

import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class PortalResourceTest {

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    String token() {
        return TestAuth.token(supervisorRepository, passwordHasher);
    }

    String createZona(String auth) {
        String name = "Zona Portal Test " + System.nanoTime();
        return given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .body("{\"nome\":\"" + name + "\"}")
            .when().post("/api/zonas")
            .then().statusCode(200).extract().path("id");
    }

    @Test
    void createReturnsActivationUrlAndRegenerateReturnsNewOne() {
        String auth = token();
        String zonaId = createZona(auth);

        String portalId = given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .body("{\"nome\":\"Portal A\",\"zonaId\":\"" + zonaId + "\"}")
            .when().post("/api/portais")
            .then().statusCode(200).body("activationUrl", containsString("/ativar/"))
            .extract().path("id");

        given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .when().post("/api/portais/" + portalId + "/regenerar-token")
            .then().statusCode(200).body("activationUrl", containsString("/ativar/"));
    }

    @Test
    void createWithInactiveZonaReturns400() {
        String auth = token();
        String zonaId = createZona(auth);
        given().header("Authorization", "Bearer " + auth)
            .when().delete("/api/zonas/" + zonaId).then().statusCode(200);

        given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .body("{\"nome\":\"Portal B\",\"zonaId\":\"" + zonaId + "\"}")
            .when().post("/api/portais")
            .then().statusCode(400);
    }

    @Test
    void deactivateSetsAtivoFalse() {
        String auth = token();
        String zonaId = createZona(auth);
        String portalId = given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .body("{\"nome\":\"Portal C\",\"zonaId\":\"" + zonaId + "\"}")
            .when().post("/api/portais")
            .then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + auth)
            .when().delete("/api/portais/" + portalId)
            .then().statusCode(200).body("ativo", equalTo(false));
    }
}
