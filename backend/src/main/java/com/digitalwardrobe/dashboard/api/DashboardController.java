package com.digitalwardrobe.dashboard.api;

import com.digitalwardrobe.common.api.ApiError;
import com.digitalwardrobe.dashboard.dto.DashboardCategoryBreakdownResponse;
import com.digitalwardrobe.dashboard.dto.DashboardCountersResponse;
import com.digitalwardrobe.dashboard.dto.DashboardRecentlyAddedResponse;
import com.digitalwardrobe.dashboard.dto.DashboardSummaryResponse;
import com.digitalwardrobe.dashboard.dto.DashboardWearInsightsResponse;
import com.digitalwardrobe.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Dashboard summary and quick insights")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/counters")
    @Operation(summary = "Get top-level counter stats for dashboard")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Dashboard counters returned",
            content = @Content(schema = @Schema(implementation = DashboardCountersResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ApiError.class))
        )
    })
    public DashboardCountersResponse counters(Authentication authentication) {
        return dashboardService.getCounters(authentication);
    }

    @GetMapping("/wear-insights")
    @Operation(summary = "Get most/least worn wardrobe insights for dashboard")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Wear insights returned",
            content = @Content(schema = @Schema(implementation = DashboardWearInsightsResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ApiError.class))
        )
    })
    public DashboardWearInsightsResponse wearInsights(Authentication authentication) {
        return dashboardService.getWearInsights(authentication);
    }

    @GetMapping("/recently-added")
    @Operation(summary = "Get recently added wardrobe items for dashboard")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Recently added wardrobe items returned",
            content = @Content(schema = @Schema(implementation = DashboardRecentlyAddedResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ApiError.class))
        )
    })
    public DashboardRecentlyAddedResponse recentlyAdded(Authentication authentication) {
        return dashboardService.getRecentlyAdded(authentication);
    }

    @GetMapping("/category-breakdown")
    @Operation(summary = "Get wardrobe category breakdown for dashboard")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Category breakdown returned",
            content = @Content(schema = @Schema(implementation = DashboardCategoryBreakdownResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ApiError.class))
        )
    })
    public DashboardCategoryBreakdownResponse categoryBreakdown(Authentication authentication) {
        return dashboardService.getCategoryBreakdown(authentication);
    }

    @GetMapping("/summary")
    @Operation(summary = "Get summary stats for dashboard")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Dashboard summary returned",
            content = @Content(schema = @Schema(implementation = DashboardSummaryResponse.class))
        ),
        @ApiResponse(
            responseCode = "401",
            description = "Unauthorized",
            content = @Content(schema = @Schema(implementation = ApiError.class))
        )
    })
    public DashboardSummaryResponse summary(Authentication authentication) {
        return dashboardService.getSummary(authentication);
    }
}
