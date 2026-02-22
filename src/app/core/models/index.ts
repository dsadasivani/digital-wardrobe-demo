// Wardrobe Item Interface
export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  color: string;
  colorHex: string;
  size?: string;
  brand?: string;
  occasion?: string;
  price?: number;
  purchaseDate?: Date;
  imageUrl: string;
  imageUrls: string[];
  imageCount?: number;
  primaryImageUrl: string;
  imagePaths?: string[];
  primaryImagePath?: string;
  worn: number; // times worn
  lastWorn?: Date;
  favorite: boolean;
  tags: string[];
  notes?: string;
  createdAt: Date;
}

export type WardrobeCategory = string;

export interface CategoryInfo {
  id: string;
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
  price?: number;
  occasion?: string;
  purchaseDate?: Date;
  imageUrl: string;
  imageUrls: string[];
  imageCount?: number;
  primaryImageUrl: string;
  imagePaths?: string[];
  primaryImagePath?: string;
  worn: number; // times worn
  lastWorn?: Date;
  favorite: boolean;
  tags: string[];
  createdAt: Date;
}

export type AccessoryCategory = string;

export interface AccessoryCategoryInfo {
  id: string;
  label: string;
  icon: string;
}

export const ACCESSORY_CATEGORIES: AccessoryCategoryInfo[] = [
  { id: 'bags', label: 'Bags', icon: 'work' },
  { id: 'jewelry', label: 'Jewelry', icon: 'diamond' },
  { id: 'watches', label: 'Watches', icon: 'watch' },
  { id: 'scarves', label: 'Scarves', icon: 'checkroom' },
  { id: 'belts', label: 'Belts', icon: 'straighten' },
  { id: 'hats', label: 'Hats', icon: 'styler' },
  { id: 'sunglasses', label: 'Sunglasses', icon: 'visibility' },
  { id: 'ties', label: 'Ties', icon: 'style' },
  { id: 'footwear', label: 'Footwear', icon: 'shoe' },
];

export const OCCASION_OPTIONS: string[] = [
  'casual',
  'formal',
  'business',
  'partywear',
  'festive',
  'wedding',
  'travel',
  'athletic',
  'date night',
  'beach',
  'lounge',
  'streetwear',
];

export const WARDROBE_SIZE_OPTIONS: string[] = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  'XXXL',
  'Free-Size',
];

export type OutfitCategory = string;

export const OUTFIT_CATEGORIES: CategoryInfo[] = [
  { id: 'work', label: 'Work', icon: 'work' },
  { id: 'casual', label: 'Casual', icon: 'weekend' },
  { id: 'formal', label: 'Formal', icon: 'style' },
  { id: 'party', label: 'Party', icon: 'celebration' },
  { id: 'vacation', label: 'Vacation', icon: 'flight_takeoff' },
];

// Outfit Interface
export interface Outfit {
  id: string;
  name: string;
  category?: OutfitCategory;
  items: OutfitItem[];
  occasion?: string;
  season?: string;
  rating?: number;
  favorite: boolean;
  notes?: string;
  imageUrl?: string;
  createdAt: Date;
  worn: number; // times worn
  lastWorn?: Date;
  plannedDates?: string[]; // YYYY-MM-DD
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
  gender?: UserGender;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
}

export type UserGender = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

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
  totalAccessories: number;
  totalOutfits: number;
  mostWornItem?: WardrobeItem;
  leastWornItems: WardrobeItem[];
  recentlyAdded: WardrobeItem[];
  categoryBreakdown: { category: WardrobeCategory; count: number }[];
}

export interface DashboardSummary extends DashboardStats {
  favoriteCount: number;
  unusedCount: number;
}
