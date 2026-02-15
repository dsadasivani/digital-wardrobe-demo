// ── Outfits DTOs ──────────────────────────────────────────────

/** Embedded item within an outfit response */
export interface OutfitItemDto {
    itemId: string;
    type: string;
    positionX: number;
    positionY: number;
    scale: number;
    rotation: number;
    zIndex: number;
}

/** Response DTO from GET /api/v1/outfits */
export interface OutfitDto {
    id: string;
    name: string;
    items: OutfitItemDto[];
    occasion: string | null;
    season: string | null;
    rating: number | null;
    favorite: boolean;
    notes: string | null;
    imageUrl: string | null;
    createdAt: string; // ISO-8601
    worn: number;
    lastWorn: string | null; // ISO-8601
    plannedDates: string[]; // YYYY-MM-DD
}

/** Embedded item within a create/update request */
export interface OutfitItemRequestDto {
    itemId: string;
    type: string;
    positionX: number;
    positionY: number;
    scale: number;
    rotation: number;
    zIndex: number;
}

/** Request body for POST /api/v1/outfits */
export interface CreateOutfitRequestDto {
    name: string;
    items: OutfitItemRequestDto[];
    occasion?: string;
    season?: string;
    rating?: number;
    favorite: boolean;
    notes?: string;
    imageUrl?: string;
    plannedDates?: string[];
}

/** Request body for PATCH /api/v1/outfits/:id */
export interface UpdateOutfitRequestDto {
    name?: string;
    items?: OutfitItemRequestDto[];
    occasion?: string;
    season?: string;
    rating?: number;
    favorite?: boolean;
    notes?: string;
    imageUrl?: string;
    lastWorn?: string; // ISO-8601
    plannedDates?: string[];
}
