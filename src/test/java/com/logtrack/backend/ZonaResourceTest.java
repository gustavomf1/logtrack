package com.logtrack.backend;

import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class ZonaResourceTest {

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    String token() {
        return TestAuth.token(supervisorRepository, passwordHasher);
    }

    @Test
    void createListAndRejectDuplicateName() {
        String name = "Recebimento " + System.nanoTime();
        given().header("Authorization", "Bearer " + token())
            .contentType("application/json")
            .body("{\"nome\":\"" + name + "\"}")
            .when().post("/api/zonas")
            .then().statusCode(200).body("nome", equalTo(name));

        given().header("Authorization", "Bearer " + token())
            .contentType("application/json")
            .body("{\"nome\":\"" + name + "\"}")
            .when().post("/api/zonas")
            .then().statusCode(409);

        given().header("Authorization", "Bearer " + token())
            .when().get("/api/zonas")
            .then().statusCode(200);
    }

    @Test
    void deactivateSetsAtivaFalse() {
        String name = "Expedição " + System.nanoTime();
        String id = given().header("Authorization", "Bearer " + token())
            .contentType("application/json")
            .body("{\"nome\":\"" + name + "\"}")
            .when().post("/api/zonas")
            .then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + token())
            .when().delete("/api/zonas/" + id)
            .then().statusCode(200).body("ativa", equalTo(false));
    }

    @Test
    void patchWithBlankNomeReturns400() {
        String name = "Almoxarifado " + System.nanoTime();
        String id = given().header("Authorization", "Bearer " + token())
            .contentType("application/json")
            .body("{\"nome\":\"" + name + "\"}")
            .when().post("/api/zonas")
            .then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + token())
            .contentType("application/json")
            .body("{\"nome\":\"\"}")
            .when().patch("/api/zonas/" + id)
            .then().statusCode(400);
    }

    @Test
    void withoutTokenReturns401() {
        given().when().get("/api/zonas").then().statusCode(401);
    }

    @Test
    void deactivateBlockedWhenZonaHasActivePortal() {
        String auth = token();
        String zonaId = given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .body("{\"nome\":\"Zona Bloqueio " + System.nanoTime() + "\"}")
            .when().post("/api/zonas")
            .then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .body("{\"nome\":\"Portal Bloqueio\",\"zonaId\":\"" + zonaId + "\"}")
            .when().post("/api/portais")
            .then().statusCode(200);

        given().header("Authorization", "Bearer " + auth)
            .when().delete("/api/zonas/" + zonaId)
            .then().statusCode(409);
    }
}
