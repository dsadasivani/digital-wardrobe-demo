package com.digitalwardrobe.dashboard.dto;

import java.util.List;

public record DashboardCategoryBreakdownResponse(
    List<CategoryBreakdownItem> categoryBreakdown
) {
    public record CategoryBreakdownItem(String category, long count) {}
}
