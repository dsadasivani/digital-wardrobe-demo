import type { WardrobeItemDto } from './wardrobe.dto';

export interface DashboardCategoryBreakdownDto {
  category: string;
  count: number;
}

export interface DashboardSummaryDto {
  totalItems: number;
  totalAccessories: number;
  totalOutfits: number;
  favoriteCount: number;
  unusedCount: number;
  mostWornItem: WardrobeItemDto | null;
  leastWornItems: WardrobeItemDto[];
  recentlyAdded: WardrobeItemDto[];
  categoryBreakdown: DashboardCategoryBreakdownDto[];
}
