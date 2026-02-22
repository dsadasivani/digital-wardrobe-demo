package com.digitalwardrobe.accessories.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record CreateAccessoryRequest(
        @NotBlank(message = "name is required") @Size(max = 160, message = "name must be at most 160 chars") String name,
        @NotBlank(message = "category is required") String category,
        @NotBlank(message = "color is required") String color,
        @NotBlank(message = "colorHex is required") String colorHex,
        String brand,
        BigDecimal price,
        String occasion,
        Instant purchaseDate,
        String imageUrl,
        List<String> imageUrls,
        String primaryImageUrl,
        List<String> imagePaths,
        String primaryImagePath,
        @NotNull(message = "favorite is required") Boolean favorite,
        List<String> tags) {
}
