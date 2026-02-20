import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CatalogOptionsApi } from '../api/catalog-options.api';
import type { CatalogCategoryOptionDto } from '../dto/catalog-options.dto';
import {
  ACCESSORY_CATEGORIES,
  AccessoryCategoryInfo,
  CategoryInfo,
  OCCASION_OPTIONS,
  WARDROBE_CATEGORIES,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CatalogOptionsService {
  private readonly catalogOptionsApi = inject(CatalogOptionsApi);

  private readonly wardrobeCategoriesState = signal<CategoryInfo[]>(WARDROBE_CATEGORIES);
  private readonly accessoryCategoriesState = signal<AccessoryCategoryInfo[]>(ACCESSORY_CATEGORIES);
  private readonly occasionOptionsState = signal<string[]>(OCCASION_OPTIONS);

  private wardrobeOptionsLoaded = false;
  private accessoryOptionsLoaded = false;
  private wardrobeOptionsLoadPromise: Promise<void> | null = null;
  private accessoryOptionsLoadPromise: Promise<void> | null = null;

  readonly wardrobeCategories = this.wardrobeCategoriesState.asReadonly();
  readonly accessoryCategories = this.accessoryCategoriesState.asReadonly();
  readonly occasionOptions = this.occasionOptionsState.asReadonly();

  clearAll(): void {
    this.wardrobeCategoriesState.set(WARDROBE_CATEGORIES);
    this.accessoryCategoriesState.set(ACCESSORY_CATEGORIES);
    this.occasionOptionsState.set(OCCASION_OPTIONS);
    this.wardrobeOptionsLoaded = false;
    this.accessoryOptionsLoaded = false;
    this.wardrobeOptionsLoadPromise = null;
    this.accessoryOptionsLoadPromise = null;
  }

  async ensureWardrobeOptionsLoaded(force = false): Promise<void> {
    if (this.wardrobeOptionsLoadPromise) {
      return this.wardrobeOptionsLoadPromise;
    }
    if (!force && this.wardrobeOptionsLoaded) {
      return;
    }
    const loadPromise = firstValueFrom(this.catalogOptionsApi.wardrobeOptions())
      .then((response) => {
        this.wardrobeCategoriesState.set(
          this.normalizeCategoryOptions(response.categories, WARDROBE_CATEGORIES, 'checkroom'),
        );
        this.occasionOptionsState.set(this.normalizeOccasionOptions(response.occasions));
        this.wardrobeOptionsLoaded = true;
      })
      .finally(() => {
        if (this.wardrobeOptionsLoadPromise === loadPromise) {
          this.wardrobeOptionsLoadPromise = null;
        }
      });
    this.wardrobeOptionsLoadPromise = loadPromise;
    return loadPromise;
  }

  async ensureAccessoryOptionsLoaded(force = false): Promise<void> {
    if (this.accessoryOptionsLoadPromise) {
      return this.accessoryOptionsLoadPromise;
    }
    if (!force && this.accessoryOptionsLoaded) {
      return;
    }
    const loadPromise = firstValueFrom(this.catalogOptionsApi.accessoryOptions())
      .then((response) => {
        this.accessoryCategoriesState.set(
          this.normalizeCategoryOptions(response.categories, ACCESSORY_CATEGORIES, 'watch'),
        );
        this.occasionOptionsState.set(this.normalizeOccasionOptions(response.occasions));
        this.accessoryOptionsLoaded = true;
      })
      .finally(() => {
        if (this.accessoryOptionsLoadPromise === loadPromise) {
          this.accessoryOptionsLoadPromise = null;
        }
      });
    this.accessoryOptionsLoadPromise = loadPromise;
    return loadPromise;
  }

  async addWardrobeCategory(label: string): Promise<CategoryInfo> {
    const created = await firstValueFrom(this.catalogOptionsApi.addWardrobeCategory(label));
    const next = this.toCategoryOption(created, 'checkroom');
    this.wardrobeCategoriesState.update((current) => this.upsertCategoryOption(current, next));
    return next;
  }

  async addAccessoryCategory(label: string): Promise<AccessoryCategoryInfo> {
    const created = await firstValueFrom(this.catalogOptionsApi.addAccessoryCategory(label));
    const next = this.toCategoryOption(created, 'watch');
    this.accessoryCategoriesState.update((current) => this.upsertCategoryOption(current, next));
    return next;
  }

  async addOccasion(value: string): Promise<string> {
    const response = await firstValueFrom(this.catalogOptionsApi.addOccasion(value));
    const normalized = response.value.trim();
    this.occasionOptionsState.update((current) => {
      const exists = current.some((option) => option.toLowerCase() === normalized.toLowerCase());
      if (exists) {
        return current;
      }
      return [...current, normalized];
    });
    return normalized;
  }

  private normalizeCategoryOptions<T extends { id: string; label: string; icon: string }>(
    incoming: CatalogCategoryOptionDto[],
    fallback: T[],
    fallbackIcon: string,
  ): T[] {
    if (!incoming.length) {
      return fallback;
    }
    const deduplicated = new Map<string, T>();
    for (const option of incoming) {
      const normalizedId = option.id.trim();
      if (!normalizedId.length) {
        continue;
      }
      deduplicated.set(normalizedId, this.toCategoryOption(option, fallbackIcon) as T);
    }
    return Array.from(deduplicated.values());
  }

  private normalizeOccasionOptions(incoming: string[]): string[] {
    const source = incoming.length ? incoming : OCCASION_OPTIONS;
    const deduplicated = new Map<string, string>();
    for (const option of source) {
      const normalized = option.trim();
      if (!normalized.length) {
        continue;
      }
      const dedupeKey = normalized.toLowerCase();
      if (!deduplicated.has(dedupeKey)) {
        deduplicated.set(dedupeKey, normalized);
      }
    }
    return Array.from(deduplicated.values());
  }

  private toCategoryOption(
    dto: CatalogCategoryOptionDto,
    fallbackIcon: string,
  ): CategoryInfo {
    return {
      id: dto.id.trim(),
      label: dto.label.trim(),
      icon: dto.icon?.trim() || fallbackIcon,
    };
  }

  private upsertCategoryOption<T extends { id: string }>(current: T[], next: T): T[] {
    const existingIndex = current.findIndex((option) => option.id === next.id);
    if (existingIndex === -1) {
      return [...current, next];
    }
    const updated = [...current];
    updated[existingIndex] = next;
    return updated;
  }
}
