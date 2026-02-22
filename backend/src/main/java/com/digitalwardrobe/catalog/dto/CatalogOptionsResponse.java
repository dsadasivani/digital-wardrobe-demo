package com.digitalwardrobe.catalog.dto;

import java.util.List;

public record CatalogOptionsResponse(
        List<CatalogCategoryOptionResponse> categories,
        List<String> occasions,
        List<String> sizes) {
}
