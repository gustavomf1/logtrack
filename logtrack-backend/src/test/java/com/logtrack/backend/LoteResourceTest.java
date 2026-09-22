package com.logtrack.backend;

import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
class LoteResourceTest {

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    String token() {
        return TestAuth.token(supervisorRepository, passwordHasher);
    }

    @Test
    void createDuplicateCodigoReturns409() {
        String auth = token();
        String codigo = "LOTE-" + System.nanoTime();
        String body = "{\"codigo\":\"" + codigo + "\",\"quantidade\":10}";

        given().header("Authorization", "Bearer " + auth).contentType("application/json").body(body)
            .when().post("/api/lotes").then().statusCode(200).body("url", containsString("/l/"));

        given().header("Authorization", "Bearer " + auth).contentType("application/json").body(body)
            .when().post("/api/lotes").then().statusCode(409);
    }

    @Test
    void archiveSetsArquivadoTrue() {
        String auth = token();
        String id = given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"codigo\":\"LOTE-ARQ-" + System.nanoTime() + "\"}")
            .when().post("/api/lotes").then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + auth)
            .when().delete("/api/lotes/" + id)
            .then().statusCode(200).body("arquivado", equalTo(true));
    }

    @Test
    void publicEndpointWorksWithoutAuth() {
        String auth = token();
        String id = given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"codigo\":\"LOTE-PUB-" + System.nanoTime() + "\"}")
            .when().post("/api/lotes").then().statusCode(200).extract().path("id");

        given()
            .when().get("/api/lotes/publico/" + id)
            .then().statusCode(200).body("codigo", startsWith("LOTE-PUB-"));
    }

    @Test
    void gravarTagSetsFlag() {
        String auth = token();
        String id = given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"codigo\":\"LOTE-TAG-" + System.nanoTime() + "\"}")
            .when().post("/api/lotes").then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + auth)
            .contentType("application/json")
            .when().post("/api/lotes/" + id + "/gravar-tag")
            .then().statusCode(200).body("tagGravada", equalTo(true));
    }
}
