import type { Outfit, OutfitItem } from '../models';
import type {
    OutfitDto,
    OutfitItemDto,
    OutfitItemRequestDto,
    CreateOutfitRequestDto,
    UpdateOutfitRequestDto,
} from '../dto/outfits.dto';

// ── Response → Model ──────────────────────────────────────────

function mapOutfitItemDtoToModel(dto: OutfitItemDto): OutfitItem {
    return {
        itemId: dto.itemId,
        type: dto.type as 'wardrobe' | 'accessory',
        positionX: dto.positionX,
        positionY: dto.positionY,
        scale: dto.scale,
        rotation: dto.rotation,
        zIndex: dto.zIndex,
    };
}

export function mapOutfitDtoToModel(dto: OutfitDto): Outfit {
    return {
        id: dto.id,
        name: dto.name,
        items: dto.items.map(mapOutfitItemDtoToModel),
        occasion: dto.occasion ?? undefined,
        season: dto.season ?? undefined,
        rating: dto.rating ?? undefined,
        favorite: dto.favorite,
        notes: dto.notes ?? undefined,
        imageUrl: dto.imageUrl ?? undefined,
        createdAt: new Date(dto.createdAt),
        worn: dto.worn,
        lastWorn: dto.lastWorn ? new Date(dto.lastWorn) : undefined,
        plannedDates: dto.plannedDates,
    };
}

// ── Model → Request helpers ───────────────────────────────────

function mapOutfitItemToRequestDto(item: OutfitItem): OutfitItemRequestDto {
    return {
        itemId: item.itemId,
        type: item.type,
        positionX: item.positionX,
        positionY: item.positionY,
        scale: item.scale,
        rotation: item.rotation,
        zIndex: item.zIndex,
    };
}

// ── Model → Create Request ────────────────────────────────────

export function mapOutfitToCreateDto(
    outfit: Partial<Outfit> & Pick<Outfit, 'name' | 'items' | 'favorite'>
): CreateOutfitRequestDto {
    return {
        name: outfit.name,
        items: outfit.items.map(mapOutfitItemToRequestDto),
        occasion: outfit.occasion,
        season: outfit.season,
        rating: outfit.rating,
        favorite: outfit.favorite,
        notes: outfit.notes,
        imageUrl: outfit.imageUrl,
        plannedDates: outfit.plannedDates,
    };
}

// ── Model → Update Request ────────────────────────────────────

export function mapOutfitToUpdateDto(
    changes: Partial<Outfit>
): UpdateOutfitRequestDto {
    const dto: UpdateOutfitRequestDto = {};
    if (changes.name !== undefined) dto.name = changes.name;
    if (changes.items !== undefined) dto.items = changes.items.map(mapOutfitItemToRequestDto);
    if (changes.occasion !== undefined) dto.occasion = changes.occasion;
    if (changes.season !== undefined) dto.season = changes.season;
    if (changes.rating !== undefined) dto.rating = changes.rating;
    if (changes.favorite !== undefined) dto.favorite = changes.favorite;
    if (changes.notes !== undefined) dto.notes = changes.notes;
    if (changes.imageUrl !== undefined) dto.imageUrl = changes.imageUrl;
    if (changes.lastWorn !== undefined) dto.lastWorn = changes.lastWorn?.toISOString();
    if (changes.plannedDates !== undefined) dto.plannedDates = changes.plannedDates;
    return dto;
}
