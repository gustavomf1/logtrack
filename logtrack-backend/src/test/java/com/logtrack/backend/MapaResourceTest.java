package com.logtrack.backend;

import com.logtrack.backend.repository.SupervisorRepository;
import com.logtrack.backend.security.PasswordHasher;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

// Mapa é um singleton no domínio (uma única linha) — os testes que dependem
// de "nenhum mapa ainda existe" precisam rodar antes do teste que cria um.
@QuarkusTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class MapaResourceTest {

    @Inject
    SupervisorRepository supervisorRepository;

    @Inject
    PasswordHasher passwordHasher;

    String token() {
        return TestAuth.token(supervisorRepository, passwordHasher);
    }

    @Test
    @Order(1)
    void getBeforeAnyMapaReturnsNull() {
        given().header("Authorization", "Bearer " + token())
            .when().get("/api/mapa")
            .then().statusCode(200).body(equalTo("null"));
    }

    @Test
    @Order(2)
    void putWithoutMapaReturns409() {
        given().header("Authorization", "Bearer " + token())
            .contentType("application/json")
            .body("{\"estacoes\":[],\"textos\":[],\"zonas\":[]}")
            .when().put("/api/mapa")
            .then().statusCode(409);
    }

    @Test
    @Order(3)
    void uploadInvalidTypeReturns400() {
        given().header("Authorization", "Bearer " + token())
            .multiPart("planta", "arquivo.txt", "não é imagem".getBytes(), "text/plain")
            .when().post("/api/mapa/planta")
            .then().statusCode(400);
    }

    @Test
    @Order(4)
    void uploadValidPngThenPutAndGetRoundTrip() {
        String auth = token();
        byte[] pngBytes = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

        given().header("Authorization", "Bearer " + auth)
            .multiPart("planta", "planta.png", pngBytes, "image/png")
            .when().post("/api/mapa/planta")
            .then().statusCode(200).body("imagemUrl", startsWith("/uploads/mapa-"));

        String zonaId = given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"nome\":\"Zona Mapa " + System.nanoTime() + "\"}")
            .when().post("/api/zonas").then().statusCode(200).extract().path("id");
        String portalId = given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"nome\":\"Portal Mapa\",\"zonaId\":\"" + zonaId + "\"}")
            .when().post("/api/portais").then().statusCode(200).extract().path("id");

        given().header("Authorization", "Bearer " + auth).contentType("application/json")
            .body("{\"estacoes\":[{\"portalId\":\"" + portalId + "\",\"apelido\":\"E1\",\"x\":0.5,\"y\":0.5}],\"textos\":[],\"zonas\":[]}")
            .when().put("/api/mapa")
            .then().statusCode(200).body("estacoes[0].apelido", equalTo("E1"));

        given().header("Authorization", "Bearer " + auth)
            .when().get("/api/mapa")
            .then().statusCode(200).body("estacoes[0].portalId", equalTo(portalId));
    }
}
