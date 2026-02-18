package com.digitalwardrobe.dashboard.dto;

import com.digitalwardrobe.wardrobe.dto.WardrobeItemResponse;
import java.util.List;

public record DashboardSummaryResponse(
    long totalItems,
    long totalAccessories,
    long totalOutfits,
    long favoriteCount,
    long unusedCount,
    WardrobeItemResponse mostWornItem,
    List<WardrobeItemResponse> leastWornItems,
    List<WardrobeItemResponse> recentlyAdded,
    List<WardrobeItemResponse> suggestedItems,
    List<CategoryBreakdownItem> categoryBreakdown
) {
    public record CategoryBreakdownItem(String category, long count) {}
}
