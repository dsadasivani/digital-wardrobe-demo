import { computed, inject, Injectable, isDevMode, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  WardrobeItem,
  WardrobeCategory,
  Accessory,
  Outfit,
  DashboardStats,
} from '../models';
import { WardrobeApi } from '../api/wardrobe.api';
import { AccessoriesApi } from '../api/accessories.api';
import { OutfitsApi } from '../api/outfits.api';
import { DashboardApi } from '../api/dashboard.api';
import {
  mapWardrobeItemDtoToModel,
  mapWardrobeItemToCreateDto,
  mapWardrobeItemToUpdateDto,
} from '../mappers/wardrobe.mapper';
import {
  mapAccessoryDtoToModel,
  mapAccessoryToCreateDto,
  mapAccessoryToUpdateDto,
} from '../mappers/accessories.mapper';
import {
  mapOutfitDtoToModel,
  mapOutfitToCreateDto,
  mapOutfitToUpdateDto,
} from '../mappers/outfits.mapper';
import {
  DashboardCountersModel,
  DashboardWearInsightsModel,
  mapDashboardCategoryBreakdownDtoToModel,
  mapDashboardCountersDtoToModel,
  mapDashboardRecentlyAddedDtoToModel,
  mapDashboardWearInsightsDtoToModel,
} from '../mappers/dashboard.mapper';

type DataLoadState = 'idle' | 'loading' | 'loaded' | 'error';
type MutationAction = 'favorite' | 'delete' | 'mark-worn';
const DEFAULT_COLLECTION_PAGE_SIZE = 10;
const DASHBOARD_DEBUG_LOADER_DELAY_MS_STORAGE_KEY = 'dw-debug-dashboard-loader-ms';

@Injectable({
  providedIn: 'root',
})
export class WardrobeService {
  private readonly wardrobeApi = inject(WardrobeApi);
  private readonly accessoriesApi = inject(AccessoriesApi);
  private readonly outfitsApi = inject(OutfitsApi);
  private readonly dashboardApi = inject(DashboardApi);

  private wardrobeItems = signal<WardrobeItem[]>([]);
  private accessories = signal<Accessory[]>([]);
  private outfits = signal<Outfit[]>([]);
  private dashboardCountersData = signal<DashboardCountersModel | null>(null);
  private dashboardWearInsightsData = signal<DashboardWearInsightsModel | null>(null);
  private dashboardRecentlyAddedData = signal<WardrobeItem[] | null>(null);
  private dashboardCategoryBreakdownData = signal<
    { category: WardrobeCategory; count: number }[] | null
  >(null);
  private wardrobeLoadState = signal<DataLoadState>('idle');
  private accessoriesLoadState = signal<DataLoadState>('idle');
  private outfitsLoadState = signal<DataLoadState>('idle');
  private dashboardCountersLoadState = signal<DataLoadState>('idle');
  private dashboardWearInsightsLoadState = signal<DataLoadState>('idle');
  private dashboardRecentlyAddedLoadState = signal<DataLoadState>('idle');
  private dashboardCategoryBreakdownLoadState = signal<DataLoadState>('idle');
  private wardrobeLoadPromise: Promise<void> | null = null;
  private accessoriesLoadPromise: Promise<void> | null = null;
  private outfitsLoadPromise: Promise<void> | null = null;
  private dashboardCountersLoadPromise: Promise<void> | null = null;
  private dashboardWearInsightsLoadPromise: Promise<void> | null = null;
  private dashboardRecentlyAddedLoadPromise: Promise<void> | null = null;
  private dashboardCategoryBreakdownLoadPromise: Promise<void> | null = null;
  private dashboardSummaryLoadPromise: Promise<void> | null = null;
  private wardrobePageIndex = signal(-1);
  private accessoriesPageIndex = signal(-1);
  private outfitsPageIndex = signal(-1);
  private wardrobePageHasNext = signal(true);
  private accessoriesPageHasNext = signal(true);
  private outfitsPageHasNext = signal(true);
  private wardrobePageTotalElements = signal(0);
  private accessoriesPageTotalElements = signal(0);
  private outfitsPageTotalElements = signal(0);
  private wardrobePageLoadState = signal<DataLoadState>('idle');
  private accessoriesPageLoadState = signal<DataLoadState>('idle');
  private outfitsPageLoadState = signal<DataLoadState>('idle');
  private wardrobePageLoadPromise: Promise<void> | null = null;
  private accessoriesPageLoadPromise: Promise<void> | null = null;
  private outfitsPageLoadPromise: Promise<void> | null = null;
  private mutationStateByKey = signal<Record<string, true>>({});

  // ── Public readonly signals (consumed by components) ─────────
  readonly items = this.wardrobeItems.asReadonly();
  readonly accessoryList = this.accessories.asReadonly();
  readonly outfitList = this.outfits.asReadonly();
  readonly dashboardCounters = this.dashboardCountersData.asReadonly();
  readonly dashboardWearInsights = this.dashboardWearInsightsData.asReadonly();
  readonly dashboardRecentlyAdded = this.dashboardRecentlyAddedData.asReadonly();
  readonly dashboardCategoryBreakdown = this.dashboardCategoryBreakdownData.asReadonly();
  readonly wardrobeTotalElements = this.wardrobePageTotalElements.asReadonly();
  readonly accessoriesTotalElements = this.accessoriesPageTotalElements.asReadonly();
  readonly outfitsTotalElements = this.outfitsPageTotalElements.asReadonly();

  readonly totalItems = computed(() => this.wardrobeItems().length + this.accessories().length);
  readonly favoriteItems = computed(() => this.wardrobeItems().filter((item) => item.favorite));
  readonly recentItems = computed(() =>
    [...this.wardrobeItems()]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10),
  );

  readonly categoryBreakdown = computed(() => {
    const items = this.wardrobeItems();
    const breakdown = new Map<WardrobeCategory, number>();
    items.forEach((item) => {
      breakdown.set(item.category, (breakdown.get(item.category) ?? 0) + 1);
    });
    return Array.from(breakdown.entries())
      .map(([category, count]) => ({ category, count }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  });

  readonly dashboardStats = computed<DashboardStats>(() => {
    const counters = this.dashboardCountersData();
    const wearInsights = this.dashboardWearInsightsData();
    const recentlyAdded = this.dashboardRecentlyAddedData();
    const categoryBreakdown = this.dashboardCategoryBreakdownData();
    const items = this.wardrobeItems();
    const sortedByWorn = [...items].sort((a, b) => b.worn - a.worn);
    const leastWorn = [...items].sort((a, b) => a.worn - b.worn).slice(0, 3);

    return {
      totalItems: counters?.totalItems ?? this.totalItems(),
      totalAccessories: counters?.totalAccessories ?? this.accessories().length,
      totalOutfits: counters?.totalOutfits ?? this.outfits().length,
      mostWornItem: wearInsights?.mostWornItem ?? sortedByWorn[0],
      leastWornItems: wearInsights?.leastWornItems ?? leastWorn,
      recentlyAdded: recentlyAdded ?? this.recentItems(),
      categoryBreakdown: categoryBreakdown ?? this.categoryBreakdown(),
    };
  });

  readonly favoriteCount = computed(() => {
    const counters = this.dashboardCountersData();
    if (counters) {
      return counters.favoriteCount;
    }
    return this.favoriteItems().length;
  });

  readonly unusedCount = computed(() => {
    const counters = this.dashboardCountersData();
    if (counters) {
      return counters.unusedCount;
    }
    return this.wardrobeItems().filter((item) => item.worn < 5).length;
  });
  readonly hasMoreWardrobePages = computed(() => this.wardrobePageHasNext());
  readonly hasMoreAccessoriesPages = computed(() => this.accessoriesPageHasNext());
  readonly hasMoreOutfitsPages = computed(() => this.outfitsPageHasNext());
  readonly wardrobePageLoading = computed(() => this.wardrobePageLoadState() === 'loading');
  readonly accessoriesPageLoading = computed(() => this.accessoriesPageLoadState() === 'loading');
  readonly outfitsPageLoading = computed(() => this.outfitsPageLoadState() === 'loading');
  readonly dashboardCountersLoading = computed(() => this.dashboardCountersLoadState() === 'loading');
  readonly dashboardWearInsightsLoading = computed(
    () => this.dashboardWearInsightsLoadState() === 'loading',
  );
  readonly dashboardRecentlyAddedLoading = computed(
    () => this.dashboardRecentlyAddedLoadState() === 'loading',
  );
  readonly dashboardCategoryBreakdownLoading = computed(
    () => this.dashboardCategoryBreakdownLoadState() === 'loading',
  );
  readonly hasPendingMutation = computed(() => Object.keys(this.mutationStateByKey()).length > 0);

  // ── Data loading from backend ────────────────────────────────

  async ensureDashboardDataLoaded(): Promise<void> {
    await Promise.all([
      this.ensureWardrobeLoaded(),
      this.ensureAccessoriesLoaded(),
      this.ensureOutfitsLoaded(),
    ]);
  }

  async ensureDashboardCountersLoaded(): Promise<void> {
    await this.loadDashboardCountersData(false);
  }

  async ensureDashboardWearInsightsLoaded(): Promise<void> {
    await this.loadDashboardWearInsightsData(false);
  }

  async ensureDashboardRecentlyAddedLoaded(): Promise<void> {
    await this.loadDashboardRecentlyAddedData(false);
  }

  async ensureDashboardCategoryBreakdownLoaded(): Promise<void> {
    await this.loadDashboardCategoryBreakdownData(false);
  }

  async ensureDashboardSummaryLoaded(): Promise<void> {
    await this.loadDashboardSummaryData(false);
  }

  async ensureWardrobePageLoaded(): Promise<void> {
    if (this.wardrobeLoadState() === 'loaded' || this.wardrobePageIndex() >= 0) {
      return;
    }
    await this.loadWardrobePage(0);
  }

  async ensureAccessoriesPageLoaded(): Promise<void> {
    if (this.accessoriesLoadState() === 'loaded' || this.accessoriesPageIndex() >= 0) {
      return;
    }
    await this.loadAccessoriesPage(0);
  }

  async ensureOutfitsPageLoaded(): Promise<void> {
    if (this.outfitsLoadState() === 'loaded' || this.outfitsPageIndex() >= 0) {
      return;
    }
    await this.loadOutfitsPage(0);
  }

  async loadNextWardrobePage(): Promise<void> {
    if (this.wardrobeLoadState() === 'loaded') {
      return;
    }
    await this.loadWardrobePage(this.wardrobePageIndex() + 1);
  }

  async loadNextAccessoriesPage(): Promise<void> {
    if (this.accessoriesLoadState() === 'loaded') {
      return;
    }
    await this.loadAccessoriesPage(this.accessoriesPageIndex() + 1);
  }

  async loadNextOutfitsPage(): Promise<void> {
    if (this.outfitsLoadState() === 'loaded') {
      return;
    }
    await this.loadOutfitsPage(this.outfitsPageIndex() + 1);
  }

  async ensureWardrobeLoaded(): Promise<void> {
    await this.loadWardrobeData(false);
  }

  async ensureAccessoriesLoaded(): Promise<void> {
    await this.loadAccessoriesData(false);
  }

  async ensureOutfitsLoaded(): Promise<void> {
    await this.loadOutfitsData(false);
  }

  async refreshWardrobe(): Promise<void> {
    await this.loadWardrobeData(true);
  }

  async refreshAccessories(): Promise<void> {
    await this.loadAccessoriesData(true);
  }

  async refreshOutfits(): Promise<void> {
    await this.loadOutfitsData(true);
  }

  async refreshDashboardCounters(): Promise<void> {
    await this.loadDashboardCountersData(true);
  }

  async refreshDashboardWearInsights(): Promise<void> {
    await this.loadDashboardWearInsightsData(true);
  }

  async refreshDashboardRecentlyAdded(): Promise<void> {
    await this.loadDashboardRecentlyAddedData(true);
  }

  async refreshDashboardCategoryBreakdown(): Promise<void> {
    await this.loadDashboardCategoryBreakdownData(true);
  }

  async refreshDashboardSummary(): Promise<void> {
    await this.loadDashboardSummaryData(true);
  }

  async refreshAll(): Promise<void> {
    await Promise.all([this.refreshWardrobe(), this.refreshAccessories(), this.refreshOutfits()]);
    this.invalidateDashboardSections();
  }

  async loadAll(): Promise<void> {
    await this.ensureDashboardDataLoaded();
  }

  clearAll(): void {
    this.wardrobeItems.set([]);
    this.accessories.set([]);
    this.outfits.set([]);
    this.dashboardCountersData.set(null);
    this.dashboardWearInsightsData.set(null);
    this.dashboardRecentlyAddedData.set(null);
    this.dashboardCategoryBreakdownData.set(null);
    this.wardrobeLoadState.set('idle');
    this.accessoriesLoadState.set('idle');
    this.outfitsLoadState.set('idle');
    this.dashboardCountersLoadState.set('idle');
    this.dashboardWearInsightsLoadState.set('idle');
    this.dashboardRecentlyAddedLoadState.set('idle');
    this.dashboardCategoryBreakdownLoadState.set('idle');
    this.wardrobePageIndex.set(-1);
    this.accessoriesPageIndex.set(-1);
    this.outfitsPageIndex.set(-1);
    this.wardrobePageHasNext.set(true);
    this.accessoriesPageHasNext.set(true);
    this.outfitsPageHasNext.set(true);
    this.wardrobePageTotalElements.set(0);
    this.accessoriesPageTotalElements.set(0);
    this.outfitsPageTotalElements.set(0);
    this.wardrobePageLoadState.set('idle');
    this.accessoriesPageLoadState.set('idle');
    this.outfitsPageLoadState.set('idle');
    this.wardrobeLoadPromise = null;
    this.accessoriesLoadPromise = null;
    this.outfitsLoadPromise = null;
    this.dashboardCountersLoadPromise = null;
    this.dashboardWearInsightsLoadPromise = null;
    this.dashboardRecentlyAddedLoadPromise = null;
    this.dashboardCategoryBreakdownLoadPromise = null;
    this.dashboardSummaryLoadPromise = null;
    this.wardrobePageLoadPromise = null;
    this.accessoriesPageLoadPromise = null;
    this.outfitsPageLoadPromise = null;
  }

  // ── Wardrobe Item CRUD ───────────────────────────────────────

  getItemById(id: string): WardrobeItem | undefined {
    return this.wardrobeItems().find((item) => item.id === id);
  }

  async fetchWardrobeItemById(id: string, force = false): Promise<WardrobeItem | undefined> {
    const existing = this.getItemById(id);
    if (existing && !force && this.hasCompleteImageGallery(existing)) {
      return existing;
    }

    const response = await firstValueFrom(this.wardrobeApi.getById(id));
    const mapped = mapWardrobeItemDtoToModel(response);
    this.wardrobeItems.update((items) => this.upsertById(items, mapped));
    return mapped;
  }

  getItemsByCategory(category: WardrobeCategory): WardrobeItem[] {
    return this.wardrobeItems().filter((item) => item.category === category);
  }

  async addItem(item: Omit<WardrobeItem, 'id' | 'createdAt' | 'worn'>): Promise<void> {
    const dto = mapWardrobeItemToCreateDto(item as WardrobeItem);
    const response = await firstValueFrom(this.wardrobeApi.create(dto));
    const newItem = mapWardrobeItemDtoToModel(response);
    this.wardrobeItems.update((items) => [...items, newItem]);
    this.invalidateDashboardSections();
  }

  async updateItem(
    id: string,
    updates: Partial<WardrobeItem>,
    options?: { previousFavorite?: boolean },
  ): Promise<void> {
    const currentItem = this.wardrobeItems().find((item) => item.id === id);
    const previousFavorite = options?.previousFavorite ?? currentItem?.favorite;
    const dto = mapWardrobeItemToUpdateDto(updates);
    const response = await firstValueFrom(this.wardrobeApi.update(id, dto));
    const updated = mapWardrobeItemDtoToModel(response);
    this.wardrobeItems.update((items) => this.upsertById(items, updated));
    this.syncDashboardFavoriteCount(previousFavorite, updated.favorite);
    this.syncDashboardWardrobeItem(updated);
    this.invalidateDashboardSections();
  }

  async deleteItem(id: string): Promise<void> {
    await this.runWithMutationState('delete', id, async () => {
      await firstValueFrom(this.wardrobeApi.delete(id));
      this.wardrobeItems.update((items) => items.filter((item) => item.id !== id));
      this.invalidateDashboardSections();
    });
  }

  async toggleFavorite(id: string): Promise<void> {
    await this.runWithMutationState('favorite', id, async () => {
      const item = this.wardrobeItems().find((i) => i.id === id);
      if (item) {
        await this.updateItem(id, { favorite: !item.favorite }, { previousFavorite: item.favorite });
        return;
      }
      const accessory = this.accessories().find((a) => a.id === id);
      if (accessory) {
        await this.toggleAccessoryFavoriteInternal(id, accessory.favorite);
        return;
      }

      try {
        const wardrobeItem = await firstValueFrom(this.wardrobeApi.getById(id));
        await this.updateItem(
          id,
          { favorite: !wardrobeItem.favorite },
          { previousFavorite: wardrobeItem.favorite },
        );
        return;
      } catch {
        // Continue to accessory lookup fallback.
      }

      try {
        const accessoryItem = await firstValueFrom(this.accessoriesApi.getById(id));
        await this.toggleAccessoryFavoriteInternal(id, accessoryItem.favorite);
      } catch {
        // No matching item found in known collections.
      }
    });
  }

  // ── Accessory CRUD ───────────────────────────────────────────

  getAccessoryById(id: string): Accessory | undefined {
    return this.accessories().find((item) => item.id === id);
  }

  async fetchAccessoryById(id: string, force = false): Promise<Accessory | undefined> {
    const existing = this.getAccessoryById(id);
    if (existing && !force && this.hasCompleteImageGallery(existing)) {
      return existing;
    }

    const response = await firstValueFrom(this.accessoriesApi.getById(id));
    const mapped = mapAccessoryDtoToModel(response);
    this.accessories.update((items) => this.upsertById(items, mapped));
    return mapped;
  }

  async addAccessory(
    accessory: Omit<Accessory, 'id' | 'createdAt' | 'worn' | 'lastWorn'>,
  ): Promise<void> {
    const dto = mapAccessoryToCreateDto(accessory as Accessory);
    const response = await firstValueFrom(this.accessoriesApi.create(dto));
    const newAccessory = mapAccessoryDtoToModel(response);
    this.accessories.update((items) => [...items, newAccessory]);
    this.invalidateDashboardSections();
  }

  async updateAccessory(
    id: string,
    updates: Partial<Accessory>,
    options?: { previousFavorite?: boolean },
  ): Promise<void> {
    const currentAccessory = this.accessories().find((item) => item.id === id);
    const previousFavorite = options?.previousFavorite ?? currentAccessory?.favorite;
    const dto = mapAccessoryToUpdateDto(updates);
    const response = await firstValueFrom(this.accessoriesApi.update(id, dto));
    const updated = mapAccessoryDtoToModel(response);
    this.accessories.update((items) => this.upsertById(items, updated));
    this.syncDashboardFavoriteCount(previousFavorite, updated.favorite);
    this.invalidateDashboardSections();
  }

  async deleteAccessory(id: string): Promise<void> {
    await this.runWithMutationState('delete', id, async () => {
      await firstValueFrom(this.accessoriesApi.delete(id));
      this.accessories.update((items) => items.filter((item) => item.id !== id));
      this.invalidateDashboardSections();
    });
  }

  async toggleAccessoryFavorite(id: string): Promise<void> {
    await this.runWithMutationState('favorite', id, async () => {
      const accessory = this.accessories().find((a) => a.id === id);
      if (!accessory) {
        return;
      }
      await this.toggleAccessoryFavoriteInternal(id, accessory.favorite);
    });
  }

  async markAccessoryAsWorn(id: string): Promise<void> {
    await this.runWithMutationState('mark-worn', id, async () => {
      const response = await firstValueFrom(this.accessoriesApi.markAsWorn(id));
      const updated = mapAccessoryDtoToModel(response);
      this.accessories.update((items) => items.map((item) => (item.id === id ? updated : item)));
      this.invalidateDashboardSections();
    });
  }

  // ── Outfit CRUD ──────────────────────────────────────────────

  getOutfitById(id: string): Outfit | undefined {
    return this.outfits().find((outfit) => outfit.id === id);
  }

  async fetchOutfitById(id: string, force = false): Promise<Outfit | undefined> {
    const existing = this.getOutfitById(id);
    if (existing && !force) {
      return existing;
    }

    const response = await firstValueFrom(this.outfitsApi.getById(id));
    const mapped = mapOutfitDtoToModel(response);
    this.outfits.update((items) => this.upsertById(items, mapped));
    return mapped;
  }

  async ensureOutfitDependenciesLoaded(outfit: Outfit): Promise<void> {
    const missingWardrobeIds = new Set<string>();
    const missingAccessoryIds = new Set<string>();

    for (const item of outfit.items) {
      if (item.type === 'wardrobe' && !this.getItemById(item.itemId)) {
        missingWardrobeIds.add(item.itemId);
        continue;
      }
      if (item.type === 'accessory' && !this.getAccessoryById(item.itemId)) {
        missingAccessoryIds.add(item.itemId);
      }
    }

    const requests: Promise<unknown>[] = [
      ...Array.from(missingWardrobeIds, (itemId) => this.fetchWardrobeItemById(itemId)),
      ...Array.from(missingAccessoryIds, (itemId) => this.fetchAccessoryById(itemId)),
    ];

    if (requests.length === 0) {
      return;
    }
    await Promise.allSettled(requests);
  }

  async addOutfit(outfit: Omit<Outfit, 'id' | 'createdAt' | 'worn'>): Promise<void> {
    const dto = mapOutfitToCreateDto(outfit as Outfit);
    const response = await firstValueFrom(this.outfitsApi.create(dto));
    const newOutfit = mapOutfitDtoToModel(response);
    this.outfits.update((outfits) => [...outfits, newOutfit]);
    this.invalidateDashboardSections();
  }

  async updateOutfit(id: string, updates: Partial<Outfit>): Promise<void> {
    const dto = mapOutfitToUpdateDto(updates);
    const response = await firstValueFrom(this.outfitsApi.update(id, dto));
    const updated = mapOutfitDtoToModel(response);
    this.outfits.update((outfits) =>
      outfits.map((outfit) => (outfit.id === id ? updated : outfit)),
    );
    this.invalidateDashboardSections();
  }

  async deleteOutfit(id: string): Promise<void> {
    await this.runWithMutationState('delete', id, async () => {
      await firstValueFrom(this.outfitsApi.delete(id));
      this.outfits.update((outfits) => outfits.filter((outfit) => outfit.id !== id));
      this.invalidateDashboardSections();
    });
  }

  async markItemAsWorn(id: string): Promise<void> {
    await this.runWithMutationState('mark-worn', id, async () => {
      const response = await firstValueFrom(this.wardrobeApi.markAsWorn(id));
      const updated = mapWardrobeItemDtoToModel(response);
      this.wardrobeItems.update((items) => items.map((item) => (item.id === id ? updated : item)));
      this.invalidateDashboardSections();
    });
  }

  async markOutfitAsWorn(id: string): Promise<void> {
    await this.runWithMutationState('mark-worn', id, async () => {
      const response = await firstValueFrom(this.outfitsApi.markAsWorn(id));
      const updated = mapOutfitDtoToModel(response);
      this.outfits.update((outfits) =>
        outfits.map((outfit) => (outfit.id === id ? updated : outfit)),
      );
      const dependencyRefreshes = updated.items.map((item) =>
        item.type === 'wardrobe'
          ? this.fetchWardrobeItemById(item.itemId, true)
          : this.fetchAccessoryById(item.itemId, true),
      );
      await Promise.allSettled(dependencyRefreshes);
      this.invalidateDashboardSections();
    });
  }

  isFavoriteMutationPending(id: string): boolean {
    return this.isMutationPending('favorite', id);
  }

  isDeleteMutationPending(id: string): boolean {
    return this.isMutationPending('delete', id);
  }

  isMarkWornMutationPending(id: string): boolean {
    return this.isMutationPending('mark-worn', id);
  }

  getOutfitsByDate(date: string): Outfit[] {
    return this.outfits().filter((outfit) => (outfit.plannedDates ?? []).includes(date));
  }

  // ── Search & Filter ──────────────────────────────────────────

  searchItems(query: string): WardrobeItem[] {
    const lowerQuery = query.toLowerCase();
    return this.wardrobeItems().filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        item.color.toLowerCase().includes(lowerQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  filterByColor(colors: string[]): WardrobeItem[] {
    if (colors.length === 0) return this.wardrobeItems();
    return this.wardrobeItems().filter((item) =>
      colors.some((color) => item.color.toLowerCase().includes(color.toLowerCase())),
    );
  }

  private invalidateDashboardSections(): void {
    this.dashboardCountersLoadState.set('idle');
    this.dashboardWearInsightsLoadState.set('idle');
    this.dashboardRecentlyAddedLoadState.set('idle');
    this.dashboardCategoryBreakdownLoadState.set('idle');
    this.dashboardCountersLoadPromise = null;
    this.dashboardWearInsightsLoadPromise = null;
    this.dashboardRecentlyAddedLoadPromise = null;
    this.dashboardCategoryBreakdownLoadPromise = null;
    this.dashboardSummaryLoadPromise = null;
  }

  private async toggleAccessoryFavoriteInternal(id: string, currentFavorite: boolean): Promise<void> {
    await this.updateAccessory(
      id,
      { favorite: !currentFavorite },
      { previousFavorite: currentFavorite },
    );
  }

  private mutationStateKey(action: MutationAction, id: string): string {
    return `${action}:${id}`;
  }

  private isMutationPending(action: MutationAction, id: string): boolean {
    return this.mutationStateByKey()[this.mutationStateKey(action, id)] === true;
  }

  private setMutationPending(action: MutationAction, id: string, pending: boolean): void {
    const mutationKey = this.mutationStateKey(action, id);
    this.mutationStateByKey.update((state) => {
      if (pending) {
        return {
          ...state,
          [mutationKey]: true,
        };
      }

      if (!state[mutationKey]) {
        return state;
      }

      const { [mutationKey]: _, ...rest } = state;
      return rest;
    });
  }

  private async runWithMutationState<T>(
    action: MutationAction,
    id: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    this.setMutationPending(action, id, true);
    try {
      return await operation();
    } finally {
      this.setMutationPending(action, id, false);
    }
  }

  private async loadWardrobeData(force: boolean): Promise<void> {
    if (this.wardrobeLoadPromise) {
      return this.wardrobeLoadPromise;
    }
    if (!force && this.wardrobeLoadState() === 'loaded') {
      return;
    }

    this.wardrobeLoadState.set('loading');
    const loadPromise = (async () => {
      if (this.wardrobePageLoadPromise) {
        await this.wardrobePageLoadPromise;
      }

      if (force) {
        this.wardrobeItems.set([]);
        this.wardrobePageIndex.set(-1);
        this.wardrobePageHasNext.set(true);
        this.wardrobePageTotalElements.set(0);
        this.wardrobePageLoadState.set('idle');
      }

      if (this.wardrobePageIndex() < 0) {
        await this.loadWardrobePage(0);
      }

      while (this.wardrobePageHasNext()) {
        await this.loadWardrobePage(this.wardrobePageIndex() + 1);
      }

      this.wardrobeLoadState.set('loaded');
      this.wardrobePageLoadState.set('loaded');
    })()
      .catch((error) => {
        this.wardrobeLoadState.set('error');
        this.wardrobePageLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.wardrobeLoadPromise === loadPromise) {
          this.wardrobeLoadPromise = null;
        }
      });
    this.wardrobeLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadAccessoriesData(force: boolean): Promise<void> {
    if (this.accessoriesLoadPromise) {
      return this.accessoriesLoadPromise;
    }
    if (!force && this.accessoriesLoadState() === 'loaded') {
      return;
    }

    this.accessoriesLoadState.set('loading');
    const loadPromise = (async () => {
      if (this.accessoriesPageLoadPromise) {
        await this.accessoriesPageLoadPromise;
      }

      if (force) {
        this.accessories.set([]);
        this.accessoriesPageIndex.set(-1);
        this.accessoriesPageHasNext.set(true);
        this.accessoriesPageTotalElements.set(0);
        this.accessoriesPageLoadState.set('idle');
      }

      if (this.accessoriesPageIndex() < 0) {
        await this.loadAccessoriesPage(0);
      }

      while (this.accessoriesPageHasNext()) {
        await this.loadAccessoriesPage(this.accessoriesPageIndex() + 1);
      }

      this.accessoriesLoadState.set('loaded');
      this.accessoriesPageLoadState.set('loaded');
    })()
      .catch((error) => {
        this.accessoriesLoadState.set('error');
        this.accessoriesPageLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.accessoriesLoadPromise === loadPromise) {
          this.accessoriesLoadPromise = null;
        }
      });
    this.accessoriesLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadOutfitsData(force: boolean): Promise<void> {
    if (this.outfitsLoadPromise) {
      return this.outfitsLoadPromise;
    }
    if (!force && this.outfitsLoadState() === 'loaded') {
      return;
    }

    this.outfitsLoadState.set('loading');
    const loadPromise = (async () => {
      if (this.outfitsPageLoadPromise) {
        await this.outfitsPageLoadPromise;
      }

      if (force) {
        this.outfits.set([]);
        this.outfitsPageIndex.set(-1);
        this.outfitsPageHasNext.set(true);
        this.outfitsPageTotalElements.set(0);
        this.outfitsPageLoadState.set('idle');
      }

      if (this.outfitsPageIndex() < 0) {
        await this.loadOutfitsPage(0);
      }

      while (this.outfitsPageHasNext()) {
        await this.loadOutfitsPage(this.outfitsPageIndex() + 1);
      }

      this.outfitsLoadState.set('loaded');
      this.outfitsPageLoadState.set('loaded');
    })()
      .catch((error) => {
        this.outfitsLoadState.set('error');
        this.outfitsPageLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.outfitsLoadPromise === loadPromise) {
          this.outfitsLoadPromise = null;
        }
      });
    this.outfitsLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadWardrobePage(page: number): Promise<void> {
    if (page < 0 || page <= this.wardrobePageIndex()) {
      return;
    }
    if (!this.wardrobePageHasNext() && page > this.wardrobePageIndex()) {
      return;
    }
    if (this.wardrobePageLoadPromise) {
      return this.wardrobePageLoadPromise;
    }

    this.wardrobePageLoadState.set('loading');
    const loadPromise = firstValueFrom(
      this.wardrobeApi.listPage(page, DEFAULT_COLLECTION_PAGE_SIZE),
    )
      .then((response) => {
        const mapped = response.items.map(mapWardrobeItemDtoToModel);
        this.wardrobeItems.update((items) =>
          page === 0 ? mapped : this.mergeDistinctById(items, mapped),
        );
        this.wardrobePageIndex.set(response.page);
        this.wardrobePageHasNext.set(response.hasNext);
        this.wardrobePageTotalElements.set(response.totalElements);
        this.wardrobePageLoadState.set('loaded');
        if (!response.hasNext) {
          this.wardrobeLoadState.set('loaded');
        }
      })
      .catch((error) => {
        this.wardrobePageLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.wardrobePageLoadPromise === loadPromise) {
          this.wardrobePageLoadPromise = null;
        }
      });
    this.wardrobePageLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadAccessoriesPage(page: number): Promise<void> {
    if (page < 0 || page <= this.accessoriesPageIndex()) {
      return;
    }
    if (!this.accessoriesPageHasNext() && page > this.accessoriesPageIndex()) {
      return;
    }
    if (this.accessoriesPageLoadPromise) {
      return this.accessoriesPageLoadPromise;
    }

    this.accessoriesPageLoadState.set('loading');
    const loadPromise = firstValueFrom(
      this.accessoriesApi.listPage(page, DEFAULT_COLLECTION_PAGE_SIZE),
    )
      .then((response) => {
        const mapped = response.items.map(mapAccessoryDtoToModel);
        this.accessories.update((items) =>
          page === 0 ? mapped : this.mergeDistinctById(items, mapped),
        );
        this.accessoriesPageIndex.set(response.page);
        this.accessoriesPageHasNext.set(response.hasNext);
        this.accessoriesPageTotalElements.set(response.totalElements);
        this.accessoriesPageLoadState.set('loaded');
        if (!response.hasNext) {
          this.accessoriesLoadState.set('loaded');
        }
      })
      .catch((error) => {
        this.accessoriesPageLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.accessoriesPageLoadPromise === loadPromise) {
          this.accessoriesPageLoadPromise = null;
        }
      });
    this.accessoriesPageLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadOutfitsPage(page: number): Promise<void> {
    if (page < 0 || page <= this.outfitsPageIndex()) {
      return;
    }
    if (!this.outfitsPageHasNext() && page > this.outfitsPageIndex()) {
      return;
    }
    if (this.outfitsPageLoadPromise) {
      return this.outfitsPageLoadPromise;
    }

    this.outfitsPageLoadState.set('loading');
    const loadPromise = firstValueFrom(this.outfitsApi.listPage(page, DEFAULT_COLLECTION_PAGE_SIZE))
      .then((response) => {
        const mapped = response.items.map(mapOutfitDtoToModel);
        this.outfits.update((items) =>
          page === 0 ? mapped : this.mergeDistinctById(items, mapped),
        );
        this.outfitsPageIndex.set(response.page);
        this.outfitsPageHasNext.set(response.hasNext);
        this.outfitsPageTotalElements.set(response.totalElements);
        this.outfitsPageLoadState.set('loaded');
        if (!response.hasNext) {
          this.outfitsLoadState.set('loaded');
        }
      })
      .catch((error) => {
        this.outfitsPageLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.outfitsPageLoadPromise === loadPromise) {
          this.outfitsPageLoadPromise = null;
        }
      });
    this.outfitsPageLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadDashboardCountersData(force: boolean): Promise<void> {
    if (this.dashboardSummaryLoadPromise) {
      return this.dashboardSummaryLoadPromise;
    }
    if (this.dashboardCountersLoadPromise) {
      return this.dashboardCountersLoadPromise;
    }
    if (!force && this.dashboardCountersLoadState() === 'loaded') {
      return;
    }

    this.dashboardCountersLoadState.set('loading');
    const loaderStartedAt = Date.now();
    const loadPromise = firstValueFrom(this.dashboardApi.counters())
      .then(async (counters) => {
        this.dashboardCountersData.set(mapDashboardCountersDtoToModel(counters));
        await this.ensureDashboardLoaderMinimumDuration(loaderStartedAt);
        this.dashboardCountersLoadState.set('loaded');
      })
      .catch((error) => {
        this.dashboardCountersLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.dashboardCountersLoadPromise === loadPromise) {
          this.dashboardCountersLoadPromise = null;
        }
      });
    this.dashboardCountersLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadDashboardWearInsightsData(force: boolean): Promise<void> {
    if (this.dashboardSummaryLoadPromise) {
      return this.dashboardSummaryLoadPromise;
    }
    if (this.dashboardWearInsightsLoadPromise) {
      return this.dashboardWearInsightsLoadPromise;
    }
    if (!force && this.dashboardWearInsightsLoadState() === 'loaded') {
      return;
    }

    this.dashboardWearInsightsLoadState.set('loading');
    const loadPromise = firstValueFrom(this.dashboardApi.wearInsights())
      .then((wearInsights) => {
        this.dashboardWearInsightsData.set(mapDashboardWearInsightsDtoToModel(wearInsights));
        this.dashboardWearInsightsLoadState.set('loaded');
      })
      .catch((error) => {
        this.dashboardWearInsightsLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.dashboardWearInsightsLoadPromise === loadPromise) {
          this.dashboardWearInsightsLoadPromise = null;
        }
      });
    this.dashboardWearInsightsLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadDashboardRecentlyAddedData(force: boolean): Promise<void> {
    if (this.dashboardSummaryLoadPromise) {
      return this.dashboardSummaryLoadPromise;
    }
    if (this.dashboardRecentlyAddedLoadPromise) {
      return this.dashboardRecentlyAddedLoadPromise;
    }
    if (!force && this.dashboardRecentlyAddedLoadState() === 'loaded') {
      return;
    }

    this.dashboardRecentlyAddedLoadState.set('loading');
    const loadPromise = firstValueFrom(this.dashboardApi.recentlyAdded())
      .then((recentlyAdded) => {
        this.dashboardRecentlyAddedData.set(mapDashboardRecentlyAddedDtoToModel(recentlyAdded));
        this.dashboardRecentlyAddedLoadState.set('loaded');
      })
      .catch((error) => {
        this.dashboardRecentlyAddedLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.dashboardRecentlyAddedLoadPromise === loadPromise) {
          this.dashboardRecentlyAddedLoadPromise = null;
        }
      });
    this.dashboardRecentlyAddedLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadDashboardCategoryBreakdownData(force: boolean): Promise<void> {
    if (this.dashboardSummaryLoadPromise) {
      return this.dashboardSummaryLoadPromise;
    }
    if (this.dashboardCategoryBreakdownLoadPromise) {
      return this.dashboardCategoryBreakdownLoadPromise;
    }
    if (!force && this.dashboardCategoryBreakdownLoadState() === 'loaded') {
      return;
    }

    this.dashboardCategoryBreakdownLoadState.set('loading');
    const loaderStartedAt = Date.now();
    const loadPromise = firstValueFrom(this.dashboardApi.categoryBreakdown())
      .then(async (categoryBreakdown) => {
        this.dashboardCategoryBreakdownData.set(
          mapDashboardCategoryBreakdownDtoToModel(categoryBreakdown),
        );
        await this.ensureDashboardLoaderMinimumDuration(loaderStartedAt);
        this.dashboardCategoryBreakdownLoadState.set('loaded');
      })
      .catch((error) => {
        this.dashboardCategoryBreakdownLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.dashboardCategoryBreakdownLoadPromise === loadPromise) {
          this.dashboardCategoryBreakdownLoadPromise = null;
        }
      });
    this.dashboardCategoryBreakdownLoadPromise = loadPromise;
    return loadPromise;
  }

  private async loadDashboardSummaryData(force: boolean): Promise<void> {
    if (this.dashboardSummaryLoadPromise) {
      return this.dashboardSummaryLoadPromise;
    }
    if (
      !force &&
      this.dashboardCountersLoadState() === 'loaded' &&
      this.dashboardWearInsightsLoadState() === 'loaded' &&
      this.dashboardRecentlyAddedLoadState() === 'loaded' &&
      this.dashboardCategoryBreakdownLoadState() === 'loaded'
    ) {
      return;
    }

    const inFlightSectionLoads = [
      this.dashboardCountersLoadPromise,
      this.dashboardWearInsightsLoadPromise,
      this.dashboardRecentlyAddedLoadPromise,
      this.dashboardCategoryBreakdownLoadPromise,
    ].filter((promise): promise is Promise<void> => promise !== null);
    if (inFlightSectionLoads.length) {
      await Promise.all(inFlightSectionLoads);
      if (
        !force &&
        this.dashboardCountersLoadState() === 'loaded' &&
        this.dashboardWearInsightsLoadState() === 'loaded' &&
        this.dashboardRecentlyAddedLoadState() === 'loaded' &&
        this.dashboardCategoryBreakdownLoadState() === 'loaded'
      ) {
        return;
      }
    }

    this.dashboardCountersLoadState.set('loading');
    this.dashboardWearInsightsLoadState.set('loading');
    this.dashboardRecentlyAddedLoadState.set('loading');
    this.dashboardCategoryBreakdownLoadState.set('loading');

    const loaderStartedAt = Date.now();
    const loadPromise = firstValueFrom(this.dashboardApi.summary())
      .then(async (summary) => {
        this.dashboardCountersData.set(mapDashboardCountersDtoToModel(summary));
        this.dashboardWearInsightsData.set(mapDashboardWearInsightsDtoToModel(summary));
        this.dashboardRecentlyAddedData.set(mapDashboardRecentlyAddedDtoToModel(summary));
        this.dashboardCategoryBreakdownData.set(mapDashboardCategoryBreakdownDtoToModel(summary));
        await this.ensureDashboardLoaderMinimumDuration(loaderStartedAt);
        this.dashboardCountersLoadState.set('loaded');
        this.dashboardWearInsightsLoadState.set('loaded');
        this.dashboardRecentlyAddedLoadState.set('loaded');
        this.dashboardCategoryBreakdownLoadState.set('loaded');
      })
      .catch((error) => {
        this.dashboardCountersLoadState.set('error');
        this.dashboardWearInsightsLoadState.set('error');
        this.dashboardRecentlyAddedLoadState.set('error');
        this.dashboardCategoryBreakdownLoadState.set('error');
        throw error;
      })
      .finally(() => {
        if (this.dashboardSummaryLoadPromise === loadPromise) {
          this.dashboardSummaryLoadPromise = null;
        }
      });
    this.dashboardSummaryLoadPromise = loadPromise;
    return loadPromise;
  }

  private async ensureDashboardLoaderMinimumDuration(startedAt: number): Promise<void> {
    const minimumDurationMs = this.getDashboardDebugLoaderDelayMs();
    if (minimumDurationMs <= 0) {
      return;
    }

    const elapsedMs = Date.now() - startedAt;
    const remainingMs = minimumDurationMs - elapsedMs;
    if (remainingMs <= 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, remainingMs);
    });
  }

  private getDashboardDebugLoaderDelayMs(): number {
    if (!isDevMode()) {
      return 0;
    }

    try {
      const rawValue = globalThis.localStorage?.getItem(
        DASHBOARD_DEBUG_LOADER_DELAY_MS_STORAGE_KEY,
      );
      const parsedValue = Number(rawValue ?? '');
      if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
        return 0;
      }
      return Math.floor(parsedValue);
    } catch {
      return 0;
    }
  }

  private mergeDistinctById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
    if (incoming.length === 0) {
      return existing;
    }
    const seen = new Set(existing.map((item) => item.id));
    const merged = [...existing];
    for (const item of incoming) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
    return merged;
  }

  private upsertById<T extends { id: string }>(existing: T[], incoming: T): T[] {
    const index = existing.findIndex((item) => item.id === incoming.id);
    if (index === -1) {
      return [...existing, incoming];
    }
    const updated = [...existing];
    updated[index] = incoming;
    return updated;
  }

  private hasCompleteImageGallery(item: { imageUrls: string[]; imageCount?: number }): boolean {
    const declaredImageCount = item.imageCount ?? item.imageUrls.length;
    return item.imageUrls.length >= declaredImageCount;
  }

  private syncDashboardFavoriteCount(
    previousFavorite: boolean | undefined,
    nextFavorite: boolean | undefined,
  ): void {
    if (previousFavorite === undefined || nextFavorite === undefined || previousFavorite === nextFavorite) {
      return;
    }

    this.dashboardCountersData.update((counters) => {
      if (!counters) {
        return counters;
      }
      const delta = nextFavorite ? 1 : -1;
      return {
        ...counters,
        favoriteCount: Math.max(0, counters.favoriteCount + delta),
      };
    });
  }

  private syncDashboardWardrobeItem(updatedItem: WardrobeItem): void {
    this.dashboardRecentlyAddedData.update((items) => {
      if (!items) {
        return items;
      }
      return items.map((item) => (item.id === updatedItem.id ? updatedItem : item));
    });

    this.dashboardWearInsightsData.update((insights) => {
      if (!insights) {
        return insights;
      }
      const mostWornItem =
        insights.mostWornItem?.id === updatedItem.id ? updatedItem : insights.mostWornItem;
      const leastWornItems = insights.leastWornItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      );
      return {
        ...insights,
        mostWornItem,
        leastWornItems,
      };
    });
  }
}

