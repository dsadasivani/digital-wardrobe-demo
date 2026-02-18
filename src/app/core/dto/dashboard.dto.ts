import type { WardrobeItemDto } from './wardrobe.dto';

export interface DashboardCategoryBreakdownDto {
  category: string;
  count: number;
}

export interface DashboardCountersDto {
  totalItems: number;
  totalAccessories: number;
  totalOutfits: number;
  favoriteCount: number;
  unusedCount: number;
}

export interface DashboardWearInsightsDto {
  mostWornItem: WardrobeItemDto | null;
  leastWornItems: WardrobeItemDto[];
}

export interface DashboardRecentlyAddedDto {
  recentlyAdded: WardrobeItemDto[];
}

export interface DashboardCategoryBreakdownResponseDto {
  categoryBreakdown: DashboardCategoryBreakdownDto[];
}

export interface DashboardSummaryDto
  extends DashboardCountersDto,
    DashboardWearInsightsDto,
    DashboardRecentlyAddedDto,
    DashboardCategoryBreakdownResponseDto {}
