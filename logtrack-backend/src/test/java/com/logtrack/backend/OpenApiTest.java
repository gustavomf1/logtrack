package com.logtrack.backend;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
class OpenApiTest {

    @Test
    void openApiDocumentIsServedWithLogtrackTitle() {
        given()
            .when().get("/q/openapi?format=json")
            .then().statusCode(200)
            .body("info.title", equalTo("LogTrack API"));
    }
}
