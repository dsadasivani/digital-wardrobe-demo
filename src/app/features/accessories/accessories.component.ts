import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Accessory, WardrobeItem } from '../../core/models';
import { CatalogOptionsService } from '../../core/services';
import { WardrobeService } from '../../core/services/wardrobe.service';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';

type AccessorySortOption = 'recent' | 'name' | 'brand' | 'worn';
type AccessoryQuickFilter = 'all' | 'favorites' | 'lowRotation';

interface AccessoryFilterPreset {
  id: AccessoryQuickFilter;
  label: string;
  icon: string;
}

interface AccessoryColorOption {
  key: string;
  name: string;
  hex: string;
  count: number;
}

const ACCESSORY_FILTER_PRESETS: readonly AccessoryFilterPreset[] = [
  { id: 'all', label: 'All Accessories', icon: 'style' },
  { id: 'favorites', label: 'Favorites', icon: 'favorite' },
  { id: 'lowRotation', label: 'Low Rotation', icon: 'history_toggle_off' },
];

const ACCESSORY_LOADING_ICONS = ['watch', 'style', 'diamond', 'checkroom', 'auto_awesome'] as const;
const LIST_LOADING_PLACEHOLDERS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-accessories',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    ItemCardComponent,
  ],
  template: `
    <div class="accessories-page animate-fade-in">
      <section class="hero-panel card">
        <div class="hero-header">
          <div class="header-copy">
            <h1>Accessories</h1>
            <p class="subtitle">{{ filteredAccessories().length }} of {{ totalAccessoriesCount() }} items in view</p>
          </div>

          <div class="header-actions desktop-actions">
            <button type="button" class="action-btn secondary" [matMenuTriggerFor]="sortMenu">
              <mat-icon>sort</mat-icon>
              <span>Sort: {{ sortLabel() }}</span>
            </button>
            <button class="action-btn primary" routerLink="/accessories/add">
              <mat-icon>add</mat-icon><span>Add Accessory</span>
            </button>
          </div>

          <div class="header-actions mobile-actions">
            <button type="button" class="action-btn secondary" [matMenuTriggerFor]="sortMenu" aria-label="Sort accessories">
              <mat-icon>sort</mat-icon>
            </button>
          </div>
        </div>

        <div class="preset-filters" role="group" aria-label="Accessory quick filters">
          @for (preset of filterPresets; track preset.id) {
            <button
              type="button"
              class="preset-chip"
              [class.active]="activeQuickFilter() === preset.id"
              (click)="setQuickFilter(preset.id)">
              <mat-icon>{{ preset.icon }}</mat-icon>
              <span>{{ preset.label }}</span>
              <strong>{{ getQuickFilterCount(preset.id) }}</strong>
            </button>
          }
        </div>

        <mat-menu #sortMenu="matMenu">
          <button mat-menu-item (click)="sortBy('recent')">
            <mat-icon>schedule</mat-icon>
            <span>Recently Added</span>
          </button>
          <button mat-menu-item (click)="sortBy('name')">
            <mat-icon>sort_by_alpha</mat-icon>
            <span>Name</span>
          </button>
          <button mat-menu-item (click)="sortBy('brand')">
            <mat-icon>branding_watermark</mat-icon>
            <span>Brand</span>
          </button>
          <button mat-menu-item (click)="sortBy('worn')">
            <mat-icon>repeat</mat-icon>
            <span>Most Worn</span>
          </button>
        </mat-menu>
      </section>

      <section class="filters-section glass">
        <div class="search-container">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            type="text"
            class="search-input"
            placeholder="Search accessories, brands, tags..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)">
          @if (searchQuery()) {
            <button class="clear-btn" type="button" (click)="searchQuery.set('')" aria-label="Clear search">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <div class="filters-row">
          <div class="color-filters" role="group" aria-label="Filter by color">
            <span class="filter-label">Colors</span>
            @if (availableColorOptions().length > 0) {
              @for (color of availableColorOptions(); track color.key) {
                <button
                  type="button"
                  class="color-chip"
                  [class.selected]="selectedColors().includes(color.key)"
                  [style.--chip-color]="color.hex"
                  (click)="toggleColor(color.key)"
                  [attr.aria-label]="'Filter ' + color.name"
                  [attr.aria-pressed]="selectedColors().includes(color.key)"
                  [matTooltip]="color.name + ' (' + color.count + ')'">
                </button>
              }
            } @else {
              <span class="no-colors-text">No colors available</span>
            }
          </div>

          @if (hasActiveFilters()) {
            <button type="button" class="clear-filters-btn" (click)="clearAllFilters()">
              <mat-icon>filter_alt_off</mat-icon>
              <span>Clear Filters</span>
            </button>
          }
        </div>
      </section>

      <section class="category-chips" role="group" aria-label="Accessory categories">
        <button
          type="button"
          class="chip"
          [class.active]="selectedCategory() === 'all'"
          (click)="selectedCategory.set('all')">
          All
        </button>
        @for (entry of categories(); track entry.id) {
          <button
            type="button"
            class="chip"
            [class.active]="selectedCategory() === entry.id"
            (click)="selectedCategory.set(entry.id)">
            <mat-icon>{{ entry.icon }}</mat-icon>
            {{ entry.label }}
            <span>{{ getCategoryCount(entry.id) }}</span>
          </button>
        }
      </section>

      <section class="result-toolbar">
        <div class="result-summary">
          <span class="result-count">{{ filteredAccessories().length }} results</span>
          @if (selectedCategory() !== 'all') {
            <span class="active-filter-chip">
              <mat-icon>sell</mat-icon>
              <span>{{ selectedCategoryLabel() }}</span>
            </span>
          }
          @if (selectedColors().length > 0) {
            <span class="active-filter-chip">
              <mat-icon>palette</mat-icon>
              <span>{{ selectedColors().length }} colors</span>
            </span>
          }
          @if (searchQuery()) {
            <span class="active-filter-chip">
              <mat-icon>manage_search</mat-icon>
              <span>{{ searchQuery() }}</span>
            </span>
          }
        </div>
        <span class="sort-indicator">Sorted by {{ sortLabel() }}</span>
      </section>

      @if (isInitialLoading()) {
        <div class="items-grid">
          @for (placeholder of loadingPlaceholders; track placeholder) {
            <article class="dw-list-skeleton-card" aria-hidden="true">
              <div class="dw-list-skeleton-media">
                <mat-icon>{{ loadingIcons[$index % loadingIcons.length] }}</mat-icon>
              </div>
              <div class="dw-list-skeleton-content">
                <span class="dw-list-skeleton-line"></span>
                <span class="dw-list-skeleton-line medium"></span>
                <div class="dw-list-skeleton-chip-row">
                  <span class="dw-list-skeleton-chip"></span>
                  <span class="dw-list-skeleton-chip"></span>
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="items-grid">
          @for (item of filteredAccessories(); track item.id) {
            <dw-item-card
              [item]="item"
              [favoritePending]="isFavoritePending(item.id)"
              [deletePending]="isDeletePending(item.id)"
              (viewItem)="onViewItem($event)"
              (editItem)="onEditItem($event)"
              (deleteItem)="onDeleteItem($event)"
              (toggleFavorite)="onToggleFavorite($event)"
              (addToOutfit)="onAddToOutfit($event)">
            </dw-item-card>
          } @empty {
            <div class="empty-state">
              <div class="empty-icon">
                <mat-icon>watch</mat-icon>
              </div>
              <h3>No accessories found</h3>
              <p>
                @if (hasActiveFilters()) {
                  Try adjusting your search or filters.
                } @else {
                  Add your first accessory to complete your wardrobe.
                }
              </p>
              <button class="action-btn primary" routerLink="/accessories/add">
                <mat-icon>add</mat-icon>
                Add Accessory
              </button>
            </div>
          }
        </div>
      }

      @if (hasMoreAccessories()) {
        <div class="load-more-row">
          <button class="action-btn" type="button" (click)="onLoadMore()" [disabled]="isLoadingMoreAccessories()">
            @if (isLoadingMoreAccessories()) {
              <mat-icon>hourglass_top</mat-icon>
              Loading...
            } @else {
              <mat-icon>expand_more</mat-icon>
              Load More
            }
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    .accessories-page {
      padding: var(--dw-spacing-xl);
      max-width: 1420px;
      margin: 0 auto;
    }

    .hero-panel {
      padding: var(--dw-spacing-lg);
      margin-bottom: var(--dw-spacing-lg);
      display: grid;
      gap: var(--dw-spacing-md);
      background:
        radial-gradient(
          circle at 88% 12%,
          color-mix(in srgb, var(--dw-accent) 14%, transparent),
          transparent 44%
        ),
        var(--dw-gradient-card);
    }

    .hero-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--dw-spacing-md);
    }

    .header-copy {
      min-width: 0;

      h1 {
        margin-bottom: var(--dw-spacing-xs);
      }
    }

    .subtitle {
      margin: 0;
      color: var(--dw-text-secondary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-sm);
    }

    .mobile-actions {
      display: none;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--dw-radius-md);
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--dw-border-subtle);
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);

      &:disabled {
        cursor: default;
        opacity: 0.72;
      }

      &.primary {
        border: none;
        background: var(--dw-gradient-primary);
        color: var(--dw-on-primary);
      }

      &.secondary {
        background: var(--dw-surface-card);
      }
    }

    .preset-filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--dw-spacing-sm);
    }

    .preset-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: var(--dw-radius-full);
      border: 1px solid var(--dw-border-subtle);
      background: color-mix(in srgb, var(--dw-surface-elevated) 76%, transparent);
      color: var(--dw-text-secondary);
      cursor: pointer;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;

      strong {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 20px;
        padding: 0 5px;
        border-radius: var(--dw-radius-full);
        font-size: 11px;
        color: var(--dw-text-primary);
        background: color-mix(in srgb, var(--dw-primary) 12%, transparent);
      }

      mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
      }

      &.active {
        border-color: color-mix(in srgb, var(--dw-primary) 42%, transparent);
        color: var(--dw-text-primary);
        background: color-mix(in srgb, var(--dw-primary) 16%, transparent);
      }
    }

    .filters-section {
      display: grid;
      grid-template-columns: minmax(300px, 1fr) minmax(360px, 1fr);
      align-items: center;
      gap: var(--dw-spacing-sm);
      padding: var(--dw-spacing-md) var(--dw-spacing-lg);
      border-radius: var(--dw-radius-lg);
      margin-bottom: var(--dw-spacing-sm);
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--dw-surface-card);
      border-radius: var(--dw-radius-md);
      padding: 0 12px;
      min-height: 44px;
      border: 1px solid transparent;

      &:focus-within {
        border-color: color-mix(in srgb, var(--dw-primary) 35%, transparent);
      }
    }

    .search-icon {
      color: var(--dw-text-muted);
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      color: var(--dw-text-primary);
    }

    .clear-btn {
      border: none;
      background: transparent;
      color: var(--dw-text-muted);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
    }

    .filters-row {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--dw-spacing-sm);
      min-width: 0;
    }

    .color-filters {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--dw-spacing-sm);
      flex-wrap: wrap;
    }

    .filter-label {
      color: var(--dw-text-secondary);
      font-size: 13px;
      white-space: nowrap;
    }

    .color-chip {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid color-mix(in srgb, var(--dw-text-primary) 28%, transparent);
      background: var(--chip-color);
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.35),
        0 1px 3px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      padding: 0;

      &.selected {
        border-color: color-mix(in srgb, var(--dw-primary) 55%, transparent);
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.55),
          0 0 0 2px color-mix(in srgb, var(--dw-primary) 52%, transparent);
      }
    }

    .clear-filters-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border: 1px solid color-mix(in srgb, var(--dw-primary) 22%, transparent);
      border-radius: var(--dw-radius-full);
      background: transparent;
      color: var(--dw-text-secondary);
      cursor: pointer;
    }

    .no-colors-text {
      color: var(--dw-text-muted);
      font-size: 12px;
    }

    .category-chips {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 4px 0 8px;
      margin-bottom: 4px;
      scrollbar-width: none;
    }

    .category-chips::-webkit-scrollbar {
      display: none;
    }

    .chip {
      border: 1px solid var(--dw-border-subtle);
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      border-radius: 999px;
      padding: 7px 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      cursor: pointer;
    }

    .chip span {
      font-size: 11px;
      color: var(--dw-text-secondary);
    }

    .chip.active {
      background: var(--dw-gradient-primary);
      color: var(--dw-on-primary);
      border-color: transparent;
    }

    .chip.active span {
      color: color-mix(in srgb, var(--dw-on-primary) 82%, transparent);
    }

    .chip mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
    }

    .result-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--dw-spacing-md);
      flex-wrap: wrap;
      margin: 6px 0 var(--dw-spacing-md);
    }

    .result-summary {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .result-count {
      font-size: 12px;
      color: var(--dw-text-secondary);
      padding: 4px 10px;
      border-radius: var(--dw-radius-full);
      background: color-mix(in srgb, var(--dw-primary) 8%, transparent);
    }

    .active-filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: var(--dw-radius-full);
      border: 1px solid color-mix(in srgb, var(--dw-primary) 20%, transparent);
      color: var(--dw-text-secondary);
      background: color-mix(in srgb, var(--dw-surface-elevated) 70%, transparent);
      font-size: 12px;
    }

    .sort-indicator {
      color: var(--dw-text-secondary);
      font-size: 12px;
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--dw-spacing-lg);
    }

    .load-more-row {
      display: flex;
      justify-content: center;
      margin-top: var(--dw-spacing-lg);
    }

    .empty-state {
      grid-column: 1/-1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--dw-spacing-2xl);
      text-align: center;
    }

    .empty-icon {
      width: 100px;
      height: 100px;
      background: var(--dw-surface-card);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--dw-spacing-lg);
    }

    .empty-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--dw-text-muted);
    }

    .empty-state h3 {
      margin-bottom: var(--dw-spacing-sm);
    }

    .empty-state p {
      color: var(--dw-text-secondary);
      margin: 0 0 var(--dw-spacing-lg);
      max-width: 320px;
    }

    @media (max-width: 768px) {
      .accessories-page {
        padding: var(--dw-spacing-md);
        padding-bottom: calc(var(--dw-mobile-nav-height) + var(--dw-safe-bottom) + 16px);
      }

      .hero-panel {
        padding: var(--dw-spacing-md);
      }

      .desktop-actions {
        display: none;
      }

      .mobile-actions {
        display: flex;
      }

      .preset-filters {
        flex-wrap: wrap;
        overflow-x: visible;
        row-gap: 8px;
      }

      .filters-section {
        grid-template-columns: 1fr;
        padding: var(--dw-spacing-md);
      }

      .filters-row {
        align-items: flex-start;
        justify-content: flex-start;
        flex-direction: column;
      }

      .color-filters {
        justify-content: flex-start;
      }

      .sort-indicator {
        display: none;
      }

      .items-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

    }
  `],
})
export class AccessoriesComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private catalogOptionsService = inject(CatalogOptionsService);
  private router = inject(Router);

  accessories = this.wardrobeService.accessoryList;
  totalAccessories = this.wardrobeService.accessoriesTotalElements;
  hasMoreAccessories = this.wardrobeService.hasMoreAccessoriesPages;
  isLoadingMoreAccessories = this.wardrobeService.accessoriesPageLoading;
  isInitialLoading = computed(
    () => this.isLoadingMoreAccessories() && this.accessories().length === 0,
  );
  readonly filterPresets = ACCESSORY_FILTER_PRESETS;
  readonly loadingIcons = ACCESSORY_LOADING_ICONS;
  readonly loadingPlaceholders = LIST_LOADING_PLACEHOLDERS;
  categories = this.catalogOptionsService.accessoryCategories;

  searchQuery = signal('');
  selectedCategory = signal<'all' | Accessory['category']>('all');
  selectedColors = signal<string[]>([]);
  activeQuickFilter = signal<AccessoryQuickFilter>('all');
  sortOption = signal<AccessorySortOption>('recent');

  ngOnInit(): void {
    void this.loadAccessories();
    void this.loadCategoryOptions();
  }

  filteredAccessories = computed(() => {
    let items = [...this.accessories()];
    const query = this.searchQuery().trim().toLowerCase();
    const selectedCategory = this.selectedCategory();

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    switch (this.activeQuickFilter()) {
      case 'favorites':
        items = items.filter(item => item.favorite);
        break;
      case 'lowRotation':
        items = items.filter(item => item.worn < 5);
        break;
      default:
        break;
    }

    if (query) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.brand ?? '').toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query),
      );
    }

    const selectedColors = this.selectedColors();
    if (selectedColors.length > 0) {
      const selectedColorSet = new Set(selectedColors);
      items = items.filter(item => selectedColorSet.has(this.normalizeColorKey(item.color)));
    }

    switch (this.sortOption()) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'brand':
        items.sort((a, b) => (a.brand ?? '').localeCompare(b.brand ?? ''));
        break;
      case 'worn':
        items.sort((a, b) => b.worn - a.worn);
        break;
      case 'recent':
      default:
        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    return items;
  });

  totalAccessoriesCount = computed(() => {
    const total = this.totalAccessories();
    return total > 0 ? total : this.accessories().length;
  });

  favoriteCount = computed(() => this.accessories().filter(item => item.favorite).length);
  lowRotationCount = computed(() => this.accessories().filter(item => item.worn < 5).length);
  hasActiveFilters = computed(
    () =>
      this.activeQuickFilter() !== 'all' ||
      this.searchQuery().trim().length > 0 ||
      this.selectedCategory() !== 'all' ||
      this.selectedColors().length > 0,
  );
  sortLabel = computed(() => {
    switch (this.sortOption()) {
      case 'name':
        return 'Name';
      case 'brand':
        return 'Brand';
      case 'worn':
        return 'Most Worn';
      case 'recent':
      default:
        return 'Recently Added';
    }
  });
  selectedCategoryLabel = computed(() => {
    const selectedCategory = this.selectedCategory();
    if (selectedCategory === 'all') {
      return 'All';
    }
    const match = this.categories().find(item => item.id === selectedCategory);
    return match?.label ?? selectedCategory;
  });
  availableColorOptions = computed<AccessoryColorOption[]>(() => {
    const colorByKey = new Map<string, AccessoryColorOption>();
    for (const item of this.accessories()) {
      const key = this.normalizeColorKey(item.color);
      if (!key) {
        continue;
      }

      const existing = colorByKey.get(key);
      if (existing) {
        existing.count += 1;
        if (existing.hex === '#b9b0a4' && item.colorHex) {
          existing.hex = this.getDisplayColorHex(item.colorHex);
        }
        continue;
      }

      colorByKey.set(key, {
        key,
        name: this.toDisplayLabel(item.color),
        hex: this.getDisplayColorHex(item.colorHex),
        count: 1,
      });
    }

    return Array.from(colorByKey.values()).sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }
      return left.name.localeCompare(right.name);
    });
  });

  getQuickFilterCount(filter: AccessoryQuickFilter): number {
    switch (filter) {
      case 'favorites':
        return this.favoriteCount();
      case 'lowRotation':
        return this.lowRotationCount();
      case 'all':
      default:
        return this.accessories().length;
    }
  }

  setQuickFilter(filter: AccessoryQuickFilter): void {
    this.activeQuickFilter.set(filter);
  }

  sortBy(option: AccessorySortOption): void {
    this.sortOption.set(option);
  }

  toggleColor(color: string): void {
    this.selectedColors.update((colors) => {
      if (colors.includes(color)) {
        return colors.filter((existingColor) => existingColor !== color);
      }
      return [...colors, color];
    });
  }

  clearAllFilters(): void {
    this.activeQuickFilter.set('all');
    this.searchQuery.set('');
    this.selectedCategory.set('all');
    this.selectedColors.set([]);
  }

  getCategoryCount(category: string): number {
    return this.accessories().filter(item => item.category === category).length;
  }

  onViewItem(item: WardrobeItem | Accessory): void {
    this.router.navigate(['/accessories', item.id]);
  }

  onEditItem(item: WardrobeItem | Accessory): void {
    this.router.navigate(['/accessories', item.id, 'edit']);
  }

  async onDeleteItem(item: WardrobeItem | Accessory): Promise<void> {
    if (confirm(`Delete "${item.name}" from accessories?`)) {
      try {
        await this.wardrobeService.deleteAccessory(item.id);
      } catch {
        // Keep collection interactions responsive if delete fails.
      }
    }
  }

  async onToggleFavorite(item: WardrobeItem | Accessory): Promise<void> {
    try {
      await this.wardrobeService.toggleAccessoryFavorite(item.id);
    } catch {
      // Keep collection interactions responsive if favorite update fails.
    }
  }

  onAddToOutfit(_item: WardrobeItem | Accessory): void {
    this.router.navigate(['/outfit-canvas']);
  }

  isFavoritePending(itemId: string): boolean {
    return this.wardrobeService.isFavoriteMutationPending(itemId);
  }

  isDeletePending(itemId: string): boolean {
    return this.wardrobeService.isDeleteMutationPending(itemId);
  }

  private normalizeColorKey(color: string | null | undefined): string {
    return color?.trim().toLowerCase() ?? '';
  }

  private toDisplayLabel(value: string | null | undefined): string {
    const normalized = this.normalizeColorKey(value);
    if (!normalized) {
      return 'Unknown';
    }

    return normalized
      .split(/\s+/)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }

  private getDisplayColorHex(colorHex: string | null | undefined): string {
    const normalizedHex = colorHex?.trim() ?? '';
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(normalizedHex)) {
      return normalizedHex;
    }
    return '#b9b0a4';
  }

  private async loadAccessories(): Promise<void> {
    try {
      await this.wardrobeService.ensureAccessoriesPageLoaded();
    } catch {
      // Allow local filters and shell to remain interactive.
    }
  }

  onLoadMore(): void {
    void this.loadNextPage();
  }

  private async loadNextPage(): Promise<void> {
    try {
      await this.wardrobeService.loadNextAccessoriesPage();
    } catch {
      // Keep local interactions responsive on intermittent paging failures.
    }
  }

  private async loadCategoryOptions(): Promise<void> {
    try {
      await this.catalogOptionsService.ensureAccessoryOptionsLoaded();
    } catch {
      // Keep list interactive with fallback options when metadata loading fails.
    }
  }
}

