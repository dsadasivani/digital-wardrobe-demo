import type {
  DashboardCategoryBreakdownDto,
  DashboardCategoryBreakdownResponseDto,
  DashboardCountersDto,
  DashboardRecentlyAddedDto,
  DashboardSummaryDto,
  DashboardWearInsightsDto,
} from '../dto/dashboard.dto';
import type { DashboardSummary, WardrobeCategory, WardrobeItem } from '../models';
import { mapWardrobeItemDtoToModel } from './wardrobe.mapper';

export interface DashboardCountersModel {
  totalItems: number;
  totalAccessories: number;
  totalOutfits: number;
  favoriteCount: number;
  unusedCount: number;
}

export interface DashboardWearInsightsModel {
  mostWornItem?: WardrobeItem;
  leastWornItems: WardrobeItem[];
}

export function mapDashboardCountersDtoToModel(dto: DashboardCountersDto): DashboardCountersModel {
  return {
    totalItems: dto.totalItems,
    totalAccessories: dto.totalAccessories,
    totalOutfits: dto.totalOutfits,
    favoriteCount: dto.favoriteCount,
    unusedCount: dto.unusedCount,
  };
}

export function mapDashboardWearInsightsDtoToModel(
  dto: DashboardWearInsightsDto,
): DashboardWearInsightsModel {
  return {
    mostWornItem: dto.mostWornItem ? mapWardrobeItemDtoToModel(dto.mostWornItem) : undefined,
    leastWornItems: dto.leastWornItems.map(mapWardrobeItemDtoToModel),
  };
}

export function mapDashboardRecentlyAddedDtoToModel(dto: DashboardRecentlyAddedDto): WardrobeItem[] {
  return dto.recentlyAdded.map(mapWardrobeItemDtoToModel);
}

export function mapDashboardCategoryBreakdownDtoToModel(
  dto: DashboardCategoryBreakdownResponseDto,
): { category: WardrobeCategory; count: number }[] {
  return dto.categoryBreakdown.map(mapCategoryBreakdownItemToModel);
}

export function mapDashboardSummaryDtoToModel(dto: DashboardSummaryDto): DashboardSummary {
  return {
    ...mapDashboardCountersDtoToModel(dto),
    ...mapDashboardWearInsightsDtoToModel(dto),
    recentlyAdded: mapDashboardRecentlyAddedDtoToModel(dto),
    categoryBreakdown: dto.categoryBreakdown.map(mapCategoryBreakdownItemToModel),
  };
}

function mapCategoryBreakdownItemToModel(item: DashboardCategoryBreakdownDto): {
  category: WardrobeCategory;
  count: number;
} {
  return {
    category: item.category as WardrobeCategory,
    count: item.count,
  };
}
