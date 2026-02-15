package com.digitalwardrobe.outfits.api;

import com.digitalwardrobe.outfits.dto.CreateOutfitRequest;
import com.digitalwardrobe.outfits.dto.OutfitResponse;
import com.digitalwardrobe.outfits.dto.UpdateOutfitRequest;
import com.digitalwardrobe.outfits.service.OutfitService;
import com.digitalwardrobe.common.api.ApiError;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
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
@RequestMapping("/api/v1/outfits")
@Tag(name = "Outfits", description = "Outfit CRUD and planning operations")
public class OutfitController {

    private final OutfitService outfitService;

    public OutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    @GetMapping
    @Operation(summary = "List outfits for current user")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Outfits returned",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = OutfitResponse.class)))
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public List<OutfitResponse> list(Authentication authentication) {
        return outfitService.list(authentication);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get outfit by id")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Outfit returned", content = @Content(schema = @Schema(implementation = OutfitResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Outfit not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public OutfitResponse getById(@PathVariable String id, Authentication authentication) {
        return outfitService.getById(id, authentication);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create outfit")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Outfit created", content = @Content(schema = @Schema(implementation = OutfitResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public OutfitResponse create(
            @Valid @RequestBody CreateOutfitRequest request,
            Authentication authentication) {
        return outfitService.create(request, authentication);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update outfit")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Outfit updated", content = @Content(schema = @Schema(implementation = OutfitResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Outfit not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public OutfitResponse update(
            @Parameter(description = "Outfit id", example = "o1") @PathVariable String id,
            @Valid @RequestBody UpdateOutfitRequest request,
            Authentication authentication) {
        return outfitService.update(id, request, authentication);
    }

    @PostMapping("/{id}/mark-worn")
    @Operation(summary = "Increment worn counter for outfit and all items in it")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Worn counter incremented", content = @Content(schema = @Schema(implementation = OutfitResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Outfit not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public OutfitResponse markAsWorn(
            @Parameter(description = "Outfit id", example = "o1") @PathVariable String id,
            Authentication authentication) {
        return outfitService.markAsWorn(id, authentication);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete outfit")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Outfit deleted"),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Outfit not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public void delete(@PathVariable String id, Authentication authentication) {
        outfitService.delete(id, authentication);
    }
}
