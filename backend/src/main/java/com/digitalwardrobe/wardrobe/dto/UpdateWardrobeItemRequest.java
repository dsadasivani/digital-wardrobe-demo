package com.digitalwardrobe.wardrobe.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record UpdateWardrobeItemRequest(
    @Size(min = 1, max = 160, message = "name must be between 1 and 160 chars")
    String name,
    String category,
    String color,
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
    @Min(value = 0, message = "worn must be >= 0")
    Integer worn,
    Instant lastWorn,
    Boolean favorite,
    List<String> tags,
    String notes
) {}
