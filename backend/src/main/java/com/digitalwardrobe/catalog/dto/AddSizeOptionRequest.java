package com.digitalwardrobe.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddSizeOptionRequest(
        @NotBlank(message = "value is required")
        @Size(max = 60, message = "value must be at most 60 chars")
        String value) {
}
