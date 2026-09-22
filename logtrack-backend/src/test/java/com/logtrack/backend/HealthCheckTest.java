package com.logtrack.backend;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
class HealthCheckTest {

    @Test
    void livenessRespondsOk() {
        given()
            .when().get("/q/health/live")
            .then().statusCode(200);
    }
}
