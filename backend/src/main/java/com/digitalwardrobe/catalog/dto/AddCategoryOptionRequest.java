package com.digitalwardrobe.catalog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddCategoryOptionRequest(
        @NotBlank(message = "label is required")
        @Size(max = 60, message = "label must be at most 60 chars")
        String label) {
}
