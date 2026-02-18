import type { DashboardSummaryDto } from '../dto/dashboard.dto';
import type { DashboardSummary, WardrobeCategory } from '../models';
import { mapWardrobeItemDtoToModel } from './wardrobe.mapper';

export function mapDashboardSummaryDtoToModel(dto: DashboardSummaryDto): DashboardSummary {
  return {
    totalItems: dto.totalItems,
    totalAccessories: dto.totalAccessories,
    totalOutfits: dto.totalOutfits,
    favoriteCount: dto.favoriteCount,
    unusedCount: dto.unusedCount,
    mostWornItem: dto.mostWornItem ? mapWardrobeItemDtoToModel(dto.mostWornItem) : undefined,
    leastWornItems: dto.leastWornItems.map(mapWardrobeItemDtoToModel),
    recentlyAdded: dto.recentlyAdded.map(mapWardrobeItemDtoToModel),
    suggestedItems: dto.suggestedItems.map(mapWardrobeItemDtoToModel),
    categoryBreakdown: dto.categoryBreakdown.map(item => ({
      category: item.category as WardrobeCategory,
      count: item.count,
    })),
  };
}
