package com.digitalwardrobe.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignupRequest(
    @NotBlank(message = "name is required")
    @Size(min = 2, max = 120, message = "name must be between 2 and 120 chars")
    String name,
    @NotBlank(message = "email is required")
    @Email(message = "email must be valid")
    @Size(max = 320, message = "email must be 320 chars or fewer")
    String email,
    @NotBlank(message = "password is required")
    @Size(min = 8, max = 200, message = "password must be between 8 and 200 chars")
    String password
) {}
