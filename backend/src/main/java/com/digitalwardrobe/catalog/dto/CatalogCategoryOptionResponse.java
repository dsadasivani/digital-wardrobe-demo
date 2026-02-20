package com.digitalwardrobe.catalog.dto;

public record CatalogCategoryOptionResponse(
        String id,
        String label,
        String icon,
        boolean custom) {
}
