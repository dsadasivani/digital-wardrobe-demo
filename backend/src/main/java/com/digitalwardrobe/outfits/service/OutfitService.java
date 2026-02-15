package com.digitalwardrobe.outfits.service;

import com.digitalwardrobe.accessories.service.AccessoryService;
import com.digitalwardrobe.outfits.domain.OutfitDocument;
import com.digitalwardrobe.outfits.domain.OutfitItemEmbed;
import com.digitalwardrobe.outfits.dto.CreateOutfitRequest;
import com.digitalwardrobe.outfits.dto.OutfitResponse;
import com.digitalwardrobe.outfits.dto.UpdateOutfitRequest;
import com.digitalwardrobe.outfits.repository.OutfitRepository;
import com.digitalwardrobe.users.service.UserService;
import com.digitalwardrobe.wardrobe.service.WardrobeService;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class OutfitService {

    private final OutfitRepository outfitRepository;
    private final UserService userService;
    private final WardrobeService wardrobeService;
    private final AccessoryService accessoryService;

    public OutfitService(
            OutfitRepository outfitRepository,
            UserService userService,
            WardrobeService wardrobeService,
            AccessoryService accessoryService) {
        this.outfitRepository = outfitRepository;
        this.userService = userService;
        this.wardrobeService = wardrobeService;
        this.accessoryService = accessoryService;
    }

    public List<OutfitResponse> list(Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        return outfitRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream().map(this::toResponse).toList();
    }

    public OutfitResponse getById(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        OutfitDocument outfit = findByIdForUserOrThrow(id, userId);
        return toResponse(outfit);
    }

    public OutfitResponse create(CreateOutfitRequest request, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        OutfitDocument outfit = new OutfitDocument();
        outfit.setUserId(userId);
        outfit.setName(request.name());
        outfit.setItems(toEmbeds(request.items()));
        outfit.setOccasion(request.occasion());
        outfit.setSeason(request.season());
        outfit.setRating(request.rating());
        outfit.setFavorite(Boolean.TRUE.equals(request.favorite()));
        outfit.setNotes(request.notes());
        outfit.setImageUrl(request.imageUrl());
        outfit.setPlannedDates(request.plannedDates() != null ? request.plannedDates() : List.of());
        outfit.setProcessedPlannedDates(new ArrayList<>());
        outfit.setCreatedAt(Instant.now());
        outfit.setUpdatedAt(Instant.now());
        OutfitDocument saved = outfitRepository.save(outfit);
        return toResponse(saved);
    }

    public OutfitResponse update(String id, UpdateOutfitRequest request, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        OutfitDocument outfit = findByIdForUserOrThrow(id, userId);
        if (request.name() != null) {
            outfit.setName(request.name());
        }
        if (request.items() != null) {
            outfit.setItems(toEmbeds(request.items()));
        }
        if (request.occasion() != null) {
            outfit.setOccasion(request.occasion());
        }
        if (request.season() != null) {
            outfit.setSeason(request.season());
        }
        if (request.rating() != null) {
            outfit.setRating(request.rating());
        }
        if (request.favorite() != null) {
            outfit.setFavorite(request.favorite());
        }
        if (request.notes() != null) {
            outfit.setNotes(request.notes());
        }
        if (request.imageUrl() != null) {
            outfit.setImageUrl(request.imageUrl());
        }
        if (request.lastWorn() != null) {
            outfit.setLastWorn(request.lastWorn());
        }
        if (request.plannedDates() != null) {
            outfit.setPlannedDates(request.plannedDates());
        }
        outfit.setUpdatedAt(Instant.now());
        OutfitDocument saved = outfitRepository.save(outfit);
        return toResponse(saved);
    }

    public OutfitResponse markAsWorn(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        OutfitDocument outfit = findByIdForUserOrThrow(id, userId);
        Instant now = Instant.now();
        applyWorn(outfit, 1, now);
        OutfitDocument saved = outfitRepository.save(outfit);
        incrementItemsForOutfit(saved, 1, now);
        return toResponse(saved);
    }

    public void processDuePlannedDates() {
        String today = LocalDate.now(ZoneOffset.UTC).toString();
        List<OutfitDocument> dueOutfits = outfitRepository.findByPlannedDatesLessThanEqual(today);
        for (OutfitDocument outfit : dueOutfits) {
            Set<String> dueDates = extractUnprocessedDueDates(outfit, today);
            if (dueDates.isEmpty()) {
                continue;
            }
            int incrementBy = dueDates.size();
            Instant lastDueDateAt = toUtcStartOfDay(dueDates.stream().max(String::compareTo).orElse(today));
            applyWorn(outfit, incrementBy, lastDueDateAt);
            List<String> processed = outfit.getProcessedPlannedDates() != null
                    ? new ArrayList<>(outfit.getProcessedPlannedDates())
                    : new ArrayList<>();
            processed.addAll(dueDates);
            outfit.setProcessedPlannedDates(processed);
            outfitRepository.save(outfit);
            incrementItemsForOutfit(outfit, incrementBy, lastDueDateAt);
        }
    }

    public void delete(String id, Authentication authentication) {
        String userId = userService.requireCurrentUserId(authentication);
        OutfitDocument outfit = findByIdForUserOrThrow(id, userId);
        outfitRepository.delete(outfit);
    }

    private OutfitDocument findByIdForUserOrThrow(String id, String userId) {
        return outfitRepository
                .findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Outfit not found"));
    }

    private void applyWorn(OutfitDocument outfit, int incrementBy, Instant wornAt) {
        outfit.setWorn(outfit.getWorn() + incrementBy);
        outfit.setLastWorn(wornAt);
        outfit.setUpdatedAt(Instant.now());
    }

    private Set<String> extractUnprocessedDueDates(OutfitDocument outfit, String today) {
        Set<String> processed = outfit.getProcessedPlannedDates() != null
                ? new LinkedHashSet<>(outfit.getProcessedPlannedDates())
                : Set.of();
        return outfit.getPlannedDates() == null
                ? Set.of()
                : outfit.getPlannedDates().stream()
                        .filter(date -> date != null && date.compareTo(today) <= 0)
                        .filter(date -> !processed.contains(date))
                        .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
    }

    private void incrementItemsForOutfit(OutfitDocument outfit, int incrementBy, Instant wornAt) {
        Set<String> wardrobeItemIds = outfit.getItems() == null
                ? Set.of()
                : outfit.getItems().stream()
                        .filter(item -> "wardrobe".equalsIgnoreCase(item.getType()))
                        .map(OutfitItemEmbed::getItemId)
                        .filter(itemId -> itemId != null && !itemId.isBlank())
                        .collect(java.util.stream.Collectors.toSet());
        Set<String> accessoryIds = outfit.getItems() == null
                ? Set.of()
                : outfit.getItems().stream()
                        .filter(item -> "accessory".equalsIgnoreCase(item.getType()))
                        .map(OutfitItemEmbed::getItemId)
                        .filter(itemId -> itemId != null && !itemId.isBlank())
                        .collect(java.util.stream.Collectors.toSet());
        wardrobeService.incrementWornForUserItems(outfit.getUserId(), wardrobeItemIds, incrementBy, wornAt);
        accessoryService.incrementWornForUserAccessories(outfit.getUserId(), accessoryIds, incrementBy, wornAt);
    }

    private Instant toUtcStartOfDay(String isoDate) {
        return LocalDate.parse(isoDate).atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    private List<OutfitItemEmbed> toEmbeds(List<CreateOutfitRequest.OutfitItemRequest> items) {
        if (items == null) {
            return List.of();
        }
        return items.stream()
                .map(item -> new OutfitItemEmbed(
                        item.itemId(),
                        item.type(),
                        item.positionX(),
                        item.positionY(),
                        item.scale(),
                        item.rotation(),
                        item.zIndex()))
                .toList();
    }

    private OutfitResponse toResponse(OutfitDocument outfit) {
        List<OutfitResponse.OutfitItemResponse> items = outfit.getItems() != null
                ? outfit.getItems().stream()
                        .map(item -> new OutfitResponse.OutfitItemResponse(
                                item.getItemId(),
                                item.getType(),
                                item.getPositionX(),
                                item.getPositionY(),
                                item.getScale(),
                                item.getRotation(),
                                item.getZIndex()))
                        .toList()
                : List.of();

        return new OutfitResponse(
                outfit.getId(),
                outfit.getName(),
                items,
                outfit.getOccasion(),
                outfit.getSeason(),
                outfit.getRating(),
                outfit.isFavorite(),
                outfit.getNotes(),
                outfit.getImageUrl(),
                outfit.getCreatedAt(),
                outfit.getWorn(),
                outfit.getLastWorn(),
                outfit.getPlannedDates());
    }
}
