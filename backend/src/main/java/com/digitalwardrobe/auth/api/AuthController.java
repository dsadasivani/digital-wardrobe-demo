package com.digitalwardrobe.auth.api;

import com.digitalwardrobe.auth.dto.AuthResponse;
import com.digitalwardrobe.auth.dto.LoginRequest;
import com.digitalwardrobe.auth.dto.SignupRequest;
import com.digitalwardrobe.auth.service.AuthService;
import com.digitalwardrobe.common.api.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Signup, login, and logout endpoints")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/signup")
    @Operation(summary = "Create a new account", security = {})
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Account created and JWT issued",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = AuthResponse.class),
                examples = @ExampleObject(
                    name = "SignupSuccess",
                    value = "{\"token\":\"eyJhbGciOi...\",\"user\":{\"id\":\"67bf5f01\",\"name\":\"Alex Doe\",\"email\":\"alex@example.com\",\"gender\":\"female\",\"avatar\":null,\"preferences\":{\"favoriteColors\":[],\"stylePreferences\":[],\"location\":null,\"notificationsEnabled\":true,\"darkMode\":false},\"createdAt\":\"2026-02-15T09:00:00Z\"}}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Validation error",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiError.class),
                examples = @ExampleObject(
                    name = "ValidationError",
                    value = "{\"timestamp\":\"2026-02-15T09:00:00Z\",\"status\":400,\"code\":\"VALIDATION_ERROR\",\"message\":\"Request validation failed\",\"path\":\"/api/v1/auth/signup\",\"fieldErrors\":[{\"field\":\"password\",\"message\":\"password must be between 8 and 200 chars\"}]}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Email already exists",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiError.class),
                examples = @ExampleObject(
                    name = "ConflictError",
                    value = "{\"timestamp\":\"2026-02-15T09:00:00Z\",\"status\":409,\"code\":\"API_ERROR\",\"message\":\"Email already exists\",\"path\":\"/api/v1/auth/signup\",\"fieldErrors\":[]}"
                )
            )
        )
    })
    public AuthResponse signup(@Valid @RequestBody SignupRequest request) {
        return authService.signup(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and return JWT", security = {})
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Authenticated successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = AuthResponse.class),
                examples = @ExampleObject(
                    name = "LoginSuccess",
                    value = "{\"token\":\"eyJhbGciOi...\",\"user\":{\"id\":\"67bf5f01\",\"name\":\"Alex Doe\",\"email\":\"alex@example.com\",\"gender\":\"female\",\"avatar\":null,\"preferences\":{\"favoriteColors\":[],\"stylePreferences\":[],\"location\":null,\"notificationsEnabled\":true,\"darkMode\":false},\"createdAt\":\"2026-02-15T09:00:00Z\"}}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Validation error",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Invalid credentials",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = ApiError.class),
                examples = @ExampleObject(
                    name = "InvalidCredentials",
                    value = "{\"timestamp\":\"2026-02-15T09:00:00Z\",\"status\":401,\"code\":\"INVALID_CREDENTIALS\",\"message\":\"Invalid email or password\",\"path\":\"/api/v1/auth/login\",\"fieldErrors\":[]}"
                )
            )
        )
    })
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current user", security = {})
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Logout acknowledged",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "LogoutSuccess",
                    value = "{\"message\":\"Logged out\"}"
                )
            )
        )
    })
    public Map<String, String> logout() {
        return Map.of("message", "Logged out");
    }
}
