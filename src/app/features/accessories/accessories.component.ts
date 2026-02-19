import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ACCESSORY_CATEGORIES, Accessory, WardrobeItem } from '../../core/models';
import { WardrobeService } from '../../core/services/wardrobe.service';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';

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
    MatFormFieldModule,
    MatSelectModule,
    ItemCardComponent,
  ],
  template: `
    <div class="accessories-page animate-fade-in">
      <header class="page-header">
        <div>
          <h1>Accessories</h1>
          <p class="subtitle">{{ filteredAccessories().length }} of {{ totalAccessoriesCount() }} items</p>
        </div>
        <button class="action-btn primary" routerLink="/accessories/add">
          <mat-icon>add</mat-icon><span>Add Accessory</span>
        </button>
      </header>

      <section class="filters glass">
        <div class="search-container">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            type="text"
            class="search-input"
            placeholder="Search accessories, brands, tags..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)">
          @if (searchQuery()) {
            <button class="clear-btn" type="button" (click)="searchQuery.set('')">
              <mat-icon>close</mat-icon>
            </button>
          }
        </div>
        <mat-form-field appearance="outline" class="sort-select">
          <mat-label>Sort</mat-label>
          <mat-select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)">
            <mat-option value="recent">Recently Added</mat-option>
            <mat-option value="name">Name</mat-option>
            <mat-option value="brand">Brand</mat-option>
          </mat-select>
        </mat-form-field>
      </section>

      <section class="category-chips">
        <button
          type="button"
          class="chip"
          [class.active]="selectedCategory() === 'all'"
          (click)="selectedCategory.set('all')">
          All
        </button>
        @for (entry of categories; track entry.id) {
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

      <section class="quick-filters">
        <button
          type="button"
          class="chip"
          [class.active]="showFavoritesOnly()"
          (click)="showFavoritesOnly.set(!showFavoritesOnly())">
          <mat-icon>{{ showFavoritesOnly() ? 'favorite' : 'favorite_border' }}</mat-icon>
          Favorites
        </button>
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
                @if (searchQuery() || selectedCategory() !== 'all' || showFavoritesOnly()) {
                  Try adjusting your search or filters
                } @else {
                  Add your first accessory to complete your wardrobe
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
    .accessories-page { padding: var(--dw-spacing-xl); max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: var(--dw-spacing-lg); }
    .subtitle { color: var(--dw-text-secondary); margin: 0; }
    .action-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: var(--dw-radius-md); border: none; background: var(--dw-gradient-primary); color: white; font-weight: 500; cursor: pointer; }
    .filters { display: flex; gap: 12px; align-items: center; padding: 12px; border-radius: var(--dw-radius-lg); margin-bottom: 12px; }
    .search-container { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 220px; background: var(--dw-surface-card); border-radius: var(--dw-radius-md); padding: 0 10px; height: 46px; }
    .search-icon { color: var(--dw-text-muted); }
    .search-input { flex: 1; border: none; background: transparent; outline: none; color: var(--dw-text-primary); }
    .clear-btn { border: none; background: transparent; color: var(--dw-text-muted); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
    .sort-select { width: 180px; }
    .category-chips, .quick-filters { display: flex; gap: 8px; overflow-x: auto; padding: 4px 0 10px; margin-bottom: 2px; scrollbar-width: none; }
    .category-chips::-webkit-scrollbar, .quick-filters::-webkit-scrollbar { display: none; }
    .chip { border: 1px solid var(--dw-border-subtle); background: var(--dw-surface-card); color: var(--dw-text-primary); border-radius: 999px; padding: 7px 12px; display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .chip span { font-size: 11px; color: var(--dw-text-secondary); }
    .chip.active { background: var(--dw-gradient-primary); color: var(--dw-on-primary); border-color: transparent; }
    .chip.active span { color: color-mix(in srgb, var(--dw-on-primary) 82%, transparent); }
    .chip mat-icon { width: 16px; height: 16px; font-size: 16px; }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--dw-spacing-lg); }
    .load-more-row { display: flex; justify-content: center; margin-top: var(--dw-spacing-lg); }
    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--dw-spacing-2xl); text-align: center; }
    .empty-icon { width: 100px; height: 100px; background: var(--dw-surface-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--dw-spacing-lg); }
    .empty-icon mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--dw-text-muted); }
    .empty-state h3 { margin-bottom: var(--dw-spacing-sm); }
    .empty-state p { color: var(--dw-text-secondary); margin: 0 0 var(--dw-spacing-lg); max-width: 320px; }
    @media (max-width: 768px) {
      .accessories-page { padding: var(--dw-spacing-md); }
      .page-header { margin-bottom: 12px; }
      .action-btn span { display: none; }
      .filters { display: grid; grid-template-columns: 1fr; }
      .sort-select { width: 100%; }
      .items-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    }
  `],
})
export class AccessoriesComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);

  accessories = this.wardrobeService.accessoryList;
  totalAccessories = this.wardrobeService.accessoriesTotalElements;
  hasMoreAccessories = this.wardrobeService.hasMoreAccessoriesPages;
  isLoadingMoreAccessories = this.wardrobeService.accessoriesPageLoading;
  isInitialLoading = computed(
    () => this.isLoadingMoreAccessories() && this.accessories().length === 0,
  );
  readonly loadingIcons = ACCESSORY_LOADING_ICONS;
  readonly loadingPlaceholders = LIST_LOADING_PLACEHOLDERS;
  categories = ACCESSORY_CATEGORIES;

  searchQuery = signal('');
  selectedCategory = signal<'all' | Accessory['category']>('all');
  showFavoritesOnly = signal(false);
  sortBy = signal<'recent' | 'name' | 'brand'>('recent');

  ngOnInit(): void {
    void this.loadAccessories();
  }

  filteredAccessories = computed(() => {
    let items = [...this.accessories()];
    const query = this.searchQuery().trim().toLowerCase();
    const selectedCategory = this.selectedCategory();

    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    if (this.showFavoritesOnly()) {
      items = items.filter(item => item.favorite);
    }

    if (query) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.brand ?? '').toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query),
      );
    }

    switch (this.sortBy()) {
      case 'name':
        items.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'brand':
        items.sort((a, b) => (a.brand ?? '').localeCompare(b.brand ?? ''));
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

  getCategoryCount(category: Accessory['category']): number {
    return this.accessories().filter(item => item.category === category).length;
  }

  onViewItem(item: WardrobeItem | Accessory): void {
    this.router.navigate(['/accessories', item.id]);
  }

  onEditItem(item: WardrobeItem | Accessory): void {
    this.router.navigate(['/accessories', item.id, 'edit']);
  }

  onDeleteItem(item: WardrobeItem | Accessory): void {
    if (confirm(`Delete "${item.name}" from accessories?`)) {
      this.wardrobeService.deleteAccessory(item.id);
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
}
