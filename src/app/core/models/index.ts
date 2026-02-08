// Wardrobe Item Interface
export interface WardrobeItem {
    id: string;
    name: string;
    category: WardrobeCategory;
    color: string;
    colorHex: string;
    size?: string;
    brand?: string;
    price?: number;
    purchaseDate?: Date;
    imageUrl: string;
    worn: number; // times worn
    lastWorn?: Date;
    favorite: boolean;
    tags: string[];
    notes?: string;
    createdAt: Date;
}

export type WardrobeCategory =
    | 'tops'
    | 'bottoms'
    | 'dresses'
    | 'outerwear'
    | 'shoes'
    | 'accessories'
    | 'activewear'
    | 'formal'
    | 'swimwear';

export interface CategoryInfo {
    id: WardrobeCategory;
    label: string;
    icon: string;
    count?: number;
}

export const WARDROBE_CATEGORIES: CategoryInfo[] = [
    { id: 'tops', label: 'Tops', icon: 'checkroom' },
    { id: 'bottoms', label: 'Bottoms', icon: 'straighten' },
    { id: 'dresses', label: 'Dresses', icon: 'dry_cleaning' },
    { id: 'outerwear', label: 'Outerwear', icon: 'ac_unit' },
    { id: 'shoes', label: 'Shoes', icon: 'hiking' },
    { id: 'accessories', label: 'Accessories', icon: 'watch' },
    { id: 'activewear', label: 'Activewear', icon: 'fitness_center' },
    { id: 'formal', label: 'Formal', icon: 'style' },
    { id: 'swimwear', label: 'Swimwear', icon: 'pool' },
];

// Accessory Interface
export interface Accessory {
    id: string;
    name: string;
    category: AccessoryCategory;
    color: string;
    colorHex: string;
    brand?: string;
    imageUrl: string;
    favorite: boolean;
    tags: string[];
    createdAt: Date;
}

export type AccessoryCategory =
    | 'bags'
    | 'jewelry'
    | 'watches'
    | 'scarves'
    | 'belts'
    | 'hats'
    | 'sunglasses'
    | 'ties';

// Outfit Interface
export interface Outfit {
    id: string;
    name: string;
    items: OutfitItem[];
    occasion?: string;
    season?: string;
    rating?: number;
    favorite: boolean;
    notes?: string;
    imageUrl?: string;
    createdAt: Date;
    lastWorn?: Date;
}

export interface OutfitItem {
    itemId: string;
    type: 'wardrobe' | 'accessory';
    positionX: number;
    positionY: number;
    scale: number;
    rotation: number;
    zIndex: number;
}

// User Interface
export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    preferences: UserPreferences;
    createdAt: Date;
}

export interface UserPreferences {
    favoriteColors: string[];
    stylePreferences: string[];
    location?: string;
    notificationsEnabled: boolean;
    darkMode: boolean;
}

// Dashboard Stats
export interface DashboardStats {
    totalItems: number;
    totalOutfits: number;
    mostWornItem?: WardrobeItem;
    leastWornItems: WardrobeItem[];
    recentlyAdded: WardrobeItem[];
    categoryBreakdown: { category: WardrobeCategory; count: number }[];
}

// Weather (for suggestions)
export interface WeatherInfo {
    temp: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
    humidity: number;
    location: string;
}
