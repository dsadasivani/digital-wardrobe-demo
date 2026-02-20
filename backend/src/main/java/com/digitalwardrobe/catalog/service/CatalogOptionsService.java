package com.digitalwardrobe.catalog.service;

import com.digitalwardrobe.catalog.domain.CatalogOptionDocument;
import com.digitalwardrobe.catalog.dto.CatalogCategoryOptionResponse;
import com.digitalwardrobe.catalog.dto.CatalogOptionsResponse;
import com.digitalwardrobe.catalog.repository.CatalogOptionRepository;
import java.text.Normalizer;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CatalogOptionsService {

    public static final String WARDROBE_CATEGORY_SCOPE = "wardrobe-category";
    public static final String ACCESSORY_CATEGORY_SCOPE = "accessory-category";
    public static final String OCCASION_SCOPE = "occasion";
    private static final String SYSTEM_USER_ID = "__system__";
    private static final int CUSTOM_SORT_ORDER = 10_000;
    private static final String DEFAULT_WARDROBE_ICON = "checkroom";
    private static final String DEFAULT_ACCESSORY_ICON = "watch";

    private static final List<CategorySeed> WARDROBE_CATEGORY_DEFAULTS = List.of(
            new CategorySeed("tops", "Tops", "checkroom"),
            new CategorySeed("bottoms", "Bottoms", "straighten"),
            new CategorySeed("dresses", "Dresses", "dry_cleaning"),
            new CategorySeed("outerwear", "Outerwear", "ac_unit"),
            new CategorySeed("shoes", "Shoes", "hiking"),
            new CategorySeed("accessories", "Accessories", "watch"),
            new CategorySeed("activewear", "Activewear", "fitness_center"),
            new CategorySeed("formal", "Formal", "style"),
            new CategorySeed("swimwear", "Swimwear", "pool"));

    private static final List<CategorySeed> ACCESSORY_CATEGORY_DEFAULTS = List.of(
            new CategorySeed("bags", "Bags", "work"),
            new CategorySeed("jewelry", "Jewelry", "diamond"),
            new CategorySeed("watches", "Watches", "watch"),
            new CategorySeed("scarves", "Scarves", "checkroom"),
            new CategorySeed("belts", "Belts", "straighten"),
            new CategorySeed("hats", "Hats", "styler"),
            new CategorySeed("sunglasses", "Sunglasses", "visibility"),
            new CategorySeed("ties", "Ties", "style"),
            new CategorySeed("footwear", "Footwear", "hiking"));

    private static final List<String> OCCASION_DEFAULTS = List.of(
            "casual",
            "formal",
            "business",
            "partywear",
            "festive",
            "wedding",
            "travel",
            "athletic",
            "date night",
            "beach",
            "lounge",
            "streetwear");

    private final CatalogOptionRepository catalogOptionRepository;
    private volatile boolean defaultsSeeded;

    public CatalogOptionsService(CatalogOptionRepository catalogOptionRepository) {
        this.catalogOptionRepository = catalogOptionRepository;
    }

    public CatalogOptionsResponse getWardrobeOptions(String userId) {
        ensureDefaultsSeeded();
        return new CatalogOptionsResponse(
                listCategories(WARDROBE_CATEGORY_SCOPE, userId),
                listOccasions(userId));
    }

    public CatalogOptionsResponse getAccessoryOptions(String userId) {
        ensureDefaultsSeeded();
        return new CatalogOptionsResponse(
                listCategories(ACCESSORY_CATEGORY_SCOPE, userId),
                listOccasions(userId));
    }

    public CatalogCategoryOptionResponse addWardrobeCategory(String userId, String requestedLabel) {
        ensureDefaultsSeeded();
        return addCategory(WARDROBE_CATEGORY_SCOPE, userId, requestedLabel);
    }

    public CatalogCategoryOptionResponse addAccessoryCategory(String userId, String requestedLabel) {
        ensureDefaultsSeeded();
        return addCategory(ACCESSORY_CATEGORY_SCOPE, userId, requestedLabel);
    }

    public String addOccasion(String userId, String requestedValue) {
        ensureDefaultsSeeded();
        String normalizedValue = normalizeOccasionValue(requestedValue);
        String optionId = slugify(normalizedValue);
        Optional<CatalogOptionDocument> existing = findExistingOption(OCCASION_SCOPE, userId, optionId);
        if (existing.isPresent()) {
            return existing.get().getLabel();
        }

        Instant now = Instant.now();
        CatalogOptionDocument created = new CatalogOptionDocument();
        created.setScope(OCCASION_SCOPE);
        created.setUserId(userId);
        created.setOptionId(optionId);
        created.setLabel(normalizedValue);
        created.setIcon(null);
        created.setSystemDefault(false);
        created.setSortOrder(CUSTOM_SORT_ORDER);
        created.setCreatedAt(now);
        created.setUpdatedAt(now);
        CatalogOptionDocument saved = catalogOptionRepository.save(created);
        return saved.getLabel();
    }

    private CatalogCategoryOptionResponse addCategory(String scope, String userId, String requestedLabel) {
        String normalizedLabel = normalizeCategoryLabel(requestedLabel);
        String optionId = slugify(normalizedLabel);
        Optional<CatalogOptionDocument> existing = findExistingOption(scope, userId, optionId);
        if (existing.isPresent()) {
            return toCategoryOption(existing.get());
        }

        Instant now = Instant.now();
        CatalogOptionDocument created = new CatalogOptionDocument();
        created.setScope(scope);
        created.setUserId(userId);
        created.setOptionId(optionId);
        created.setLabel(normalizedLabel);
        created.setIcon(resolveCategoryIcon(normalizedLabel, scope));
        created.setSystemDefault(false);
        created.setSortOrder(CUSTOM_SORT_ORDER);
        created.setCreatedAt(now);
        created.setUpdatedAt(now);
        CatalogOptionDocument saved = catalogOptionRepository.save(created);
        return toCategoryOption(saved);
    }

    private Optional<CatalogOptionDocument> findExistingOption(String scope, String userId, String optionId) {
        Optional<CatalogOptionDocument> userSpecific = catalogOptionRepository.findByScopeAndUserIdAndOptionId(
                scope,
                userId,
                optionId);
        if (userSpecific.isPresent()) {
            return userSpecific;
        }
        return catalogOptionRepository.findByScopeAndUserIdAndOptionId(scope, SYSTEM_USER_ID, optionId);
    }

    private List<CatalogCategoryOptionResponse> listCategories(String scope, String userId) {
        List<CatalogOptionDocument> options = catalogOptionRepository
                .findAllByScopeAndUserIdInOrderBySortOrderAscLabelAsc(scope, List.of(SYSTEM_USER_ID, userId));
        Map<String, CatalogCategoryOptionResponse> deduplicatedByOptionId = new LinkedHashMap<>();
        for (CatalogOptionDocument option : options) {
            deduplicatedByOptionId.putIfAbsent(option.getOptionId(), toCategoryOption(option));
        }
        return deduplicatedByOptionId.values().stream().toList();
    }

    private List<String> listOccasions(String userId) {
        List<CatalogOptionDocument> options = catalogOptionRepository
                .findAllByScopeAndUserIdInOrderBySortOrderAscLabelAsc(OCCASION_SCOPE, List.of(SYSTEM_USER_ID, userId));
        Map<String, String> deduplicatedByOptionId = new LinkedHashMap<>();
        for (CatalogOptionDocument option : options) {
            deduplicatedByOptionId.putIfAbsent(option.getOptionId(), option.getLabel());
        }
        return deduplicatedByOptionId.values().stream().toList();
    }

    private CatalogCategoryOptionResponse toCategoryOption(CatalogOptionDocument option) {
        return new CatalogCategoryOptionResponse(
                option.getOptionId(),
                option.getLabel(),
                StringUtils.hasText(option.getIcon()) ? option.getIcon() : fallbackIcon(option.getScope()),
                !option.isSystemDefault());
    }

    private String normalizeCategoryLabel(String label) {
        if (!StringUtils.hasText(label)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category label is required");
        }
        String normalized = label.trim().replaceAll("\\s+", " ");
        if (normalized.length() > 60) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category label must be at most 60 chars");
        }
        return normalized;
    }

    private String normalizeOccasionValue(String value) {
        if (!StringUtils.hasText(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Occasion value is required");
        }
        String normalized = value.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        if (normalized.length() > 60) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Occasion value must be at most 60 chars");
        }
        return normalized;
    }

    private String slugify(String input) {
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        String slug = normalized
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        if (!StringUtils.hasText(slug)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not derive a valid option id");
        }
        return slug;
    }

    private String resolveCategoryIcon(String label, String scope) {
        String normalized = label.toLowerCase(Locale.ROOT);

        if (containsAny(normalized, "shirt", "tee", "t-shirt", "blouse", "top")) {
            return "checkroom";
        }
        if (containsAny(normalized, "pant", "trouser", "jean", "bottom", "skirt", "short")) {
            return "straighten";
        }
        if (containsAny(normalized, "dress", "gown")) {
            return "dry_cleaning";
        }
        if (containsAny(normalized, "jacket", "coat", "outer", "hoodie", "sweater")) {
            return "ac_unit";
        }
        if (containsAny(normalized, "shoe", "boot", "sandal", "slipper", "heel", "sneaker", "footwear")) {
            return "hiking";
        }
        if (containsAny(normalized, "active", "gym", "sport", "workout", "athletic")) {
            return "fitness_center";
        }
        if (containsAny(normalized, "formal", "suit", "blazer", "tie")) {
            return "style";
        }
        if (containsAny(normalized, "swim", "beach", "bikini")) {
            return "pool";
        }
        if (containsAny(normalized, "bag", "purse", "tote", "wallet", "backpack", "clutch")) {
            return "work";
        }
        if (containsAny(normalized, "jewel", "ring", "necklace", "earring", "bracelet")) {
            return "diamond";
        }
        if (containsAny(normalized, "watch")) {
            return "watch";
        }
        if (containsAny(normalized, "scarf")) {
            return "checkroom";
        }
        if (containsAny(normalized, "belt")) {
            return "straighten";
        }
        if (containsAny(normalized, "hat", "cap", "beanie")) {
            return "styler";
        }
        if (containsAny(normalized, "sunglass", "glasses", "shade")) {
            return "visibility";
        }
        return fallbackIcon(scope);
    }

    private String fallbackIcon(String scope) {
        return ACCESSORY_CATEGORY_SCOPE.equals(scope) ? DEFAULT_ACCESSORY_ICON : DEFAULT_WARDROBE_ICON;
    }

    private boolean containsAny(String input, String... keywords) {
        for (String keyword : keywords) {
            if (input.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private void seedCategoryDefaults(String scope, List<CategorySeed> seeds) {
        for (int index = 0; index < seeds.size(); index++) {
            CategorySeed seed = seeds.get(index);
            CatalogOptionDocument option = catalogOptionRepository
                    .findByScopeAndUserIdAndOptionId(scope, SYSTEM_USER_ID, seed.id())
                    .orElseGet(CatalogOptionDocument::new);
            option.setScope(scope);
            option.setUserId(SYSTEM_USER_ID);
            option.setOptionId(seed.id());
            option.setLabel(seed.label());
            option.setIcon(seed.icon());
            option.setSystemDefault(true);
            option.setSortOrder(index);
            if (option.getCreatedAt() == null) {
                option.setCreatedAt(Instant.now());
            }
            option.setUpdatedAt(Instant.now());
            catalogOptionRepository.save(option);
        }
    }

    private void seedOccasionDefaults(List<String> occasions) {
        for (int index = 0; index < occasions.size(); index++) {
            String value = occasions.get(index);
            String optionId = slugify(value);
            CatalogOptionDocument option = catalogOptionRepository
                    .findByScopeAndUserIdAndOptionId(OCCASION_SCOPE, SYSTEM_USER_ID, optionId)
                    .orElseGet(CatalogOptionDocument::new);
            option.setScope(OCCASION_SCOPE);
            option.setUserId(SYSTEM_USER_ID);
            option.setOptionId(optionId);
            option.setLabel(value);
            option.setIcon(null);
            option.setSystemDefault(true);
            option.setSortOrder(index);
            if (option.getCreatedAt() == null) {
                option.setCreatedAt(Instant.now());
            }
            option.setUpdatedAt(Instant.now());
            catalogOptionRepository.save(option);
        }
    }

    private record CategorySeed(String id, String label, String icon) {
    }

    private void ensureDefaultsSeeded() {
        if (defaultsSeeded) {
            return;
        }
        synchronized (this) {
            if (defaultsSeeded) {
                return;
            }
            seedCategoryDefaults(WARDROBE_CATEGORY_SCOPE, WARDROBE_CATEGORY_DEFAULTS);
            seedCategoryDefaults(ACCESSORY_CATEGORY_SCOPE, ACCESSORY_CATEGORY_DEFAULTS);
            seedOccasionDefaults(OCCASION_DEFAULTS);
            defaultsSeeded = true;
        }
    }
}
