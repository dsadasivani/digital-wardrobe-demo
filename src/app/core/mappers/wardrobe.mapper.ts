import type { WardrobeItem, WardrobeCategory } from '../models';
import type {
    WardrobeItemDto,
    CreateWardrobeItemRequestDto,
    UpdateWardrobeItemRequestDto,
} from '../dto/wardrobe.dto';

// ── Response → Model ──────────────────────────────────────────

export function mapWardrobeItemDtoToModel(dto: WardrobeItemDto): WardrobeItem {
    const imageUrls = normalizeImageUrls(dto.imageUrls, dto.imageUrl);
    const primaryImageUrl = normalizePrimaryImageUrl(dto.primaryImageUrl, imageUrls, dto.imageUrl);
    return {
        id: dto.id,
        name: dto.name,
        category: dto.category as WardrobeCategory,
        color: dto.color,
        colorHex: dto.colorHex,
        size: dto.size ?? undefined,
        brand: dto.brand ?? undefined,
        occasion: dto.occasion ?? undefined,
        price: dto.price ?? undefined,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        imageUrl: primaryImageUrl,
        imageUrls: prioritizePrimaryImage(imageUrls, primaryImageUrl),
        primaryImageUrl,
        worn: dto.worn,
        lastWorn: dto.lastWorn ? new Date(dto.lastWorn) : undefined,
        favorite: dto.favorite,
        tags: dto.tags,
        notes: dto.notes ?? undefined,
        createdAt: new Date(dto.createdAt),
    };
}

// ── Model → Create Request ────────────────────────────────────

export function mapWardrobeItemToCreateDto(
    item: Partial<WardrobeItem> & Pick<WardrobeItem, 'name' | 'category' | 'color' | 'colorHex' | 'imageUrl' | 'favorite' | 'tags'>
): CreateWardrobeItemRequestDto {
    const imageUrls = normalizeImageUrls(item.imageUrls, item.imageUrl);
    const primaryImageUrl = normalizePrimaryImageUrl(item.primaryImageUrl, imageUrls, item.imageUrl);
    return {
        name: item.name,
        category: item.category,
        color: item.color,
        colorHex: item.colorHex,
        size: item.size,
        brand: item.brand,
        occasion: item.occasion,
        price: item.price,
        purchaseDate: item.purchaseDate?.toISOString(),
        imageUrl: primaryImageUrl,
        imageUrls: prioritizePrimaryImage(imageUrls, primaryImageUrl),
        primaryImageUrl,
        favorite: item.favorite,
        tags: item.tags,
        notes: item.notes,
    };
}

// ── Model → Update Request ────────────────────────────────────

export function mapWardrobeItemToUpdateDto(
    changes: Partial<WardrobeItem>
): UpdateWardrobeItemRequestDto {
    const dto: UpdateWardrobeItemRequestDto = {};
    if (changes.name !== undefined) dto.name = changes.name;
    if (changes.category !== undefined) dto.category = changes.category;
    if (changes.color !== undefined) dto.color = changes.color;
    if (changes.colorHex !== undefined) dto.colorHex = changes.colorHex;
    if (changes.size !== undefined) dto.size = changes.size;
    if (changes.brand !== undefined) dto.brand = changes.brand;
    if (changes.occasion !== undefined) dto.occasion = changes.occasion;
    if (changes.price !== undefined) dto.price = changes.price;
    if (changes.purchaseDate !== undefined) dto.purchaseDate = changes.purchaseDate?.toISOString();
    if (changes.imageUrl !== undefined) {
        dto.imageUrl = changes.imageUrl;
        dto.primaryImageUrl = changes.imageUrl;
    }
    if (changes.primaryImageUrl !== undefined) {
        dto.primaryImageUrl = changes.primaryImageUrl;
        dto.imageUrl = changes.primaryImageUrl;
    }
    if (changes.imageUrls !== undefined) {
        const imageUrls = normalizeImageUrls(changes.imageUrls, changes.imageUrl ?? changes.primaryImageUrl);
        const primaryImageUrl = normalizePrimaryImageUrl(changes.primaryImageUrl, imageUrls, changes.imageUrl);
        dto.imageUrls = prioritizePrimaryImage(imageUrls, primaryImageUrl);
        dto.primaryImageUrl = primaryImageUrl;
        dto.imageUrl = primaryImageUrl;
    }
    if (changes.worn !== undefined) dto.worn = changes.worn;
    if (changes.lastWorn !== undefined) dto.lastWorn = changes.lastWorn?.toISOString();
    if (changes.favorite !== undefined) dto.favorite = changes.favorite;
    if (changes.tags !== undefined) dto.tags = changes.tags;
    if (changes.notes !== undefined) dto.notes = changes.notes;
    return dto;
}

function normalizeImageUrls(
    imageUrls: string[] | undefined,
    fallback: string | undefined
): string[] {
    const normalized = (imageUrls ?? []).map(url => url.trim()).filter(Boolean);
    if (fallback && !normalized.length) {
        normalized.push(fallback.trim());
    }
    return normalized;
}

function normalizePrimaryImageUrl(
    primaryImageUrl: string | undefined,
    imageUrls: string[],
    fallbackImageUrl: string | undefined
): string {
    const normalizedPrimary = primaryImageUrl?.trim();
    if (normalizedPrimary && imageUrls.includes(normalizedPrimary)) {
        return normalizedPrimary;
    }
    if (normalizedPrimary && !imageUrls.length) {
        return normalizedPrimary;
    }
    return imageUrls[0] ?? fallbackImageUrl?.trim() ?? '';
}

function prioritizePrimaryImage(imageUrls: string[], primaryImageUrl: string): string[] {
    if (!imageUrls.length) {
        return primaryImageUrl ? [primaryImageUrl] : [];
    }
    if (!primaryImageUrl) {
        return imageUrls;
    }
    if (!imageUrls.includes(primaryImageUrl)) {
        return [primaryImageUrl, ...imageUrls];
    }
    return [primaryImageUrl, ...imageUrls.filter(url => url !== primaryImageUrl)];
}
