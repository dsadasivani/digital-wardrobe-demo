package com.digitalwardrobe.dashboard.dto;

import com.digitalwardrobe.wardrobe.dto.WardrobeItemResponse;
import java.util.List;

public record DashboardWearInsightsResponse(
    WardrobeItemResponse mostWornItem,
    List<WardrobeItemResponse> leastWornItems
) {}
