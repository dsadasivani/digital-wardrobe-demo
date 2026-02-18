package com.digitalwardrobe.dashboard.dto;

public record DashboardCountersResponse(
    long totalItems,
    long totalAccessories,
    long totalOutfits,
    long favoriteCount,
    long unusedCount
) {}
