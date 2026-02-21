import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CatalogOptionsService } from '../../../core/services';
import { WardrobeService } from '../../../core/services/wardrobe.service';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { Accessory, WardrobeCategory, WardrobeItem } from '../../../core/models';

type WardrobeSortOption = 'name' | 'recent' | 'worn' | 'price';
type WardrobePresetFilter = 'all' | 'favorites' | 'unused';

interface WardrobeFilterPreset {
  id: WardrobePresetFilter;
  label: string;
  icon: string;
}

interface WardrobeColorOption {
  key: string;
  name: string;
  hex: string;
  count: number;
}

const WARDROBE_FILTER_PRESETS: readonly WardrobeFilterPreset[] = [
  { id: 'all', label: 'All Pieces', icon: 'checkroom' },
  { id: 'favorites', label: 'Favorites', icon: 'favorite' },
  { id: 'unused', label: 'Low Rotation', icon: 'history_toggle_off' },
];

const WARDROBE_LOADING_ICONS = [
  'checkroom',
  'dry_cleaning',
  'style',
  'hiking',
  'diamond',
  'local_mall',
] as const;
const LIST_LOADING_PLACEHOLDERS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-wardrobe',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    ItemCardComponent,
  ],
  template: `
    <div class="wardrobe-page animate-fade-in">
      <section class="hero-panel card">
        <div class="hero-header">
          <div class="header-copy">
            <h1>My Wardrobe</h1>
            <p class="subtitle">{{ filteredItems().length }} of {{ totalItemsCount() }} pieces in view</p>
          </div>

          <div class="header-actions desktop-actions">
            <button type="button" class="action-btn" [matMenuTriggerFor]="sortMenu">
              <mat-icon>sort</mat-icon>
              <span>Sort: {{ sortLabel() }}</span>
            </button>
            <button type="button" class="action-btn" (click)="toggleView()">
              <mat-icon>{{ viewMode() === 'grid' ? 'view_list' : 'grid_view' }}</mat-icon>
              <span>{{ viewMode() === 'grid' ? 'List View' : 'Grid View' }}</span>
            </button>
            <button type="button" class="action-btn primary" routerLink="/wardrobe/add">
              <mat-icon>add</mat-icon>
              <span>Add Item</span>
            </button>
          </div>

          <div class="header-actions mobile-actions">
            <button type="button" class="action-btn" [matMenuTriggerFor]="sortMenu" aria-label="Sort items">
              <mat-icon>sort</mat-icon>
            </button>
            <button type="button" class="action-btn" (click)="toggleView()" aria-label="Toggle list layout">
              <mat-icon>{{ viewMode() === 'grid' ? 'view_list' : 'grid_view' }}</mat-icon>
            </button>
          </div>
        </div>

        <div class="preset-filters" role="group" aria-label="Quick wardrobe filters">
          @for (preset of filterPresets; track preset.id) {
            <button
              type="button"
              class="preset-chip"
              [class.active]="activeFilter() === preset.id"
              (click)="setPresetFilter(preset.id)">
              <mat-icon>{{ preset.icon }}</mat-icon>
              <span>{{ preset.label }}</span>
              <strong>{{ getPresetCount(preset.id) }}</strong>
            </button>
          }
        </div>

        <mat-menu #sortMenu="matMenu">
          <button mat-menu-item (click)="sortBy('name')">
            <mat-icon>sort_by_alpha</mat-icon>
            <span>Name</span>
          </button>
          <button mat-menu-item (click)="sortBy('recent')">
            <mat-icon>schedule</mat-icon>
            <span>Recently Added</span>
          </button>
          <button mat-menu-item (click)="sortBy('worn')">
            <mat-icon>repeat</mat-icon>
            <span>Most Worn</span>
          </button>
          <button mat-menu-item (click)="sortBy('price')">
            <mat-icon>attach_money</mat-icon>
            <span>Price</span>
          </button>
        </mat-menu>
      </section>

      <section class="filters-section glass">
        <div class="search-container">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            type="text"
            class="search-input"
            placeholder="Search by name, brand, or tag"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)">
          @if (searchQuery()) {
            <button type="button" class="clear-btn" (click)="searchQuery.set('')" aria-label="Clear search">
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

      <section class="result-toolbar">
        <div class="result-summary">
          <span class="result-count">{{ filteredItems().length }} results</span>
          @if (selectedCategory()) {
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

      <!-- Category Tabs -->
      <mat-tab-group 
        class="category-tabs"
        [selectedIndex]="selectedTabIndex()"
        (selectedIndexChange)="onTabChange($event)">
        <mat-tab label="All ({{ allItems().length }})"></mat-tab>
        @for (cat of categories(); track cat.id) {
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon class="tab-icon">{{ cat.icon }}</mat-icon>
              {{ cat.label }} ({{ getCategoryCount(cat.id) }})
            </ng-template>
          </mat-tab>
        }
      </mat-tab-group>

      <!-- Items Grid -->
      <section class="items-section">
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
        } @else if (filteredItems().length > 0) {
          <div class="items-grid" [class.list-view]="viewMode() === 'list'">
            @for (item of filteredItems(); track item.id) {
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
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">
              <mat-icon>checkroom</mat-icon>
            </div>
            <h3>No items found</h3>
            <p>
              @if (hasActiveFilters()) {
                Try broadening filters or clearing your current selections.
              } @else {
                Start building your digital wardrobe by adding your first item.
              }
            </p>
            <button type="button" class="action-btn primary" routerLink="/wardrobe/add">
              <mat-icon>add</mat-icon>
              Add Your First Item
            </button>
          </div>
        }
      </section>

      @if (hasMoreItems()) {
        <section class="load-more-row">
          <button
            type="button"
            class="action-btn"
            (click)="onLoadMore()"
            [disabled]="isLoadingMoreItems()">
            @if (isLoadingMoreItems()) {
              <mat-icon>hourglass_top</mat-icon>
              <span>Loading...</span>
            } @else {
              <mat-icon>expand_more</mat-icon>
              <span>Load More</span>
            }
          </button>
        </section>
      }

    </div>
  `,
  styles: [`
    .wardrobe-page {
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
          circle at 90% 12%,
          color-mix(in srgb, var(--dw-accent) 16%, transparent),
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
      gap: var(--dw-spacing-sm);
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .mobile-actions {
      display: none;
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--dw-spacing-sm);
      padding: var(--dw-spacing-sm) var(--dw-spacing-md);
      border-radius: var(--dw-radius-md);
      border: 1px solid var(--dw-border-subtle);
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      font-weight: 500;
      cursor: pointer;

      &:hover {
        border-color: var(--dw-border-strong);
        background: var(--dw-surface-hover);
      }

      &:disabled {
        opacity: 0.7;
        cursor: default;
      }

      &.primary {
        background: var(--dw-gradient-primary);
        border: none;
        color: white;

        &:hover {
          transform: translateY(-1px);
          box-shadow: var(--dw-shadow-glow);
        }
      }
    }

    .preset-filters {
      display: flex;
      gap: var(--dw-spacing-sm);
      flex-wrap: wrap;
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
        border-color: color-mix(in srgb, var(--dw-primary) 38%, transparent);
        color: var(--dw-text-primary);
        background: color-mix(in srgb, var(--dw-primary) 16%, transparent);

        strong {
          background: color-mix(in srgb, var(--dw-primary) 32%, transparent);
        }
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
      gap: var(--dw-spacing-sm);
      background: var(--dw-surface-card);
      border-radius: var(--dw-radius-md);
      padding: var(--dw-spacing-sm) var(--dw-spacing-md);
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
      background: transparent;
      border: none;
      outline: none;
      color: var(--dw-text-primary);
      font-size: 14px;

      &::placeholder {
        color: var(--dw-text-muted);
      }
    }

    .clear-btn {
      background: none;
      border: none;
      color: var(--dw-text-muted);
      cursor: pointer;
      padding: 2px;
      display: inline-flex;

      &:hover {
        color: var(--dw-text-primary);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
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
      gap: var(--dw-spacing-sm);
      flex-wrap: wrap;
      justify-content: flex-end;
      min-width: 0;
    }

    .filter-label {
      color: var(--dw-text-secondary);
      font-size: 13px;
      margin-right: 2px;
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

      &:hover {
        transform: scale(1.12);
      }

      &:focus-visible {
        outline: none;
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.5),
          0 0 0 2px color-mix(in srgb, var(--dw-primary) 48%, transparent);
      }

      &.selected {
        border-color: color-mix(in srgb, var(--dw-primary) 55%, transparent);
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.55),
          0 0 0 2px color-mix(in srgb, var(--dw-primary) 52%, transparent),
          0 2px 8px -4px color-mix(in srgb, var(--dw-primary) 45%, rgba(0, 0, 0, 0.35));
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

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      &:hover {
        color: var(--dw-text-primary);
        border-color: color-mix(in srgb, var(--dw-primary) 36%, transparent);
      }
    }

    .no-colors-text {
      color: var(--dw-text-muted);
      font-size: 12px;
    }

    .result-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--dw-spacing-md);
      flex-wrap: wrap;
      margin: var(--dw-spacing-md) 0;
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

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .sort-indicator {
      color: var(--dw-text-secondary);
      font-size: 12px;
    }

    .category-tabs {
      margin-bottom: var(--dw-spacing-xl);

      ::ng-deep {
        .mat-mdc-tab-labels {
          gap: var(--dw-spacing-sm);
        }

        .mat-mdc-tab {
          background: var(--dw-surface-card);
          border-radius: var(--dw-radius-md) var(--dw-radius-md) 0 0;
          min-width: auto;
          padding: 0 var(--dw-spacing-md);
        }

        .mat-mdc-tab-header {
          border-bottom: 1px solid var(--dw-border-subtle);
        }
      }
    }

    .tab-icon {
      margin-right: 8px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .items-section {
      min-height: 400px;
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
      gap: var(--dw-spacing-lg);

      &.list-view {
        grid-template-columns: 1fr;
        
        dw-item-card {
          ::ng-deep .item-card {
            display: flex;
            flex-direction: row;
            
            .card-image {
              width: 136px;
              aspect-ratio: 1;
            }

            .card-content {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
          }
        }
      }
    }

    .empty-state {
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

      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--dw-text-muted);
      }
    }

    .empty-state h3 {
      margin-bottom: var(--dw-spacing-sm);
    }

    .empty-state p {
      color: var(--dw-text-secondary);
      margin-bottom: var(--dw-spacing-lg);
      max-width: 300px;
    }

    .load-more-row {
      display: flex;
      justify-content: center;
      margin-top: var(--dw-spacing-lg);
    }

    @media (max-width: 1100px) {
      .items-grid {
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
      }
    }

    @media (max-width: 768px) {
      .wardrobe-page {
        padding: var(--dw-spacing-md);
        padding-bottom: calc(var(--dw-mobile-nav-height) + var(--dw-safe-bottom) + 16px);
      }

      .hero-panel {
        padding: var(--dw-spacing-md);
      }

      .hero-header {
        align-items: center;
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
        flex-direction: column;
        justify-content: flex-start;
        gap: 10px;
      }

      .color-filters {
        width: 100%;
        justify-content: flex-start;
      }

      .result-toolbar {
        margin-top: 10px;
      }

      .sort-indicator {
        display: none;
      }

      .category-tabs {
        margin-bottom: var(--dw-spacing-md);

        ::ng-deep {
          .mat-mdc-tab {
            padding: 0 10px;
          }
        }
      }

      .items-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;

        &.list-view {
          grid-template-columns: 1fr;

          dw-item-card {
            ::ng-deep .item-card {
              .card-image {
                width: 114px;
              }
            }
          }
        }
      }

      .empty-state {
        padding: var(--dw-spacing-xl) var(--dw-spacing-md);
      }

    }
  `]
})
export class WardrobeComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private catalogOptionsService = inject(CatalogOptionsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  categories = this.catalogOptionsService.wardrobeCategories;
  allItems = this.wardrobeService.items;
  totalItems = this.wardrobeService.wardrobeTotalElements;
  hasMoreItems = this.wardrobeService.hasMoreWardrobePages;
  isLoadingMoreItems = this.wardrobeService.wardrobePageLoading;
  isInitialLoading = computed(() => this.isLoadingMoreItems() && this.allItems().length === 0);
  readonly filterPresets = WARDROBE_FILTER_PRESETS;
  readonly loadingIcons = WARDROBE_LOADING_ICONS;
  readonly loadingPlaceholders = LIST_LOADING_PLACEHOLDERS;

  searchQuery = signal('');
  selectedCategory = signal<WardrobeCategory | null>(null);
  selectedColors = signal<string[]>([]);
  sortOption = signal<WardrobeSortOption>('recent');
  viewMode = signal<'grid' | 'list'>('grid');
  selectedTabIndex = signal(0);
  activeFilter = signal<WardrobePresetFilter>('all');
  private routeCategoryParam = signal<string | null>(null);

  filteredItems = computed(() => {
    let items = [...this.allItems()];

    // Filter by category
    if (this.selectedCategory()) {
      items = items.filter(item => item.category === this.selectedCategory());
    }

    // Filter by dashboard presets
    switch (this.activeFilter()) {
      case 'favorites':
        items = items.filter(item => item.favorite);
        break;
      case 'unused':
        items = items.filter(item => item.worn < 5);
        break;
      default:
        break;
    }

    // Filter by search
    const query = this.searchQuery().toLowerCase();
    if (query) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filter by colors
    const colors = this.selectedColors();
    if (colors.length > 0) {
      const selectedColorSet = new Set(colors);
      items = items.filter((item) => selectedColorSet.has(this.normalizeColorKey(item.color)));
    }

    // Sort
    switch (this.sortOption()) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'worn':
        items.sort((a, b) => b.worn - a.worn);
        break;
      case 'price':
        items.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
    }

    return items;
  });

  availableColorOptions = computed<WardrobeColorOption[]>(() => {
    const colorByKey = new Map<string, WardrobeColorOption>();
    for (const item of this.allItems()) {
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

  totalItemsCount = computed(() => {
    const total = this.totalItems();
    return total > 0 ? total : this.allItems().length;
  });

  favoriteItemsCount = computed(() => this.allItems().filter((item) => item.favorite).length);
  lowRotationItemsCount = computed(() => this.allItems().filter((item) => item.worn < 5).length);
  hasActiveFilters = computed(
    () =>
      this.activeFilter() !== 'all' ||
      this.searchQuery().trim().length > 0 ||
      this.selectedColors().length > 0 ||
      this.selectedCategory() !== null,
  );
  sortLabel = computed(() => {
    switch (this.sortOption()) {
      case 'name':
        return 'Name';
      case 'recent':
        return 'Recently Added';
      case 'worn':
        return 'Most Worn';
      case 'price':
        return 'Price';
    }
  });
  selectedCategoryLabel = computed(() => {
    const selectedCategoryId = this.selectedCategory();
    if (!selectedCategoryId) {
      return 'All Categories';
    }

    const matchingCategory = this.categories().find((category) => category.id === selectedCategoryId);
    return matchingCategory?.label ?? selectedCategoryId;
  });

  ngOnInit(): void {
    void this.loadWardrobeItems();
    void this.loadCategoryOptions();

    this.route.paramMap.subscribe(params => {
      const categoryParam = params.get('category');
      this.routeCategoryParam.set(categoryParam);
      this.syncSelectedCategoryFromRoute();
    });

    this.route.queryParamMap.subscribe(query => {
      const filter = query.get('filter');
      if (filter === 'favorites' || filter === 'unused') {
        this.activeFilter.set(filter);
      } else {
        this.activeFilter.set('all');
      }
    });
  }

  getPresetCount(filter: WardrobePresetFilter): number {
    switch (filter) {
      case 'favorites':
        return this.favoriteItemsCount();
      case 'unused':
        return this.lowRotationItemsCount();
      case 'all':
      default:
        return this.allItems().length;
    }
  }

  setPresetFilter(filter: WardrobePresetFilter): void {
    this.activeFilter.set(filter);
  }

  clearAllFilters(): void {
    this.activeFilter.set('all');
    this.searchQuery.set('');
    this.selectedColors.set([]);
    this.selectedCategory.set(null);
    this.selectedTabIndex.set(0);
  }

  getCategoryCount(category: string): number {
    return this.allItems().filter(item => item.category === category).length;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    if (index === 0) {
      this.selectedCategory.set(null);
    } else {
      this.selectedCategory.set(this.categories()[index - 1]?.id ?? null);
    }
  }

  toggleColor(color: string): void {
    this.selectedColors.update(colors => {
      if (colors.includes(color)) {
        return colors.filter(c => c !== color);
      }
      return [...colors, color];
    });
  }

  sortBy(option: WardrobeSortOption): void {
    this.sortOption.set(option);
  }

  toggleView(): void {
    this.viewMode.update(mode => mode === 'grid' ? 'list' : 'grid');
  }

  onViewItem(item: WardrobeItem | Accessory): void {
    if (this.isWardrobeItem(item)) {
      this.router.navigate(['/wardrobe', item.id]);
    }
  }

  onEditItem(item: WardrobeItem | Accessory): void {
    if (this.isWardrobeItem(item)) {
      this.router.navigate(['/wardrobe', item.id, 'edit']);
    }
  }

  async onDeleteItem(item: WardrobeItem | Accessory): Promise<void> {
    try {
      await this.wardrobeService.deleteItem(item.id);
    } catch {
      // Keep collection interactions responsive if delete fails.
    }
  }

  async onToggleFavorite(item: WardrobeItem | Accessory): Promise<void> {
    try {
      await this.wardrobeService.toggleFavorite(item.id);
    } catch {
      // Keep collection interactions responsive if favorite update fails.
    }
  }

  onAddToOutfit(item: WardrobeItem | Accessory): void {
    if (this.isWardrobeItem(item)) {
      this.router.navigate(['/outfit-canvas'], { queryParams: { itemId: item.id } });
      return;
    }
    this.router.navigate(['/outfit-canvas'], { queryParams: { accessoryId: item.id } });
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

  private isWardrobeItem(item: WardrobeItem | Accessory): item is WardrobeItem {
    return 'purchaseDate' in item;
  }

  isFavoritePending(itemId: string): boolean {
    return this.wardrobeService.isFavoriteMutationPending(itemId);
  }

  isDeletePending(itemId: string): boolean {
    return this.wardrobeService.isDeleteMutationPending(itemId);
  }

  private async loadWardrobeItems(): Promise<void> {
    try {
      await this.wardrobeService.ensureWardrobePageLoaded();
    } catch {
      // Allow the page to render even if loading fails temporarily.
    }
  }

  onLoadMore(): void {
    void this.loadNextPage();
  }

  private async loadNextPage(): Promise<void> {
    try {
      await this.wardrobeService.loadNextWardrobePage();
    } catch {
      // Keep filtering controls usable if incremental loading fails.
    }
  }

  private async loadCategoryOptions(): Promise<void> {
    try {
      await this.catalogOptionsService.ensureWardrobeOptionsLoaded();
    } finally {
      this.syncSelectedCategoryFromRoute();
    }
  }

  private syncSelectedCategoryFromRoute(): void {
    const categoryParam = this.routeCategoryParam();
    const categories = this.categories();
    const matchIndex = categories.findIndex((cat) => cat.id === categoryParam);

    if (matchIndex >= 0) {
      this.selectedCategory.set(categories[matchIndex].id);
      this.selectedTabIndex.set(matchIndex + 1);
      return;
    }

    this.selectedCategory.set(null);
    this.selectedTabIndex.set(0);
  }
}

