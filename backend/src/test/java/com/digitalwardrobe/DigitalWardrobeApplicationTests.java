package com.digitalwardrobe;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "app.security.jwt-secret=test-secret-value-that-is-long-enough",
    "spring.mongodb.uri=mongodb://localhost:27017/digital_wardrobe_test"
})
class DigitalWardrobeApplicationTests {

    @Test
    void contextLoads() {
    }
}
