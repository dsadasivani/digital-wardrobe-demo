package com.digitalwardrobe.wardrobe.api;

import com.digitalwardrobe.wardrobe.dto.CreateWardrobeItemRequest;
import com.digitalwardrobe.wardrobe.dto.UpdateWardrobeItemRequest;
import com.digitalwardrobe.wardrobe.dto.WardrobeItemResponse;
import com.digitalwardrobe.wardrobe.service.WardrobeService;
import com.digitalwardrobe.common.api.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/wardrobe-items")
@Tag(name = "Wardrobe", description = "Wardrobe item CRUD operations")
public class WardrobeController {

    private final WardrobeService wardrobeService;

    public WardrobeController(WardrobeService wardrobeService) {
        this.wardrobeService = wardrobeService;
    }

    @GetMapping
    @Operation(summary = "List wardrobe items for current user")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Wardrobe items returned",
            content = @Content(
                mediaType = "application/json",
                array = @ArraySchema(schema = @Schema(implementation = WardrobeItemResponse.class)),
                examples = @ExampleObject(
                    name = "WardrobeList",
                    value = "[{\"id\":\"a1\",\"name\":\"Black T-Shirt\",\"category\":\"tops\",\"color\":\"Black\",\"colorHex\":\"#000000\",\"size\":\"M\",\"brand\":\"Uniqlo\",\"price\":29.99,\"purchaseDate\":\"2025-09-01T00:00:00Z\",\"imageUrl\":\"https://cdn.example.com/item.jpg\",\"worn\":12,\"lastWorn\":\"2026-02-10T00:00:00Z\",\"favorite\":true,\"tags\":[\"casual\",\"summer\"],\"notes\":\"Soft cotton\",\"createdAt\":\"2025-09-01T00:00:00Z\"}]"
                )
            )
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public List<WardrobeItemResponse> list(Authentication authentication) {
        return wardrobeService.list(authentication);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get wardrobe item by id")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wardrobe item returned", content = @Content(schema = @Schema(implementation = WardrobeItemResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Item not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public WardrobeItemResponse getById(@PathVariable String id, Authentication authentication) {
        return wardrobeService.getById(id, authentication);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create wardrobe item")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Wardrobe item created", content = @Content(schema = @Schema(implementation = WardrobeItemResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public WardrobeItemResponse create(
        @Valid @RequestBody CreateWardrobeItemRequest request,
        Authentication authentication
    ) {
        return wardrobeService.create(request, authentication);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update wardrobe item")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Wardrobe item updated", content = @Content(schema = @Schema(implementation = WardrobeItemResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Item not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public WardrobeItemResponse update(
        @Parameter(description = "Wardrobe item id", example = "a1") @PathVariable String id,
        @Valid @RequestBody UpdateWardrobeItemRequest request,
        Authentication authentication
    ) {
        return wardrobeService.update(id, request, authentication);
    }

    @PostMapping("/{id}/mark-worn")
    @Operation(summary = "Increment worn counter for wardrobe item")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Worn counter incremented", content = @Content(schema = @Schema(implementation = WardrobeItemResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Item not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public WardrobeItemResponse markAsWorn(
        @Parameter(description = "Wardrobe item id", example = "a1") @PathVariable String id,
        Authentication authentication
    ) {
        return wardrobeService.markAsWorn(id, authentication);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete wardrobe item")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Wardrobe item deleted"),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Item not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public void delete(@PathVariable String id, Authentication authentication) {
        wardrobeService.delete(id, authentication);
    }
}
