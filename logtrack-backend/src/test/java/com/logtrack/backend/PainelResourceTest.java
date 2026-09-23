package com.logtrack.backend;

import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class PainelResourceTest {

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    String token() {
        return TestAuth.token(supervisorRepository, passwordHasher);
    }

    @Test
    void includesArchivedLotesAndOmitsPortalTokens() {
        String auth = token();
        String codigo = "LOTE-PAINEL-" + System.nanoTime();
        String loteId = given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"codigo\":\"" + codigo + "\"}")
            .when().post("/api/lotes").then().statusCode(200).extract().path("id");
        given().header("Authorization", "Bearer " + auth)
            .when().delete("/api/lotes/" + loteId).then().statusCode(200);

        given().header("Authorization", "Bearer " + auth)
            .when().get("/api/painel")
            .then().statusCode(200)
            .body("lotes.find { it.codigo == '" + codigo + "' }.arquivado", equalTo(true))
            .body("portais", not(hasItem(hasKey("tokenCookie"))))
            .body("totalLeituras", greaterThanOrEqualTo(0));
    }

    @Test
    void withoutTokenReturns401() {
        given().when().get("/api/painel").then().statusCode(401);
    }
}
