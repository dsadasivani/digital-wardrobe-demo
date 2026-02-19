import type { Accessory, AccessoryCategory } from '../models';
import type {
    AccessoryDto,
    CreateAccessoryRequestDto,
    UpdateAccessoryRequestDto,
} from '../dto/accessories.dto';

// ── Response → Model ──────────────────────────────────────────

export function mapAccessoryDtoToModel(dto: AccessoryDto): Accessory {
    const imageUrls = normalizeImageUrls(dto.imageUrls, dto.imageUrl);
    const primaryImageUrl = normalizePrimaryImageUrl(dto.primaryImageUrl, imageUrls, dto.imageUrl);
    const prioritizedImageUrls = prioritizePrimaryImage(imageUrls, primaryImageUrl);
    const imagePaths = normalizeImagePaths(dto.imagePaths);
    const primaryImagePath = normalizePrimaryImagePath(dto.primaryImagePath, imagePaths);
    return {
        id: dto.id,
        name: dto.name,
        category: dto.category as AccessoryCategory,
        color: dto.color,
        colorHex: dto.colorHex,
        brand: dto.brand ?? undefined,
        price: dto.price ?? undefined,
        occasion: dto.occasion ?? undefined,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        imageUrl: primaryImageUrl,
        imageUrls: prioritizedImageUrls,
        imageCount: Math.max(dto.imageCount ?? 0, prioritizedImageUrls.length),
        primaryImageUrl,
        imagePaths,
        primaryImagePath,
        worn: dto.worn,
        lastWorn: dto.lastWorn ? new Date(dto.lastWorn) : undefined,
        favorite: dto.favorite,
        tags: dto.tags,
        createdAt: new Date(dto.createdAt),
    };
}

// ── Model → Create Request ────────────────────────────────────

export function mapAccessoryToCreateDto(
    item: Partial<Accessory> & Pick<Accessory, 'name' | 'category' | 'color' | 'colorHex' | 'imageUrl' | 'favorite' | 'tags'>
): CreateAccessoryRequestDto {
    const imageUrls = normalizeImageUrls(item.imageUrls, item.imageUrl);
    const primaryImageUrl = normalizePrimaryImageUrl(item.primaryImageUrl, imageUrls, item.imageUrl);
    const imagePaths = normalizeImagePaths(item.imagePaths);
    const primaryImagePath = normalizePrimaryImagePath(item.primaryImagePath, imagePaths);
    return {
        name: item.name,
        category: item.category,
        color: item.color,
        colorHex: item.colorHex,
        brand: item.brand,
        price: item.price,
        occasion: item.occasion,
        purchaseDate: item.purchaseDate?.toISOString(),
        imageUrl: primaryImageUrl,
        imageUrls: prioritizePrimaryImage(imageUrls, primaryImageUrl),
        primaryImageUrl,
        imagePaths: imagePaths.length ? prioritizePrimaryImage(imagePaths, primaryImagePath) : undefined,
        primaryImagePath: primaryImagePath || undefined,
        favorite: item.favorite,
        tags: item.tags,
    };
}

// ── Model → Update Request ────────────────────────────────────

export function mapAccessoryToUpdateDto(
    changes: Partial<Accessory>
): UpdateAccessoryRequestDto {
    const dto: UpdateAccessoryRequestDto = {};
    if (changes.name !== undefined) dto.name = changes.name;
    if (changes.category !== undefined) dto.category = changes.category;
    if (changes.color !== undefined) dto.color = changes.color;
    if (changes.colorHex !== undefined) dto.colorHex = changes.colorHex;
    if (changes.brand !== undefined) dto.brand = changes.brand;
    if (changes.price !== undefined) dto.price = changes.price;
    if (changes.occasion !== undefined) dto.occasion = changes.occasion;
    if (changes.purchaseDate !== undefined) dto.purchaseDate = changes.purchaseDate?.toISOString();
    if (changes.imageUrl !== undefined) {
        dto.imageUrl = changes.imageUrl;
        dto.primaryImageUrl = changes.imageUrl;
    }
    if (changes.primaryImageUrl !== undefined) {
        dto.primaryImageUrl = changes.primaryImageUrl;
        dto.imageUrl = changes.primaryImageUrl;
    }
    if (changes.primaryImagePath !== undefined) {
        dto.primaryImagePath = changes.primaryImagePath;
    }
    if (changes.imageUrls !== undefined) {
        const imageUrls = normalizeImageUrls(changes.imageUrls, changes.imageUrl ?? changes.primaryImageUrl);
        const primaryImageUrl = normalizePrimaryImageUrl(changes.primaryImageUrl, imageUrls, changes.imageUrl);
        dto.imageUrls = prioritizePrimaryImage(imageUrls, primaryImageUrl);
        dto.primaryImageUrl = primaryImageUrl;
        dto.imageUrl = primaryImageUrl;
    }
    if (changes.imagePaths !== undefined) {
        const imagePaths = normalizeImagePaths(changes.imagePaths);
        const primaryImagePath = normalizePrimaryImagePath(
            changes.primaryImagePath,
            imagePaths,
        );
        if (imagePaths.length) {
            dto.imagePaths = prioritizePrimaryImage(imagePaths, primaryImagePath);
            dto.primaryImagePath = primaryImagePath || undefined;
        }
    }
    if (changes.favorite !== undefined) dto.favorite = changes.favorite;
    if (changes.tags !== undefined) dto.tags = changes.tags;
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

function normalizeImagePaths(imagePaths: string[] | undefined): string[] {
    return (imagePaths ?? []).map(path => path.trim()).filter(Boolean);
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

function normalizePrimaryImagePath(
    primaryImagePath: string | undefined,
    imagePaths: string[],
    fallbackImagePath?: string | undefined,
): string {
    const normalizedPrimary = primaryImagePath?.trim();
    if (normalizedPrimary && imagePaths.includes(normalizedPrimary)) {
        return normalizedPrimary;
    }
    if (normalizedPrimary && !imagePaths.length) {
        return normalizedPrimary;
    }
    return imagePaths[0] ?? fallbackImagePath?.trim() ?? '';
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
