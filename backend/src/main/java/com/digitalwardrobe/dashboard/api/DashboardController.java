package com.digitalwardrobe.dashboard.api;

import com.digitalwardrobe.common.api.ApiError;
import com.digitalwardrobe.dashboard.dto.DashboardSummaryResponse;
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
