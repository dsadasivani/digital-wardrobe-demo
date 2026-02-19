// ── Wardrobe DTOs ──────────────────────────────────────────────

/** Response DTO from GET /api/v1/wardrobe-items */
export interface WardrobeItemDto {
    id: string;
    name: string;
    category: string;
    color: string;
    colorHex: string;
    size: string | null;
    brand: string | null;
    occasion: string | null;
    price: number | null;
    purchaseDate: string | null; // ISO-8601
    imageUrl: string;
    imageUrls?: string[];
    primaryImageUrl?: string;
    imagePaths?: string[];
    primaryImagePath?: string;
    worn: number;
    lastWorn: string | null; // ISO-8601
    favorite: boolean;
    tags: string[];
    notes: string | null;
    createdAt: string; // ISO-8601
}

/** Request body for POST /api/v1/wardrobe-items */
export interface CreateWardrobeItemRequestDto {
    name: string;
    category: string;
    color: string;
    colorHex: string;
    size?: string;
    brand?: string;
    occasion?: string;
    price?: number;
    purchaseDate?: string; // ISO-8601
    imageUrl: string;
    imageUrls?: string[];
    primaryImageUrl?: string;
    imagePaths?: string[];
    primaryImagePath?: string;
    favorite: boolean;
    tags: string[];
    notes?: string;
}

/** Request body for PATCH /api/v1/wardrobe-items/:id */
export interface UpdateWardrobeItemRequestDto {
    name?: string;
    category?: string;
    color?: string;
    colorHex?: string;
    size?: string;
    brand?: string;
    occasion?: string;
    price?: number;
    purchaseDate?: string; // ISO-8601
    imageUrl?: string;
    imageUrls?: string[];
    primaryImageUrl?: string;
    imagePaths?: string[];
    primaryImagePath?: string;
    worn?: number;
    lastWorn?: string; // ISO-8601
    favorite?: boolean;
    tags?: string[];
    notes?: string;
}
