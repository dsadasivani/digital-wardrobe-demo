package com.digitalwardrobe.wardrobe.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CreateWardrobeItemRequest(
    @NotBlank(message = "name is required")
    @Size(max = 160, message = "name must be at most 160 chars")
    String name,
    @NotBlank(message = "category is required")
    String category,
    @NotBlank(message = "color is required")
    String color,
    @NotBlank(message = "colorHex is required")
    String colorHex,
    String size,
    String brand,
    String occasion,
    @DecimalMin(value = "0.0", inclusive = false, message = "price must be greater than 0")
    BigDecimal price,
    Instant purchaseDate,
    String imageUrl,
    List<String> imageUrls,
    String primaryImageUrl,
    List<String> imagePaths,
    String primaryImagePath,
    @NotNull(message = "favorite is required")
    Boolean favorite,
    List<String> tags,
    String notes
) {}
