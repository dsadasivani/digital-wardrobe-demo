package com.digitalwardrobe.catalog.api;

import com.digitalwardrobe.catalog.dto.AddCategoryOptionRequest;
import com.digitalwardrobe.catalog.dto.AddOccasionOptionRequest;
import com.digitalwardrobe.catalog.dto.CatalogCategoryOptionResponse;
import com.digitalwardrobe.catalog.dto.CatalogOptionsResponse;
import com.digitalwardrobe.catalog.dto.OccasionOptionResponse;
import com.digitalwardrobe.catalog.service.CatalogOptionsService;
import com.digitalwardrobe.users.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/catalog-options")
public class CatalogOptionsController {

    private final CatalogOptionsService catalogOptionsService;
    private final UserService userService;

    public CatalogOptionsController(CatalogOptionsService catalogOptionsService, UserService userService) {
        this.catalogOptionsService = catalogOptionsService;
        this.userService = userService;
    }

    @GetMapping("/wardrobe")
    public CatalogOptionsResponse wardrobeOptions(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return catalogOptionsService.getWardrobeOptions(userId);
    }

    @GetMapping("/accessories")
    public CatalogOptionsResponse accessoryOptions(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return catalogOptionsService.getAccessoryOptions(userId);
    }

    @GetMapping("/outfits")
    public CatalogOptionsResponse outfitOptions(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return catalogOptionsService.getOutfitOptions(userId);
    }

    @PostMapping("/{scope}/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CatalogCategoryOptionResponse addCategory(
            @PathVariable String scope,
            @Valid @RequestBody AddCategoryOptionRequest request,
            Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return switch (scope) {
            case "wardrobe" -> catalogOptionsService.addWardrobeCategory(userId, request.label());
            case "accessories" -> catalogOptionsService.addAccessoryCategory(userId, request.label());
            case "outfits" -> catalogOptionsService.addOutfitCategory(userId, request.label());
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported category scope");
        };
    }

    @PostMapping("/occasions")
    @ResponseStatus(HttpStatus.CREATED)
    public OccasionOptionResponse addOccasion(
            @Valid @RequestBody AddOccasionOptionRequest request,
            Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return new OccasionOptionResponse(catalogOptionsService.addOccasion(userId, request.value()));
    }
}
