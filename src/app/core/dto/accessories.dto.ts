// ── Accessories DTOs ───────────────────────────────────────────

/** Response DTO from GET /api/v1/accessories */
export interface AccessoryDto {
    id: string;
    name: string;
    category: string;
    color: string;
    colorHex: string;
    brand: string | null;
    price: number | null;
    occasion: string | null;
    purchaseDate: string | null; // ISO-8601
    imageUrl: string;
    imageUrls?: string[];
    imageCount?: number;
    primaryImageUrl?: string;
    imagePaths?: string[];
    primaryImagePath?: string;
    worn: number;
    lastWorn: string | null; // ISO-8601
    favorite: boolean;
    tags: string[];
    createdAt: string; // ISO-8601
}

/** Request body for POST /api/v1/accessories */
export interface CreateAccessoryRequestDto {
    name: string;
    category: string;
    color: string;
    colorHex: string;
    brand?: string;
    price?: number;
    occasion?: string;
    purchaseDate?: string; // ISO-8601
    imageUrl: string;
    imageUrls?: string[];
    primaryImageUrl?: string;
    imagePaths?: string[];
    primaryImagePath?: string;
    favorite: boolean;
    tags: string[];
}

/** Request body for PATCH /api/v1/accessories/:id */
export interface UpdateAccessoryRequestDto {
    name?: string;
    category?: string;
    color?: string;
    colorHex?: string;
    brand?: string;
    price?: number;
    occasion?: string;
    purchaseDate?: string; // ISO-8601
    imageUrl?: string;
    imageUrls?: string[];
    primaryImageUrl?: string;
    imagePaths?: string[];
    primaryImagePath?: string;
    favorite?: boolean;
    tags?: string[];
}
