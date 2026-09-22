package com.logtrack.backend;

import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.Cookie;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class LeituraResourceTest {

    // Igual ao default de %test.logtrack.backend-origin (não sobrescrito) em application.properties.
    private static final String ORIGIN = "http://localhost:8080";

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    String token() {
        return TestAuth.token(supervisorRepository, passwordHasher);
    }

    String createLote(String auth) {
        return given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"codigo\":\"LOTE-LEITURA-" + System.nanoTime() + "\"}")
            .when().post("/api/lotes").then().statusCode(200).extract().path("id");
    }

    Cookie createActivatedStationCookie(String auth) {
        String zonaId = given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"nome\":\"Zona Leitura " + System.nanoTime() + "\"}")
            .when().post("/api/zonas").then().statusCode(200).extract().path("id");

        String activationUrl = given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"nome\":\"Portal Leitura\",\"zonaId\":\"" + zonaId + "\"}")
            .when().post("/api/portais").then().statusCode(200).extract().path("activationUrl");
        String activationToken = activationUrl.substring(activationUrl.lastIndexOf('/') + 1);

        return given().redirects().follow(false)
            .when().get("/ativar/" + activationToken)
            .then().statusCode(302).extract().detailedCookie("logtrack_station");
    }

    @Test
    void fullReadReturnsMovimento() {
        String auth = token();
        String loteId = createLote(auth);
        Cookie cookie = createActivatedStationCookie(auth);

        given().cookie(cookie).header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + loteId + "\",\"requestId\":\"" + UUID.randomUUID() + "\"}")
            .when().post("/api/leituras")
            .then().statusCode(200).body("modo", equalTo("MOVIMENTO"));
    }

    @Test
    void rereadAtSamePortalReturnsCancelamento() {
        String auth = token();
        String loteId = createLote(auth);
        Cookie cookie = createActivatedStationCookie(auth);

        given().cookie(cookie).header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + loteId + "\",\"requestId\":\"" + UUID.randomUUID() + "\"}")
            .when().post("/api/leituras").then().statusCode(200);

        given().cookie(cookie).header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + loteId + "\",\"requestId\":\"" + UUID.randomUUID() + "\"}")
            .when().post("/api/leituras")
            .then().statusCode(200).body("modo", equalTo("CANCELAMENTO"));
    }

    @Test
    void unknownLoteReturns404() {
        String auth = token();
        Cookie cookie = createActivatedStationCookie(auth);

        given().cookie(cookie).header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + UUID.randomUUID() + "\",\"requestId\":\"" + UUID.randomUUID() + "\"}")
            .when().post("/api/leituras")
            .then().statusCode(404);
    }

    @Test
    void withoutStationCookieReturnsConsulta() {
        String auth = token();
        String loteId = createLote(auth);

        given().header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + loteId + "\",\"requestId\":\"" + UUID.randomUUID() + "\"}")
            .when().post("/api/leituras")
            .then().statusCode(200).body("modo", equalTo("CONSULTA"));
    }

    @Test
    void replayingSameRequestIdReturnsCachedResult() {
        String auth = token();
        String loteId = createLote(auth);
        Cookie cookie = createActivatedStationCookie(auth);
        String requestId = UUID.randomUUID().toString();

        given().cookie(cookie).header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + loteId + "\",\"requestId\":\"" + requestId + "\"}")
            .when().post("/api/leituras")
            .then().statusCode(200).body("modo", equalTo("MOVIMENTO"));

        given().cookie(cookie).header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + loteId + "\",\"requestId\":\"" + requestId + "\"}")
            .when().post("/api/leituras")
            .then().statusCode(200).body("modo", equalTo("MOVIMENTO"));
    }

    @Test
    void replayingSameRequestIdWithDifferentLoteReturns409() {
        String auth = token();
        String loteA = createLote(auth);
        String loteB = createLote(auth);
        Cookie cookie = createActivatedStationCookie(auth);
        String requestId = UUID.randomUUID().toString();

        given().cookie(cookie).header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + loteA + "\",\"requestId\":\"" + requestId + "\"}")
            .when().post("/api/leituras").then().statusCode(200);

        given().cookie(cookie).header("Origin", ORIGIN).contentType("application/json")
            .body("{\"loteId\":\"" + loteB + "\",\"requestId\":\"" + requestId + "\"}")
            .when().post("/api/leituras")
            .then().statusCode(409);
    }

    @Test
    void missingOriginReturns403() {
        String auth = token();
        String loteId = createLote(auth);

        given().contentType("application/json")
            .body("{\"loteId\":\"" + loteId + "\",\"requestId\":\"" + UUID.randomUUID() + "\"}")
            .when().post("/api/leituras")
            .then().statusCode(403);
    }
}
