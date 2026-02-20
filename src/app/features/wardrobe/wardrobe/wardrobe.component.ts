import {Component, computed, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WardrobeService } from '../../../core/services/wardrobe.service';
import { ItemCardComponent } from '../../../shared/components/item-card/item-card.component';
import { WardrobeItem, Accessory, WardrobeCategory, WARDROBE_CATEGORIES } from '../../../core/models';

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
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatTooltipModule,
    ItemCardComponent,
  ],
  template: `
    <div class="wardrobe-page animate-fade-in">
      <!-- Page Header -->
      <header class="page-header">
        <div class="header-content">
          <h1>My Wardrobe</h1>
          <p class="subtitle">{{ filteredItems().length }} of {{ totalItemsCount() }} items</p>
        </div>
        
        <div class="header-actions">
          <button class="action-btn" [matMenuTriggerFor]="sortMenu">
            <mat-icon>sort</mat-icon>
            <span>Sort</span>
          </button>
          <button class="action-btn" (click)="toggleView()">
            <mat-icon>{{ viewMode() === 'grid' ? 'view_list' : 'grid_view' }}</mat-icon>
          </button>
          <button class="action-btn primary" routerLink="/wardrobe/add">
            <mat-icon>add</mat-icon>
            <span>Add Item</span>
          </button>
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
      </header>

      <!-- Search & Filters -->
      <section class="filters-section glass">
        <div class="search-container">
          <mat-icon class="search-icon">search</mat-icon>
          <input 
            type="text" 
            class="search-input"
            placeholder="Search by name, brand, or tag..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)">
          @if (searchQuery()) {
            <button class="clear-btn" (click)="searchQuery.set('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>

        <div class="color-filters">
          <span class="filter-label">Colors:</span>
          @for (color of colorOptions; track color.name) {
            <button 
              class="color-chip"
              [class.selected]="selectedColors().includes(color.name)"
              [style.--chip-color]="color.hex"
              (click)="toggleColor(color.name)"
              [matTooltip]="color.name">
            </button>
          }
        </div>
      </section>

      <!-- Category Tabs -->
      <mat-tab-group 
        class="category-tabs"
        [selectedIndex]="selectedTabIndex()"
        (selectedIndexChange)="onTabChange($event)">
        <mat-tab label="All ({{ allItems().length }})"></mat-tab>
        @for (cat of categories; track cat.id) {
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
              @if (searchQuery() || selectedColors().length > 0) {
                Try adjusting your search or filters
              } @else {
                Start building your digital wardrobe by adding your first item
              }
            </p>
            <button class="action-btn primary" routerLink="/wardrobe/add">
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
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: var(--dw-spacing-lg);
      margin-bottom: var(--dw-spacing-xl);
    }

    .header-content h1 {
      margin-bottom: var(--dw-spacing-xs);
    }

    .subtitle {
      color: var(--dw-text-secondary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--dw-spacing-sm);
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-sm);
      padding: var(--dw-spacing-sm) var(--dw-spacing-md);
      border-radius: var(--dw-radius-md);
      border: 1px solid var(--dw-border-subtle);
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--dw-transition-fast);

      &:hover {
        border-color: var(--dw-border-strong);
        background: var(--dw-surface-hover);
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

    .filters-section {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-xl);
      padding: var(--dw-spacing-md) var(--dw-spacing-lg);
      border-radius: var(--dw-radius-lg);
      margin-bottom: var(--dw-spacing-lg);
      flex-wrap: wrap;
    }

    .search-container {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-sm);
      flex: 1;
      min-width: 250px;
      background: var(--dw-surface-card);
      border-radius: var(--dw-radius-md);
      padding: var(--dw-spacing-sm) var(--dw-spacing-md);
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
      padding: 4px;
      display: flex;

      &:hover {
        color: var(--dw-text-primary);
      }

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .color-filters {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-sm);
    }

    .filter-label {
      color: var(--dw-text-secondary);
      font-size: 13px;
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
      transition: all var(--dw-transition-fast);
      padding: 0;

      &:hover {
        transform: scale(1.15);
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.5),
          0 0 0 1px color-mix(in srgb, var(--dw-primary) 24%, transparent),
          0 2px 6px rgba(0, 0, 0, 0.2);
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
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--dw-spacing-lg);

      &.list-view {
        grid-template-columns: 1fr;
        
        dw-item-card {
          ::ng-deep .item-card {
            display: flex;
            flex-direction: row;
            
            .card-image {
              width: 120px;
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

    @media (max-width: 768px) {
      .wardrobe-page {
        padding: var(--dw-spacing-md);
        padding-bottom: 80px;
      }

      .items-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .header-actions span {
        display: none;
      }

      .header-actions .primary {
        display: none;
      }
    }
  `]
})
export class WardrobeComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  categories = WARDROBE_CATEGORIES;
  allItems = this.wardrobeService.items;
  totalItems = this.wardrobeService.wardrobeTotalElements;
  hasMoreItems = this.wardrobeService.hasMoreWardrobePages;
  isLoadingMoreItems = this.wardrobeService.wardrobePageLoading;
  isInitialLoading = computed(() => this.isLoadingMoreItems() && this.allItems().length === 0);
  readonly loadingIcons = WARDROBE_LOADING_ICONS;
  readonly loadingPlaceholders = LIST_LOADING_PLACEHOLDERS;

  searchQuery = signal('');
  selectedCategory = signal<WardrobeCategory | null>(null);
  selectedColors = signal<string[]>([]);
  sortOption = signal<'name' | 'recent' | 'worn' | 'price'>('recent');
  viewMode = signal<'grid' | 'list'>('grid');
  selectedTabIndex = signal(0);
  activeFilter = signal<'all' | 'favorites' | 'unused'>('all');

  colorOptions = [
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'White', hex: '#f5f5f5' },
    { name: 'Navy', hex: '#1e3a5f' },
    { name: 'Grey', hex: '#6b7280' },
    { name: 'Brown', hex: '#8b4513' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Beige', hex: '#d4c5b0' },
    { name: 'Purple', hex: '#7c3aed' },
  ];

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
      items = items.filter(item =>
        colors.some(color => item.color.toLowerCase().includes(color.toLowerCase()))
      );
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

  totalItemsCount = computed(() => {
    const total = this.totalItems();
    return total > 0 ? total : this.allItems().length;
  });

  ngOnInit(): void {
    void this.loadWardrobeItems();

    this.route.paramMap.subscribe(params => {
      const categoryParam = params.get('category');
      const matchIndex = this.categories.findIndex(cat => cat.id === categoryParam);

      if (matchIndex >= 0) {
        this.selectedCategory.set(this.categories[matchIndex].id);
        this.selectedTabIndex.set(matchIndex + 1);
      } else {
        this.selectedCategory.set(null);
        this.selectedTabIndex.set(0);
      }
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

  getCategoryCount(category: WardrobeCategory): number {
    return this.allItems().filter(item => item.category === category).length;
  }

  onTabChange(index: number): void {
    this.selectedTabIndex.set(index);
    if (index === 0) {
      this.selectedCategory.set(null);
    } else {
      this.selectedCategory.set(this.categories[index - 1].id);
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

  sortBy(option: 'name' | 'recent' | 'worn' | 'price'): void {
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
}
