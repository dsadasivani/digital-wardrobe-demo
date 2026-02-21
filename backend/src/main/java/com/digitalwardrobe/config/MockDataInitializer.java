package com.digitalwardrobe.config;

import com.digitalwardrobe.accessories.domain.AccessoryDocument;
import com.digitalwardrobe.accessories.repository.AccessoryRepository;
import com.digitalwardrobe.catalog.domain.CatalogOptionDocument;
import com.digitalwardrobe.catalog.repository.CatalogOptionRepository;
import com.digitalwardrobe.catalog.service.CatalogOptionsService;
import com.digitalwardrobe.outfits.domain.OutfitDocument;
import com.digitalwardrobe.outfits.domain.OutfitItemEmbed;
import com.digitalwardrobe.outfits.repository.OutfitRepository;
import com.digitalwardrobe.users.domain.UserDocument;
import com.digitalwardrobe.users.repository.UserRepository;
import com.digitalwardrobe.wardrobe.domain.WardrobeItemDocument;
import com.digitalwardrobe.wardrobe.repository.WardrobeItemRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MockDataInitializer {
    private static final Logger log = LoggerFactory.getLogger(MockDataInitializer.class);

    private static final String SEED_PREFIX = "seed-dw-v1-";
    private static final String NOTE_MARKER = "[mock-seed-dw-v1]";
    private static final String IMAGE_BASE_URL = "https://images.unsplash.com/photo-";
    private static final List<String> CLOTHING_IMAGE_IDS = List.of(
            "1651761179569-4ba2aa054997",
            "1563907207101-0e29be81feb7",
            "1762164130276-021d7c91cd89",
            "1564859228273-274232fdb516",
            "1560800125-e06c763fdc2c",
            "1761726098741-467a5c38bbe6",
            "1622051150293-3fc0097603dd",
            "1607430910739-be317f43e7e8",
            "1763673375433-e425a50a3464",
            "1684255872459-ab64b224478f",
            "1583846552345-d2aa9d764209",
            "1741817594197-6205d3be914b",
            "1677444576985-5df6a72ed901",
            "1567973246690-c53b46e75fa3");
    private static final List<String> ACCESSORY_IMAGE_IDS = List.of(
            "1768039397843-99607a4dc081",
            "1769240141559-ac3d6fa87ae8",
            "1657159810148-f6a1f3d74f7e",
            "1547227995-b9f2a0502c0b",
            "1618215650454-d03cac422c8f",
            "1579028284650-c584682e6aaa",
            "1586118757610-55ed22a00d2b",
            "1764799106291-be35d6e26d81");
    private static final List<String> OUTFIT_IMAGE_IDS = List.of(
            "1741817594197-6205d3be914b",
            "1763673375433-e425a50a3464",
            "1762164130276-021d7c91cd89",
            "1677444576985-5df6a72ed901",
            "1583846552345-d2aa9d764209",
            "1622051150293-3fc0097603dd");
    private static final String CUSTOM_WARDROBE_CATEGORY = "ethnic-wear";
    private static final String CUSTOM_ACCESSORY_CATEGORY = "festival-gear";
    private static final String CUSTOM_OUTFIT_CATEGORY = "street-luxe";

    @Value("${app.bootstrap.mock-data-enabled:false}")
    private boolean mockDataEnabled;

    @Value("${app.bootstrap.mock-data-user-email:testuser1@dw.com}")
    private String mockDataUserEmail;

    @Value("${app.bootstrap.mock-data-reset:false}")
    private boolean mockDataReset;

    @Bean
    CommandLineRunner seedMockData(
            UserRepository userRepository,
            WardrobeItemRepository wardrobeItemRepository,
            AccessoryRepository accessoryRepository,
            OutfitRepository outfitRepository,
            CatalogOptionRepository catalogOptionRepository) {
        return args -> {
            if (!mockDataEnabled) {
                return;
            }

            String targetEmail = mockDataUserEmail == null ? "" : mockDataUserEmail.trim().toLowerCase();
            if (targetEmail.isBlank()) {
                log.warn("Mock data bootstrap enabled but no user email is configured. Skipping.");
                return;
            }

            Optional<UserDocument> userOptional = userRepository.findByEmailIgnoreCase(targetEmail);
            if (userOptional.isEmpty()) {
                log.warn("Mock data bootstrap could not find user with email {}. Skipping.", targetEmail);
                return;
            }
            String userId = userOptional.get().getId();
            if (userId == null || userId.isBlank()) {
                log.warn("Mock data bootstrap found user {} but id is missing. Skipping.", targetEmail);
                return;
            }

            if (mockDataReset) {
                resetSeededData(userId, wardrobeItemRepository, accessoryRepository, outfitRepository,
                        catalogOptionRepository);
            }

            int wardrobeSeeded = seedWardrobeItems(userId, wardrobeItemRepository);
            int accessoriesSeeded = seedAccessories(userId, accessoryRepository);
            int outfitsSeeded = seedOutfits(userId, outfitRepository);
            int catalogOptionsSeeded = seedCatalogOptions(userId, catalogOptionRepository);

            log.info(
                    "Mock data bootstrap completed for {} (wardrobe={}, accessories={}, outfits={}, customCatalogOptions={})",
                    targetEmail,
                    wardrobeSeeded,
                    accessoriesSeeded,
                    outfitsSeeded,
                    catalogOptionsSeeded);
        };
    }

    private void resetSeededData(
            String userId,
            WardrobeItemRepository wardrobeItemRepository,
            AccessoryRepository accessoryRepository,
            OutfitRepository outfitRepository,
            CatalogOptionRepository catalogOptionRepository) {
        List<WardrobeItemDocument> wardrobeItems = wardrobeItemRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(item -> isSeededId(item.getId()))
                .toList();
        if (!wardrobeItems.isEmpty()) {
            wardrobeItemRepository.deleteAll(wardrobeItems);
        }

        List<AccessoryDocument> accessories = accessoryRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(item -> isSeededId(item.getId()))
                .toList();
        if (!accessories.isEmpty()) {
            accessoryRepository.deleteAll(accessories);
        }

        List<OutfitDocument> outfits = outfitRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(item -> isSeededId(item.getId()))
                .toList();
        if (!outfits.isEmpty()) {
            outfitRepository.deleteAll(outfits);
        }

        List<String> customOptionIds = List.of(
                CUSTOM_WARDROBE_CATEGORY,
                CUSTOM_ACCESSORY_CATEGORY,
                CUSTOM_OUTFIT_CATEGORY,
                "gallery-night",
                "monsoon-commute",
                "smart-casual-friday");
        for (String optionId : customOptionIds) {
            deleteCatalogOption(catalogOptionRepository, CatalogOptionsService.WARDROBE_CATEGORY_SCOPE, userId, optionId);
            deleteCatalogOption(catalogOptionRepository, CatalogOptionsService.ACCESSORY_CATEGORY_SCOPE, userId,
                    optionId);
            deleteCatalogOption(catalogOptionRepository, CatalogOptionsService.OUTFIT_CATEGORY_SCOPE, userId, optionId);
            deleteCatalogOption(catalogOptionRepository, CatalogOptionsService.OCCASION_SCOPE, userId, optionId);
        }

        log.info(
                "Mock data reset completed for user {} (wardrobeRemoved={}, accessoriesRemoved={}, outfitsRemoved={})",
                userId,
                wardrobeItems.size(),
                accessories.size(),
                outfits.size());
    }

    private int seedWardrobeItems(String userId, WardrobeItemRepository wardrobeItemRepository) {
        Instant now = Instant.now();
        List<WardrobeSeed> seeds = List.of(
                new WardrobeSeed("w-01", "Classic White Oxford Shirt", "tops", "white", "#F6F6F2", "M", "Uniqlo",
                        "business", 49.90, 720, true, List.of("capsule", "office"), 18, 2, 220, 3),
                new WardrobeSeed("w-02", "Navy Merino Crewneck", "tops", "navy", "#1F2A44", "M", "Everlane",
                        "casual", 79.00, 650, false, List.of("winter", "knit"), 6, 7, 205, 2),
                new WardrobeSeed("w-03", "Charcoal Tailored Trousers", "bottoms", "charcoal", "#3B3E45", "32", "COS",
                        "business", 89.00, 700, true, List.of("formal", "office"), 14, 5, 198, 2),
                new WardrobeSeed("w-04", "Light Wash Denim Jeans", "bottoms", "light blue", "#7CA7C9", "32", "Levi's",
                        "casual", 69.99, 520, false, List.of("denim", "weekend"), 4, 21, 176, 3),
                new WardrobeSeed("w-05", "Black Midi Dress", "dresses", "black", "#111111", "S", "Zara", "partywear",
                        119.00, 410, true, List.of("evening", "party"), 2, 34, 162, 1),
                new WardrobeSeed("w-06", "Olive Utility Jacket", "outerwear", "olive", "#5B6B3C", "M", "Mango",
                        "casual", 139.00, 300, false, List.of("layer", "autumn"), 0, null, 150, 2),
                new WardrobeSeed("w-07", "Camel Wool Coat", "outerwear", "camel", "#B08A5A", "M", "Massimo Dutti",
                        "formal", 289.00, 860, false, List.of("winter", "outerwear"), 9, 16, 142, 2),
                new WardrobeSeed("w-08", "White Sneakers", "shoes", "white", "#F1F1EF", "9", "Adidas", "casual",
                        99.00, 450, true, List.of("daily", "comfort"), 22, 1, 130, 3),
                new WardrobeSeed("w-09", "Tan Loafers", "shoes", "tan", "#AA8354", "9", "Clarks", "business", 110.00,
                        390, false, List.of("smart", "work"), 3, 55, 120, 2),
                new WardrobeSeed("w-10", "Silk Blouse Emerald", "tops", "emerald", "#0B7A61", "S", "Reformation",
                        "date night", 129.00, 260, false, List.of("statement", "silk"), 1, 80, 110, 2),
                new WardrobeSeed("w-11", "Running Leggings", "activewear", "black", "#202020", "M", "Nike",
                        "athletic", 59.00, 560, false, List.of("training", "workout"), 12, 4, 95, 1),
                new WardrobeSeed("w-12", "Sports Tank Coral", "activewear", "coral", "#FF6B6B", "M", "Lululemon",
                        "athletic", 45.00, 230, false, List.of("gym", "summer"), 7, 10, 82, 1),
                new WardrobeSeed("w-13", "Formal Blazer Midnight", "formal", "midnight blue", "#1C233A", "M",
                        "Hugo Boss", "business", 299.00, 920, true, List.of("tailored", "formal"), 5, 14, 74, 2),
                new WardrobeSeed("w-14", "Swim Shorts Teal", "swimwear", "teal", "#0A8A8A", "M", "Speedo", "beach",
                        35.00, 340, false, List.of("vacation", "summer"), 0, null, 60, 2),
                new WardrobeSeed("w-15", "Linen Shirt Sand", "tops", "sand", "#D2B48C", "L", "H&M", "travel", 39.00,
                        180, false, List.of("travel", "breathable"), 8, 12, 45, 3),
                new WardrobeSeed("w-16", "Pleated Skirt Plum", "bottoms", "plum", "#6D3E7B", "S", "Aritzia",
                        "partywear", 72.00, 250, false, List.of("texture", "dressy"), 2, 30, 35, 1),
                new WardrobeSeed("w-17", "Embroidered Kurta", CUSTOM_WARDROBE_CATEGORY, "maroon", "#7A1F35", "M",
                        "Fabindia", "festive", 95.00, 200, true, List.of("traditional", "festive"), 1, 62, 21, 2),
                new WardrobeSeed("w-18", "Rain Shell Neon", "outerwear", "neon green", "#B7FF00", "L", null,
                        "travel", null, 90, false, List.of("rain", "commute"), 0, null, 7, 1),
                new WardrobeSeed("w-19", "Striped Resort Shirt", "tops", "blue white", "#9CB7D3", "M", "Tommy Hilfiger",
                        "travel", 58.00, 165, false, List.of("resort", "vacation"), 3, 44, 18, 2),
                new WardrobeSeed("w-20", "Cropped Denim Jacket", "outerwear", "blue", "#5E7FA6", "S", "Levi's",
                        "casual", 84.00, 280, true, List.of("layering", "denim"), 9, 6, 26, 3),
                new WardrobeSeed("w-21", "Wide Leg Trousers", "bottoms", "stone", "#C8BBAA", "30", "Zara",
                        "business", 74.00, 230, false, List.of("tailored", "office"), 5, 20, 33, 2),
                new WardrobeSeed("w-22", "Knitted Polo", "tops", "olive", "#66724E", "M", "Massimo Dutti",
                        "smart casual", 65.00, 195, false, List.of("smart", "weekend"), 4, 23, 16, 2),
                new WardrobeSeed("w-23", "Pleated Occasion Dress", "dresses", "lavender", "#9E8FB8", "S", "Mango",
                        "wedding", 156.00, 300, true, List.of("occasion", "dressy"), 2, 52, 29, 3),
                new WardrobeSeed("w-24", "Trail Running Shorts", "activewear", "graphite", "#3F434A", "M", "Nike",
                        "athletic", 42.00, 140, false, List.of("run", "training"), 10, 3, 14, 1),
                new WardrobeSeed("w-25", "Canvas Slip-ons", "shoes", "beige", "#D6C5A8", "9", "Vans",
                        "casual", 59.00, 210, false, List.of("daily", "comfort"), 6, 8, 12, 2),
                new WardrobeSeed("w-26", "Sequin Party Top", "formal", "silver", "#C4C8CE", "S", "H&M",
                        "partywear", 49.00, 110, true, List.of("party", "night"), 1, 39, 9, 2));

        List<WardrobeItemDocument> documents = seeds.stream().map(seed -> toWardrobeDocument(userId, seed, now)).toList();
        wardrobeItemRepository.saveAll(documents);
        return documents.size();
    }

    private int seedAccessories(String userId, AccessoryRepository accessoryRepository) {
        Instant now = Instant.now();
        List<AccessorySeed> seeds = List.of(
                new AccessorySeed("a-01", "Rose Gold Watch", "watches", "rose gold", "#B76E79", "Fossil", 149.00,
                        "business", 800, true, List.of("signature", "daily"), 30, 1, 210, 2),
                new AccessorySeed("a-02", "Black Leather Belt", "belts", "black", "#151515", "Allen Solly", 35.00,
                        "business", 500, false, List.of("work", "minimal"), 16, 4, 190, 1),
                new AccessorySeed("a-03", "Silver Hoop Earrings", "jewelry", "silver", "#BFC5CC", "Mejuri", 68.00,
                        "partywear", 420, true, List.of("statement", "party"), 2, 24, 170, 2),
                new AccessorySeed("a-04", "Oversized Sunglasses", "sunglasses", "brown", "#6B4F3A", "Ray-Ban", 129.00,
                        "travel", 300, false, List.of("summer", "beach"), 1, 48, 148, 1),
                new AccessorySeed("a-05", "Canvas Tote Bag", "bags", "cream", "#E8DDC8", "Baggu", 45.00, "casual",
                        240, false, List.of("weekend", "market"), 4, 14, 120, 2),
                new AccessorySeed("a-06", "Silk Dot Scarf", "scarves", "navy", "#28324B", "Ted Baker", 59.00, "formal",
                        210, false, List.of("layering", "winter"), 0, null, 95, 1),
                new AccessorySeed("a-07", "Navy Tie", "ties", "navy", "#1E2D55", "Brooks Brothers", 42.00, "business",
                        620, false, List.of("office", "formal"), 7, 11, 86, 1),
                new AccessorySeed("a-08", "Bucket Hat", "hats", "khaki", "#8A7F64", "Uniqlo", 24.00, "travel", 190,
                        false, List.of("sun", "streetwear"), 3, 30, 74, 1),
                new AccessorySeed("a-09", "Travel Backpack", "bags", "olive", "#4E5F3A", "Herschel", 89.00, "travel",
                        160, true, List.of("travel", "carry-on"), 10, 6, 61, 2),
                new AccessorySeed("a-10", "Minimal Anklet", "jewelry", "gold", "#D4AF37", null, null, "beach", 145,
                        false, List.of("summer", "minimal"), 0, null, 52, 1),
                new AccessorySeed("a-11", "Statement Necklace", "jewelry", "emerald", "#0D6A58", "Swarovski", 210.00,
                        "partywear", 510, true, List.of("event", "glam"), 5, 17, 39, 2),
                new AccessorySeed("a-12", "Festival Wristband", CUSTOM_ACCESSORY_CATEGORY, "multicolor", "#FF8C42",
                        "Custom", 15.00, "festive", 80, false, List.of("festival", "custom"), 1, 27, 14, 1),
                new AccessorySeed("a-13", "Pearl Hair Clip", "jewelry", "pearl", "#E4DFD3", "Accessorize", 18.00,
                        "casual", 120, false, List.of("hair", "minimal"), 2, 40, 11, 1),
                new AccessorySeed("a-14", "Crossbody Saddle Bag", "bags", "tan", "#A47A55", "Coach", 195.00,
                        "casual", 365, true, List.of("bag", "daily"), 7, 9, 22, 2),
                new AccessorySeed("a-15", "Aviator Sunglasses", "sunglasses", "gold", "#C59E52", "Ray-Ban", 148.00,
                        "travel", 260, false, List.of("sun", "vacation"), 4, 25, 20, 1),
                new AccessorySeed("a-16", "Wool Beanie", "hats", "charcoal", "#4A4D53", "Uniqlo", 19.00,
                        "winter", 200, false, List.of("winter", "cozy"), 5, 15, 19, 1),
                new AccessorySeed("a-17", "Layered Chain Bracelet", "jewelry", "silver", "#B5BDC7", "Pandora", 72.00,
                        "partywear", 170, true, List.of("bracelet", "stack"), 3, 28, 13, 2),
                new AccessorySeed("a-18", "Leather Laptop Tote", "bags", "black", "#1E1E1E", "Charles & Keith", 125.00,
                        "business", 150, false, List.of("office", "work"), 8, 5, 8, 2));

        List<AccessoryDocument> documents = seeds.stream().map(seed -> toAccessoryDocument(userId, seed, now)).toList();
        accessoryRepository.saveAll(documents);
        return documents.size();
    }

    private int seedOutfits(String userId, OutfitRepository outfitRepository) {
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<OutfitSeed> seeds = List.of(
                new OutfitSeed("o-01", "Boardroom Monday", "work", List.of(
                        new OutfitItemSeed(seedId("w-01"), "wardrobe", 0.5, 0.2, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-03"), "wardrobe", 0.5, 0.55, 1.0, 0, 2),
                        new OutfitItemSeed(seedId("w-13"), "wardrobe", 0.5, 0.18, 1.0, 0, 3),
                        new OutfitItemSeed(seedId("a-01"), "accessory", 0.74, 0.16, 0.42, -12, 4)), "business",
                        "winter", 5, true, 7, 1, 140, List.of(2, 14), "o01",
                        NOTE_MARKER + " power look"),
                new OutfitSeed("o-02", "Weekend Brunch Denim", "casual", List.of(
                        new OutfitItemSeed(seedId("w-15"), "wardrobe", 0.5, 0.2, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-04"), "wardrobe", 0.5, 0.54, 1.0, 0, 2),
                        new OutfitItemSeed(seedId("w-08"), "wardrobe", 0.5, 0.82, 0.84, 0, 3),
                        new OutfitItemSeed(seedId("a-05"), "accessory", 0.78, 0.6, 0.5, 3, 4)), "casual",
                        "spring", 4, false, 2, 19, 130, List.of(1), "o02",
                        NOTE_MARKER + " weekend mix"),
                new OutfitSeed("o-03", "Date Night Classic", "formal", List.of(
                        new OutfitItemSeed(seedId("w-10"), "wardrobe", 0.5, 0.22, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-03"), "wardrobe", 0.5, 0.54, 1.0, 0, 2),
                        new OutfitItemSeed(seedId("w-09"), "wardrobe", 0.5, 0.82, 0.82, 0, 3),
                        new OutfitItemSeed(seedId("a-11"), "accessory", 0.71, 0.15, 0.46, 8, 4)), "date night",
                        "winter", 4, true, 3, 11, 120, List.of(30, 60), "o03",
                        NOTE_MARKER + " date look"),
                new OutfitSeed("o-04", "Gym Sprint Set", "casual", List.of(
                        new OutfitItemSeed(seedId("w-11"), "wardrobe", 0.5, 0.22, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-12"), "wardrobe", 0.5, 0.18, 1.0, 0, 2),
                        new OutfitItemSeed(seedId("w-08"), "wardrobe", 0.5, 0.82, 0.82, 0, 3),
                        new OutfitItemSeed(seedId("a-06"), "accessory", 0.77, 0.24, 0.38, 10, 4)), "athletic",
                        "summer", 3, false, 11, 2, 110, List.of(), "o04",
                        NOTE_MARKER + " active set"),
                new OutfitSeed("o-05", "Beach Day Pack", "vacation", List.of(
                        new OutfitItemSeed(seedId("w-14"), "wardrobe", 0.5, 0.2, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-08"), "wardrobe", 0.5, 0.82, 0.8, 0, 2),
                        new OutfitItemSeed(seedId("a-04"), "accessory", 0.24, 0.14, 0.42, -5, 3),
                        new OutfitItemSeed(seedId("a-09"), "accessory", 0.72, 0.6, 0.52, 6, 4)), "beach",
                        "summer", 4, false, 0, null, 100, List.of(120), "o05",
                        NOTE_MARKER + " future planned"),
                new OutfitSeed("o-06", "Monsoon Commute", "work", List.of(
                        new OutfitItemSeed(seedId("w-18"), "wardrobe", 0.5, 0.22, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-04"), "wardrobe", 0.5, 0.53, 1.0, 0, 2),
                        new OutfitItemSeed(seedId("w-08"), "wardrobe", 0.5, 0.82, 0.82, 0, 3),
                        new OutfitItemSeed(seedId("a-09"), "accessory", 0.75, 0.58, 0.5, 4, 4)), "travel",
                        "monsoon", 3, false, 1, 18, 85, List.of(-1, 7), "o06",
                        NOTE_MARKER + " scheduler due date"),
                new OutfitSeed("o-07", "Wedding Guest Emerald", "formal", List.of(
                        new OutfitItemSeed(seedId("w-10"), "wardrobe", 0.5, 0.22, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-16"), "wardrobe", 0.5, 0.56, 1.0, 0, 2),
                        new OutfitItemSeed(seedId("w-09"), "wardrobe", 0.5, 0.82, 0.82, 0, 3),
                        new OutfitItemSeed(seedId("a-03"), "accessory", 0.24, 0.14, 0.45, 0, 4)), "wedding",
                        "spring", 5, true, 4, 30, 72, List.of(60), "o07",
                        NOTE_MARKER + " formal favorite"),
                new OutfitSeed("o-08", "Ethnic Festive Evening", "party", List.of(
                        new OutfitItemSeed(seedId("w-17"), "wardrobe", 0.5, 0.24, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-09"), "wardrobe", 0.5, 0.82, 0.82, 0, 2),
                        new OutfitItemSeed(seedId("a-12"), "accessory", 0.76, 0.2, 0.4, 12, 3)), "festive",
                        "autumn", 4, false, 2, 45, 60, List.of(30), "o08",
                        NOTE_MARKER + " custom categories"),
                new OutfitSeed("o-09", "Capsule Minimalist", "casual", List.of(
                        new OutfitItemSeed(seedId("w-02"), "wardrobe", 0.5, 0.22, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-03"), "wardrobe", 0.5, 0.55, 1.0, 0, 2),
                        new OutfitItemSeed(seedId("w-08"), "wardrobe", 0.5, 0.82, 0.82, 0, 3),
                        new OutfitItemSeed(seedId("a-02"), "accessory", 0.5, 0.56, 0.42, 0, 4)), "casual",
                        "all-season", 2, false, 14, 4, 48, List.of(), "o09",
                        NOTE_MARKER + " high worn"),
                new OutfitSeed("o-10", "Travel Airport Uniform", "vacation", List.of(
                        new OutfitItemSeed(seedId("w-15"), "wardrobe", 0.5, 0.23, 1.0, 0, 1),
                        new OutfitItemSeed(seedId("w-04"), "wardrobe", 0.5, 0.55, 1.0, 0, 2),
                        new OutfitItemSeed(seedId("w-08"), "wardrobe", 0.5, 0.82, 0.82, 0, 3),
                        new OutfitItemSeed(seedId("a-09"), "accessory", 0.77, 0.58, 0.5, 6, 4)), "travel",
                        "all-season", 4, true, 6, 8, 35, List.of(0, 2), "o10",
                        NOTE_MARKER + " planned today"),
                new OutfitSeed("o-11", "Archived Missing Piece Test", "casual", List.of(
                        new OutfitItemSeed("seed-dw-v1-w-missing-01", "wardrobe", 0.5, 0.22, 1.0, 0, 1),
                        new OutfitItemSeed("seed-dw-v1-a-missing-01", "accessory", 0.75, 0.2, 0.44, 0, 2),
                        new OutfitItemSeed(seedId("w-01"), "wardrobe", 0.5, 0.55, 1.0, 0, 3)), "casual",
                        "spring", 1, false, 1, 70, 24, List.of(7), "o11",
                        NOTE_MARKER + " missing items UI"),
                new OutfitSeed("o-12", "Accessory Only Experiment", CUSTOM_OUTFIT_CATEGORY, List.of(
                        new OutfitItemSeed(seedId("a-01"), "accessory", 0.5, 0.2, 0.58, 0, 1),
                        new OutfitItemSeed(seedId("a-04"), "accessory", 0.25, 0.36, 0.52, -4, 2),
                        new OutfitItemSeed(seedId("a-03"), "accessory", 0.74, 0.34, 0.5, 8, 3)), "partywear",
                        "summer", 3, false, 0, null, 10, List.of(30), "o12",
                        NOTE_MARKER + " accessory-only outfit"));

        List<OutfitDocument> documents = seeds.stream().map(seed -> toOutfitDocument(userId, seed, now, today)).toList();
        outfitRepository.saveAll(documents);
        return documents.size();
    }

    private int seedCatalogOptions(String userId, CatalogOptionRepository catalogOptionRepository) {
        int inserted = 0;
        inserted += upsertCategoryOption(catalogOptionRepository, CatalogOptionsService.WARDROBE_CATEGORY_SCOPE, userId,
                CUSTOM_WARDROBE_CATEGORY, "Ethnic Wear", "style", 10_100) ? 1 : 0;
        inserted += upsertCategoryOption(catalogOptionRepository, CatalogOptionsService.ACCESSORY_CATEGORY_SCOPE, userId,
                CUSTOM_ACCESSORY_CATEGORY, "Festival Gear", "celebration", 10_101) ? 1 : 0;
        inserted += upsertCategoryOption(catalogOptionRepository, CatalogOptionsService.OUTFIT_CATEGORY_SCOPE, userId,
                CUSTOM_OUTFIT_CATEGORY, "Street Luxe", "auto_awesome", 10_102) ? 1 : 0;
        inserted += upsertOccasionOption(catalogOptionRepository, userId, "gallery-night", "gallery night", 10_103)
                ? 1 : 0;
        inserted += upsertOccasionOption(catalogOptionRepository, userId, "monsoon-commute", "monsoon commute", 10_104)
                ? 1 : 0;
        inserted += upsertOccasionOption(catalogOptionRepository, userId, "smart-casual-friday",
                "smart casual friday", 10_105) ? 1 : 0;
        return inserted;
    }

    private WardrobeItemDocument toWardrobeDocument(String userId, WardrobeSeed seed, Instant now) {
        WardrobeItemDocument document = new WardrobeItemDocument();
        Instant createdAt = now.minus(seed.createdDaysAgo(), ChronoUnit.DAYS);
        List<String> gallery = gallery(seed.id(), seed.imageCount());

        document.setId(seedId(seed.id()));
        document.setUserId(userId);
        document.setName(seed.name());
        document.setCategory(seed.category());
        document.setColor(seed.color());
        document.setColorHex(seed.colorHex());
        document.setSize(seed.size());
        document.setBrand(seed.brand());
        document.setOccasion(seed.occasion());
        document.setPrice(toBigDecimal(seed.price()));
        document.setPurchaseDate(now.minus(seed.purchaseDaysAgo(), ChronoUnit.DAYS));
        document.setImageUrls(gallery);
        document.setPrimaryImageUrl(gallery.getFirst());
        document.setImageUrl(gallery.getFirst());
        document.setImagePaths(List.of());
        document.setPrimaryImagePath(null);
        document.setFavorite(seed.favorite());
        document.setTags(seed.tags());
        document.setNotes(NOTE_MARKER + " " + seed.tags().getFirst());
        document.setWorn(seed.worn());
        document.setLastWorn(seed.lastWornDaysAgo() == null ? null : now.minus(seed.lastWornDaysAgo(), ChronoUnit.DAYS));
        document.setCreatedAt(createdAt);
        document.setUpdatedAt(createdAt.plus(2, ChronoUnit.HOURS));
        return document;
    }

    private AccessoryDocument toAccessoryDocument(String userId, AccessorySeed seed, Instant now) {
        AccessoryDocument document = new AccessoryDocument();
        Instant createdAt = now.minus(seed.createdDaysAgo(), ChronoUnit.DAYS);
        List<String> gallery = gallery(seed.id(), seed.imageCount());

        document.setId(seedId(seed.id()));
        document.setUserId(userId);
        document.setName(seed.name());
        document.setCategory(seed.category());
        document.setColor(seed.color());
        document.setColorHex(seed.colorHex());
        document.setBrand(seed.brand());
        document.setPrice(toBigDecimal(seed.price()));
        document.setOccasion(seed.occasion());
        document.setPurchaseDate(now.minus(seed.purchaseDaysAgo(), ChronoUnit.DAYS));
        document.setImageUrls(gallery);
        document.setPrimaryImageUrl(gallery.getFirst());
        document.setImageUrl(gallery.getFirst());
        document.setImagePaths(List.of());
        document.setPrimaryImagePath(null);
        document.setFavorite(seed.favorite());
        document.setTags(seed.tags());
        document.setWorn(seed.worn());
        document.setLastWorn(seed.lastWornDaysAgo() == null ? null : now.minus(seed.lastWornDaysAgo(), ChronoUnit.DAYS));
        document.setCreatedAt(createdAt);
        document.setUpdatedAt(createdAt.plus(2, ChronoUnit.HOURS));
        return document;
    }

    private OutfitDocument toOutfitDocument(String userId, OutfitSeed seed, Instant now, LocalDate today) {
        OutfitDocument document = new OutfitDocument();
        Instant createdAt = now.minus(seed.createdDaysAgo(), ChronoUnit.DAYS);
        List<String> plannedDates = seed.plannedDayOffsets().stream()
                .map(offset -> today.plusDays(offset).toString())
                .toList();
        List<OutfitItemEmbed> items = seed.items().stream()
                .map(item -> new OutfitItemEmbed(
                        item.itemId(),
                        item.type(),
                        item.positionX(),
                        item.positionY(),
                        item.scale(),
                        item.rotation(),
                        item.zIndex()))
                .toList();

        document.setId(seedId(seed.id()));
        document.setUserId(userId);
        document.setName(seed.name());
        document.setCategory(seed.category());
        document.setItems(items);
        document.setOccasion(seed.occasion());
        document.setSeason(seed.season());
        document.setRating(seed.rating());
        document.setFavorite(seed.favorite());
        document.setNotes(seed.notes());
        document.setImageUrl(image(seed.imageSeed()));
        document.setWorn(seed.worn());
        document.setLastWorn(seed.lastWornDaysAgo() == null ? null : now.minus(seed.lastWornDaysAgo(), ChronoUnit.DAYS));
        document.setPlannedDates(plannedDates);
        document.setProcessedPlannedDates(List.of());
        document.setCreatedAt(createdAt);
        document.setUpdatedAt(createdAt.plus(2, ChronoUnit.HOURS));
        return document;
    }

    private boolean upsertCategoryOption(
            CatalogOptionRepository catalogOptionRepository,
            String scope,
            String userId,
            String optionId,
            String label,
            String icon,
            int sortOrder) {
        Optional<CatalogOptionDocument> existing = catalogOptionRepository.findByScopeAndUserIdAndOptionId(
                scope,
                userId,
                optionId);
        CatalogOptionDocument option = existing.orElseGet(CatalogOptionDocument::new);
        Instant now = Instant.now();
        option.setScope(scope);
        option.setUserId(userId);
        option.setOptionId(optionId);
        option.setLabel(label);
        option.setIcon(icon);
        option.setSortOrder(sortOrder);
        option.setSystemDefault(false);
        if (option.getCreatedAt() == null) {
            option.setCreatedAt(now);
        }
        option.setUpdatedAt(now);
        catalogOptionRepository.save(option);
        return existing.isEmpty();
    }

    private boolean upsertOccasionOption(
            CatalogOptionRepository catalogOptionRepository,
            String userId,
            String optionId,
            String label,
            int sortOrder) {
        Optional<CatalogOptionDocument> existing = catalogOptionRepository.findByScopeAndUserIdAndOptionId(
                CatalogOptionsService.OCCASION_SCOPE,
                userId,
                optionId);
        CatalogOptionDocument option = existing.orElseGet(CatalogOptionDocument::new);
        Instant now = Instant.now();
        option.setScope(CatalogOptionsService.OCCASION_SCOPE);
        option.setUserId(userId);
        option.setOptionId(optionId);
        option.setLabel(label);
        option.setIcon(null);
        option.setSortOrder(sortOrder);
        option.setSystemDefault(false);
        if (option.getCreatedAt() == null) {
            option.setCreatedAt(now);
        }
        option.setUpdatedAt(now);
        catalogOptionRepository.save(option);
        return existing.isEmpty();
    }

    private void deleteCatalogOption(
            CatalogOptionRepository catalogOptionRepository,
            String scope,
            String userId,
            String optionId) {
        catalogOptionRepository.findByScopeAndUserIdAndOptionId(scope, userId, optionId)
                .ifPresent(catalogOptionRepository::delete);
    }

    private String seedId(String idSuffix) {
        return SEED_PREFIX + idSuffix;
    }

    private boolean isSeededId(String id) {
        return id != null && id.startsWith(SEED_PREFIX);
    }

    private String image(String seed) {
        String normalizedSeed = seed == null ? "" : seed.trim().toLowerCase();
        List<String> pool = CLOTHING_IMAGE_IDS;
        if (normalizedSeed.startsWith("a-")) {
            pool = ACCESSORY_IMAGE_IDS;
        } else if (normalizedSeed.startsWith("o")) {
            pool = OUTFIT_IMAGE_IDS;
        }
        long hash = Integer.toUnsignedLong(normalizedSeed.hashCode());
        int index = (int) (hash % pool.size());
        return unsplashUrl(pool.get(index));
    }

    private String unsplashUrl(String photoId) {
        return IMAGE_BASE_URL + photoId + "?auto=format&fit=crop&w=900&q=80";
    }

    private List<String> gallery(String seedPrefix, int count) {
        List<String> urls = new ArrayList<>();
        for (int index = 1; index <= count; index++) {
            urls.add(image(seedPrefix + "-" + index));
        }
        return urls;
    }

    private BigDecimal toBigDecimal(Double value) {
        if (value == null) {
            return null;
        }
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    private record WardrobeSeed(
            String id,
            String name,
            String category,
            String color,
            String colorHex,
            String size,
            String brand,
            String occasion,
            Double price,
            int purchaseDaysAgo,
            boolean favorite,
            List<String> tags,
            int worn,
            Integer lastWornDaysAgo,
            int createdDaysAgo,
            int imageCount) {
    }

    private record AccessorySeed(
            String id,
            String name,
            String category,
            String color,
            String colorHex,
            String brand,
            Double price,
            String occasion,
            int purchaseDaysAgo,
            boolean favorite,
            List<String> tags,
            int worn,
            Integer lastWornDaysAgo,
            int createdDaysAgo,
            int imageCount) {
    }

    private record OutfitSeed(
            String id,
            String name,
            String category,
            List<OutfitItemSeed> items,
            String occasion,
            String season,
            Integer rating,
            boolean favorite,
            int worn,
            Integer lastWornDaysAgo,
            int createdDaysAgo,
            List<Integer> plannedDayOffsets,
            String imageSeed,
            String notes) {
    }

    private record OutfitItemSeed(
            String itemId,
            String type,
            double positionX,
            double positionY,
            double scale,
            double rotation,
            int zIndex) {
    }
}
