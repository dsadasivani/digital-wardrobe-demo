package com.digitalwardrobe.accessories.api;

import com.digitalwardrobe.accessories.dto.AccessoryResponse;
import com.digitalwardrobe.accessories.dto.CreateAccessoryRequest;
import com.digitalwardrobe.accessories.dto.UpdateAccessoryRequest;
import com.digitalwardrobe.accessories.service.AccessoryService;
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
@RequestMapping("/api/v1/accessories")
@Tag(name = "Accessories", description = "Accessory CRUD operations")
public class AccessoriesController {

    private final AccessoryService accessoryService;

    public AccessoriesController(AccessoryService accessoryService) {
        this.accessoryService = accessoryService;
    }

    @GetMapping
    @Operation(summary = "List accessories for current user")
    @ApiResponses({
        @ApiResponse(
            responseCode = "200",
            description = "Accessories returned",
            content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = AccessoryResponse.class)))
        ),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public List<AccessoryResponse> list(Authentication authentication) {
        return accessoryService.list(authentication);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get accessory by id")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Accessory returned", content = @Content(schema = @Schema(implementation = AccessoryResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Accessory not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public AccessoryResponse getById(@PathVariable String id, Authentication authentication) {
        return accessoryService.getById(id, authentication);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create accessory")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Accessory created", content = @Content(schema = @Schema(implementation = AccessoryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public AccessoryResponse create(
            @Valid @RequestBody CreateAccessoryRequest request,
            Authentication authentication) {
        return accessoryService.create(request, authentication);
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update accessory")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Accessory updated", content = @Content(schema = @Schema(implementation = AccessoryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Validation error", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Accessory not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public AccessoryResponse update(
            @Parameter(description = "Accessory id", example = "a1") @PathVariable String id,
            @Valid @RequestBody UpdateAccessoryRequest request,
            Authentication authentication) {
        return accessoryService.update(id, request, authentication);
    }

    @PostMapping("/{id}/mark-worn")
    @Operation(summary = "Increment worn counter for accessory")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Worn counter incremented", content = @Content(schema = @Schema(implementation = AccessoryResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Accessory not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public AccessoryResponse markAsWorn(
            @Parameter(description = "Accessory id", example = "a1") @PathVariable String id,
            Authentication authentication) {
        return accessoryService.markAsWorn(id, authentication);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete accessory")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Accessory deleted"),
        @ApiResponse(responseCode = "401", description = "Unauthorized", content = @Content(schema = @Schema(implementation = ApiError.class))),
        @ApiResponse(responseCode = "404", description = "Accessory not found", content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public void delete(@PathVariable String id, Authentication authentication) {
        accessoryService.delete(id, authentication);
    }
}
