package com.digitalwardrobe.outfits.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateOutfitRequest(
        @NotBlank(message = "name is required") @Size(max = 160, message = "name must be at most 160 chars") String name,
        String category,
        @NotNull(message = "items are required") List<@Valid OutfitItemRequest> items,
        String occasion,
        String season,
        Integer rating,
        @NotNull(message = "favorite is required") Boolean favorite,
        String notes,
        String imageUrl,
        List<String> plannedDates) {
    public record OutfitItemRequest(
            @NotBlank(message = "itemId is required") String itemId,
            @NotBlank(message = "type is required") String type,
            double positionX,
            double positionY,
            double scale,
            double rotation,
            int zIndex) {
    }
}
