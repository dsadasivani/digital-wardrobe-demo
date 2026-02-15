package com.digitalwardrobe.accessories.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public record UpdateAccessoryRequest(
        @Size(min = 1, max = 160, message = "name must be between 1 and 160 chars") String name,
        String category,
        String color,
        String colorHex,
        String brand,
        BigDecimal price,
        String occasion,
        Instant purchaseDate,
        String imageUrl,
        List<String> imageUrls,
        String primaryImageUrl,
        Boolean favorite,
        List<String> tags) {
}
