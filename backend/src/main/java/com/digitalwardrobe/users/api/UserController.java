package com.digitalwardrobe.users.api;

import com.digitalwardrobe.users.dto.UpdateUserRequest;
import com.digitalwardrobe.users.dto.UserResponse;
import com.digitalwardrobe.users.service.UserService;
import com.digitalwardrobe.common.api.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "Current user profile operations")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated user profile")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Current user profile returned",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = UserResponse.class),
                examples = @ExampleObject(
                    name = "UserProfile",
                    value = "{\"id\":\"67bf5f01\",\"name\":\"Alex Doe\",\"email\":\"alex@example.com\",\"gender\":\"female\",\"avatar\":null,\"preferences\":{\"favoriteColors\":[\"black\"],\"stylePreferences\":[\"minimal\"],\"location\":\"Hyderabad\",\"notificationsEnabled\":true,\"darkMode\":false},\"createdAt\":\"2026-02-15T09:00:00Z\"}"
                )
            )
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
        ),
        @ApiResponse(
            responseCode = "404",
            description = "User not found",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
        )
    })
    public UserResponse getMe(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return userService.getCurrentUser(userId);
    }

    @PatchMapping("/me")
    @Operation(summary = "Update current authenticated user profile")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Profile updated",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserResponse.class))
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Validation error",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
        ),
        @ApiResponse(
            responseCode = "409",
            description = "Email conflict",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ApiError.class))
        )
    })
    public UserResponse updateMe(Authentication authentication, @Valid @RequestBody UpdateUserRequest request) {
        String userId = userService.requireCurrentUserId(authentication);
        return userService.updateCurrentUser(userId, request);
    }
}
