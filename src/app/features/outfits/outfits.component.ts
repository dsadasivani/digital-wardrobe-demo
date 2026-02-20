import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CatalogOptionsService } from '../../core/services';
import { WardrobeService } from '../../core/services/wardrobe.service';
import { Outfit } from '../../core/models';
import { ImageReadyDirective } from '../../shared/directives/image-ready.directive';

const OUTFIT_LOADING_ICONS = ['style', 'checkroom', 'auto_awesome', 'self_improvement'] as const;
const LIST_LOADING_PLACEHOLDERS = [0, 1, 2, 3, 4, 5, 6, 7] as const;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-outfits',
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatTooltipModule, ImageReadyDirective],
  template: `
    <div class="outfits-page animate-fade-in">
      <header class="page-header">
        <div><h1>My Outfits</h1><p class="subtitle">{{ outfits().length }} of {{ totalOutfitsCount() }} combinations</p></div>
        <div class="header-actions">
          <button class="action-btn secondary" routerLink="/calendar">
            <mat-icon>calendar_month</mat-icon><span>Calendar</span>
          </button>
          <button class="action-btn primary" routerLink="/outfit-canvas">
            <mat-icon>brush</mat-icon><span>Create Outfit</span>
          </button>
        </div>
      </header>

      <section class="filter-chips">
        <button
          type="button"
          class="chip"
          [class.active]="selectedCategory() === 'all'"
          (click)="selectedCategory.set('all')">
          All
        </button>
        @for (entry of outfitCategories(); track entry.id) {
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

      @if (isInitialLoading()) {
        <div class="outfits-grid">
          @for (placeholder of loadingPlaceholders; track placeholder) {
            <article class="dw-list-skeleton-card outfit" aria-hidden="true">
              <div class="dw-list-skeleton-media outfit">
                <mat-icon>{{ loadingIcons[$index % loadingIcons.length] }}</mat-icon>
              </div>
              <div class="dw-list-skeleton-content">
                <span class="dw-list-skeleton-line"></span>
                <span class="dw-list-skeleton-line medium"></span>
                <div class="dw-list-skeleton-chip-row">
                  <span class="dw-list-skeleton-chip"></span>
                  <span class="dw-list-skeleton-chip short"></span>
                </div>
              </div>
            </article>
          }
        </div>
      } @else {
        <div class="outfits-grid">
          @for (outfit of filteredOutfits(); track outfit.id) {
            <div
              class="outfit-card"
              [class.favorite]="outfit.favorite"
              [routerLink]="['/outfits', outfit.id]">
              <div class="outfit-image">
                @if (outfitPreviewImages(outfit); as previewImages) {
                  @if (previewImages.length > 0) {
                    <div
                      class="outfit-image-grid"
                      [class.layout-1]="previewImages.length === 1"
                      [class.layout-2]="previewImages.length === 2"
                      [class.layout-3]="previewImages.length === 3"
                    >
                      @for (imageUrl of previewImages; track imageUrl + '-' + $index) {
                        <div class="grid-cell">
                          <img [src]="imageUrl" [dwImageReady]="imageUrl" [alt]="outfit.name + ' item ' + ($index + 1)" />
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="outfit-image-fallback">
                      <mat-icon>style</mat-icon>
                    </div>
                  }
                }
                @if (hiddenItemsCount(outfit) > 0) {
                  <div class="more-items-badge">+{{ hiddenItemsCount(outfit) }}</div>
                }
                @if (outfit.rating) {<div class="rating"><mat-icon>star</mat-icon>{{ outfit.rating }}</div>}
              </div>
              <div class="outfit-content">
                <h3>{{ outfit.name }}</h3>
                <div class="meta">
                  @if (outfit.category) {<span class="badge">{{ displayCategoryLabel(outfit.category) }}</span>}
                  @if (outfit.occasion) {<span class="badge">{{ outfit.occasion }}</span>}
                  @if (outfit.season) {<span class="badge">{{ outfit.season }}</span>}
                </div>
                <span class="items-count"><mat-icon>layers</mat-icon>{{ outfit.items.length }} items</span>
                <span class="items-count"><mat-icon>check_circle</mat-icon>{{ outfit.worn }} worn</span>
                @if (outfit.plannedDates?.length) {
                  <span class="planned-on"><mat-icon>event</mat-icon>{{ outfit.plannedDates![0] }}</span>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <div class="empty-icon">
                <mat-icon>style</mat-icon>
              </div>
              <h3>No outfits found</h3>
              <p>
                @if (selectedCategory() !== 'all') {
                  Try changing your category filter
                } @else {
                  Create your first outfit combination
                }
              </p>
              <button class="action-btn primary" routerLink="/outfit-canvas">
                <mat-icon>brush</mat-icon>
                Create Outfit
              </button>
            </div>
          }
        </div>
      }

      @if (hasMoreOutfits()) {
        <div class="load-more-row">
          <button
            type="button"
            class="action-btn secondary"
            (click)="onLoadMore()"
            [disabled]="isLoadingMoreOutfits()">
            @if (isLoadingMoreOutfits()) {
              <mat-icon>hourglass_top</mat-icon>
              <span>Loading...</span>
            } @else {
              <mat-icon>expand_more</mat-icon>
              <span>Load More</span>
            }
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .outfits-page { padding: var(--dw-spacing-xl); max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--dw-spacing-xl); }
    .header-actions { display: flex; gap: 8px; }
    .subtitle { color: var(--dw-text-secondary); margin: 0; }
    .action-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: var(--dw-radius-md); border: none; background: var(--dw-gradient-primary); color: white; font-weight: 500; cursor: pointer; }
    .action-btn.secondary { background: var(--dw-surface-card); color: var(--dw-text-primary); border: 1px solid var(--dw-border-strong); }
    .filter-chips { display: flex; gap: 8px; margin-bottom: var(--dw-spacing-xl); flex-wrap: wrap; }
    .chip { padding: 8px 14px; border-radius: var(--dw-radius-full); border: 1px solid var(--dw-border-subtle); background: var(--dw-surface-card); color: var(--dw-text-secondary); cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
    .chip mat-icon { width: 15px; height: 15px; font-size: 15px; }
    .chip span { font-size: 11px; color: var(--dw-text-muted); }
    .chip.active { background: var(--dw-primary); border-color: var(--dw-primary); color: white; }
    .chip.active span { color: color-mix(in srgb, var(--dw-on-primary) 82%, transparent); }
    .outfits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--dw-spacing-lg); }
    .load-more-row { margin-top: var(--dw-spacing-lg); display: flex; justify-content: center; }
    .outfit-card { background: var(--dw-gradient-card); border-radius: var(--dw-radius-lg); border: 1px solid var(--dw-border-subtle); overflow: hidden; transition: all 0.25s; }
    .outfit-card:hover { transform: translateY(-4px); box-shadow: var(--dw-shadow-glow); }
    .outfit-image { position: relative; aspect-ratio: 4/5; overflow: hidden; }
    .outfit-image-grid {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 6px;
      padding: 8px;
      background:
        radial-gradient(circle at 10% 10%, color-mix(in srgb, var(--dw-primary) 16%, transparent), transparent 58%),
        var(--dw-surface-elevated);
    }
    .grid-cell {
      border-radius: 12px;
      overflow: hidden;
      background: color-mix(in srgb, var(--dw-surface-card) 78%, black);
      border: 1px solid color-mix(in srgb, var(--dw-border-subtle) 76%, transparent);
    }
    .grid-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .outfit-image-grid.layout-1 .grid-cell:nth-child(1) { grid-column: 1 / span 2; grid-row: 1 / span 2; }
    .outfit-image-grid.layout-2 .grid-cell:nth-child(1) { grid-row: 1 / span 2; }
    .outfit-image-grid.layout-3 .grid-cell:nth-child(1) { grid-row: 1 / span 2; }
    .outfit-image-fallback {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: var(--dw-text-muted);
      background: var(--dw-surface-elevated);
    }
    .outfit-image-fallback mat-icon { font-size: 44px; width: 44px; height: 44px; }
    .more-items-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 2;
      min-width: 36px;
      height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--dw-overlay-scrim) 90%, transparent);
      color: var(--dw-on-primary);
      border: 1px solid color-mix(in srgb, var(--dw-border-strong) 38%, transparent);
      font-size: 12px;
      font-weight: 700;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .rating { position: absolute; bottom: 8px; left: 8px; display: flex; align-items: center; gap: 4px; background: color-mix(in srgb, var(--dw-overlay-scrim) 92%, transparent); padding: 4px 10px; border-radius: 20px; font-size: 13px; color: var(--dw-on-primary); }
    .rating mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--dw-warning); }
    .outfit-content { padding: var(--dw-spacing-md); }
    .outfit-content h3 { font-size: 1.1rem; margin-bottom: 8px; }
    .meta { display: flex; gap: 8px; margin-bottom: 8px; }
    .badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: color-mix(in srgb, var(--dw-primary) 16%, transparent); color: var(--dw-primary); }
    .items-count { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--dw-text-secondary); }
    .items-count mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .planned-on { margin-top: 6px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dw-text-secondary); }
    .planned-on mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--dw-spacing-2xl); text-align: center; }
    .empty-icon { width: 100px; height: 100px; background: var(--dw-surface-card); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: var(--dw-spacing-lg); }
    .empty-icon mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--dw-text-muted); }
    .empty-state h3 { margin-bottom: var(--dw-spacing-sm); }
    .empty-state p { color: var(--dw-text-secondary); margin: 0 0 var(--dw-spacing-lg); max-width: 320px; }
    @media (max-width: 768px) {
      .outfits-page { padding: var(--dw-spacing-md); }
      .page-header { flex-direction: column; gap: 12px; margin-bottom: var(--dw-spacing-md); }
      .header-actions { width: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .action-btn { width: 100%; justify-content: center; padding: 10px 12px; font-size: 0.85rem; }
      .action-btn span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .filter-chips {
        margin-bottom: var(--dw-spacing-md);
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: 2px;
      }
      .filter-chips::-webkit-scrollbar { display: none; }
      .chip { flex: 0 0 auto; padding: 7px 12px; font-size: 12px; }
      .outfits-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--dw-spacing-md); }
      .outfit-image { aspect-ratio: 4 / 4.2; }
      .outfit-content { padding: 12px; }
      .outfit-content h3 { margin: 0 0 6px; font-size: 1rem; }
      .meta { flex-wrap: wrap; gap: 6px; }
      .items-count, .planned-on { font-size: 12px; }
      .empty-state { padding: 28px 16px; }
      .empty-icon mat-icon { font-size: 44px; width: 44px; height: 44px; }
    }
  `]
})
export class OutfitsComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private catalogOptionsService = inject(CatalogOptionsService);
  outfits = this.wardrobeService.outfitList;
  wardrobeItems = this.wardrobeService.items;
  accessoryItems = this.wardrobeService.accessoryList;
  outfitCategories = this.catalogOptionsService.outfitCategories;
  totalOutfits = this.wardrobeService.outfitsTotalElements;
  hasMoreOutfits = this.wardrobeService.hasMoreOutfitsPages;
  isLoadingMoreOutfits = this.wardrobeService.outfitsPageLoading;
  isInitialLoading = computed(() => this.isLoadingMoreOutfits() && this.outfits().length === 0);
  readonly loadingIcons = OUTFIT_LOADING_ICONS;
  readonly loadingPlaceholders = LIST_LOADING_PLACEHOLDERS;
  selectedCategory = signal<string>('all');

  ngOnInit(): void {
    void this.loadOutfits();
    void this.loadOutfitCategoryOptions();
  }

  filteredOutfits = computed(() => {
    const selectedCategory = this.selectedCategory();
    if (selectedCategory === 'all') {
      return this.outfits();
    }
    return this.outfits().filter((outfit) => outfit.category === selectedCategory);
  });

  totalOutfitsCount = computed(() => {
    const total = this.totalOutfits();
    return total > 0 ? total : this.outfits().length;
  });
  outfitPreviewMap = computed<Record<string, string[]>>(() => {
    const wardrobeImageById = new Map(this.wardrobeItems().map(item => [item.id, item.imageUrl]));
    const accessoryImageById = new Map(this.accessoryItems().map(item => [item.id, item.imageUrl]));
    const map: Record<string, string[]> = {};

    for (const outfit of this.outfits()) {
      const uniqueImages: string[] = [];
      for (const item of outfit.items) {
        const imageUrl =
          item.type === 'wardrobe'
            ? wardrobeImageById.get(item.itemId)
            : accessoryImageById.get(item.itemId);
        if (!imageUrl || uniqueImages.includes(imageUrl)) {
          continue;
        }
        uniqueImages.push(imageUrl);
        if (uniqueImages.length === 4) {
          break;
        }
      }
      map[outfit.id] = uniqueImages.length > 0 ? uniqueImages : outfit.imageUrl ? [outfit.imageUrl] : [];
    }

    return map;
  });

  private async loadOutfits(): Promise<void> {
    try {
      await this.wardrobeService.ensureOutfitsPageLoaded();
      await this.hydratePreviewImages();
    } catch {
      // Keep page responsive while data retries on next navigation.
    }
  }

  onLoadMore(): void {
    void this.loadNextPage();
  }

  private async loadNextPage(): Promise<void> {
    try {
      await this.wardrobeService.loadNextOutfitsPage();
      await this.hydratePreviewImages();
    } catch {
      // Keep filters and navigation responsive if page fetch fails.
    }
  }

  outfitPreviewImages(outfit: Outfit): string[] {
    return this.outfitPreviewMap()[outfit.id] ?? [];
  }

  hiddenItemsCount(outfit: Outfit): number {
    return Math.max(0, outfit.items.length - 4);
  }

  getCategoryCount(categoryId: string): number {
    return this.outfits().filter((outfit) => outfit.category === categoryId).length;
  }

  displayCategoryLabel(categoryId: string): string {
    const option = this.outfitCategories().find((entry) => entry.id === categoryId);
    if (option) {
      return option.label;
    }
    return this.formatCategoryLabel(categoryId);
  }

  private async hydratePreviewImages(): Promise<void> {
    const outfits = this.outfits();
    if (outfits.length === 0) {
      return;
    }
    await Promise.allSettled(outfits.map(outfit => this.wardrobeService.ensureOutfitDependenciesLoaded(outfit)));
  }

  private async loadOutfitCategoryOptions(): Promise<void> {
    try {
      await this.catalogOptionsService.ensureOutfitOptionsLoaded();
    } catch {
      // Keep outfit list interactive with fallback options when metadata loading fails.
    }
  }

  private formatCategoryLabel(category: string): string {
    return category
      .split('-')
      .filter((part) => part.length > 0)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
