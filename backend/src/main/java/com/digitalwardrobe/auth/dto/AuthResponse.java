package com.digitalwardrobe.auth.dto;

import com.digitalwardrobe.users.dto.UserResponse;

public record AuthResponse(String token, UserResponse user) {}
