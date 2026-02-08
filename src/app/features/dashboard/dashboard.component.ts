import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { WardrobeService } from '../../core/services/wardrobe.service';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { WardrobeItem, Accessory } from '../../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-dashboard',
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    ItemCardComponent,
  ],
  template: `
    <div class="dashboard animate-fade-in">
      <!-- Welcome Section -->
      <section class="welcome-section">
        <div class="welcome-content">
          <h1 class="welcome-title">
            Welcome back, <span class="text-gradient">{{ getUserFirstName() }}</span>
          </h1>
          <p class="welcome-subtitle">
            You have {{ stats().totalItems }} items in your wardrobe and {{ stats().totalOutfits }} saved outfits.
          </p>
        </div>
        
        <div class="quick-actions">
          <button class="action-btn primary" routerLink="/wardrobe/add">
            <mat-icon>add_photo_alternate</mat-icon>
            <span>Add Item</span>
          </button>
          <button class="action-btn" routerLink="/outfit-canvas">
            <mat-icon>brush</mat-icon>
            <span>Create Outfit</span>
          </button>
        </div>
      </section>

      <!-- Stats Cards -->
      <section class="stats-section">
        <button
          class="stats-nav stats-prev"
          type="button"
          aria-label="Scroll stats left"
          [class.visible]="canScrollStatsLeft()"
          (click)="scrollStats('left')">
          <mat-icon>chevron_left</mat-icon>
        </button>

        <div #statsRow class="stats-row" (scroll)="onStatsScroll()">
          <div class="stat-card" (click)="navigateTo('/wardrobe')">
            <div class="stat-icon" style="background: linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)">
              <mat-icon>checkroom</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalItems }}</span>
              <span class="stat-label">Total Items</span>
            </div>
          </div>

          <div class="stat-card" (click)="navigateTo('/outfits')">
            <div class="stat-icon" style="background: linear-gradient(135deg, #EC4899 0%, #F472B6 100%)">
              <mat-icon>style</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ stats().totalOutfits }}</span>
              <span class="stat-label">Saved Outfits</span>
            </div>
          </div>

          <div class="stat-card" (click)="openFavorites()">
            <div class="stat-icon" style="background: linear-gradient(135deg, #34D399 0%, #6EE7B7 100%)">
              <mat-icon>favorite</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ favoriteCount() }}</span>
              <span class="stat-label">Favorites</span>
            </div>
          </div>

          <div class="stat-card" (click)="openRarelyUsed()">
            <div class="stat-icon" style="background: linear-gradient(135deg, #FBBF24 0%, #FCD34D 100%)">
              <mat-icon>visibility_off</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-value">{{ unusedCount() }}</span>
              <span class="stat-label">Rarely Used</span>
            </div>
          </div>
        </div>

        <button
          class="stats-nav stats-next"
          type="button"
          aria-label="Scroll stats right"
          [class.visible]="canScrollStatsRight()"
          (click)="scrollStats('right')">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </section>

      <!-- Weather Suggestion -->
      <section class="weather-section glass">
        <div class="weather-info">
          <div class="weather-icon">
            <mat-icon>{{ getWeatherIcon() }}</mat-icon>
          </div>
          <div class="weather-details">
            <span class="weather-temp">{{ weatherSuggestion.weather.temp }}°C</span>
            <span class="weather-location">{{ weatherSuggestion.weather.location }}</span>
          </div>
        </div>
        
        <div class="weather-suggestion" (click)="openWeatherSuggestions()" style="cursor: pointer;">
          <h4>Today's Suggestion</h4>
          <p>Based on the weather, we recommend layering with light outerwear.</p>
        </div>

        <div class="suggested-items">
          @for (item of weatherSuggestion.suggestedItems; track item.id) {
            <div class="mini-item" (click)="openItem(item.id)">
              <img [src]="item.imageUrl" [alt]="item.name">
            </div>
          }
        </div>
      </section>

      <!-- Category Breakdown -->
      <section class="category-section">
        <div class="section-header">
          <h2>Wardrobe Breakdown</h2>
          <span (click)="navigateTo('/wardrobe')" class="view-all-link" style="cursor: pointer;">View All <mat-icon>arrow_forward</mat-icon></span>
        </div>

        <div class="category-grid">
          @for (cat of stats().categoryBreakdown; track cat.category) {
            <div class="category-card" [routerLink]="'/wardrobe/category/' + cat.category">
              <div class="category-icon">
                <mat-icon>{{ getCategoryIcon(cat.category) }}</mat-icon>
              </div>
              <span class="category-name">{{ cat.category | titlecase }}</span>
              <span class="category-count">{{ cat.count }} items</span>
            </div>
          }
        </div>
      </section>

      <!-- Recently Added -->
      <section class="recent-section">
        <div class="section-header">
          <h2>Recently Added</h2>
          <a routerLink="/wardrobe" class="view-all-link">View All <mat-icon>arrow_forward</mat-icon></a>
        </div>

        <div class="items-grid">
          @for (item of recentItems(); track item.id) {
            <dw-item-card 
              [item]="item"
              (viewItem)="onViewItem($event)"
              (toggleFavorite)="onToggleFavorite($event)">
            </dw-item-card>
          }
        </div>
      </section>

      <!-- Most Worn Item -->
      @if (stats().mostWornItem) {
        <section class="highlight-section">
          <div class="section-header">
            <h2>Your Most Worn Item</h2>
          </div>

          <div class="highlight-card glass clickable" (click)="openItem(stats().mostWornItem!.id)">
            <div class="highlight-image">
              <img [src]="stats().mostWornItem!.imageUrl" [alt]="stats().mostWornItem!.name">
            </div>
            <div class="highlight-content">
              <span class="highlight-badge badge badge-primary">
                <mat-icon>emoji_events</mat-icon>
                Most Popular
              </span>
              <h3>{{ stats().mostWornItem!.name }}</h3>
              <p class="highlight-meta">
                Worn <strong>{{ stats().mostWornItem!.worn }}</strong> times
              </p>
              <div class="highlight-tags">
                @for (tag of stats().mostWornItem!.tags; track tag) {
                  <span class="tag">{{ tag }}</span>
                }
              </div>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      padding: var(--dw-spacing-xl);
      max-width: 1400px;
      margin: 0 auto;
    }

    .welcome-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--dw-spacing-2xl);
      flex-wrap: wrap;
      gap: var(--dw-spacing-lg);
    }

    .welcome-title {
      font-size: 2.5rem;
      margin-bottom: var(--dw-spacing-sm);
    }

    .welcome-subtitle {
      color: var(--dw-text-secondary);
      font-size: 1.1rem;
    }

    .quick-actions {
      display: flex;
      gap: var(--dw-spacing-md);
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-sm);
      padding: var(--dw-spacing-md) var(--dw-spacing-lg);
      border-radius: var(--dw-radius-md);
      border: 1px solid var(--dw-surface-card);
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--dw-transition-fast);

      &:hover {
        border-color: var(--dw-primary);
        background: var(--dw-surface-elevated);
      }

      &.primary {
        background: var(--dw-gradient-primary);
        border: none;
        color: white;

        &:hover {
          transform: translateY(-2px);
          box-shadow: var(--dw-shadow-glow);
        }
      }
    }

    .stats-section {
      position: relative;
      margin-bottom: var(--dw-spacing-2xl);
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--dw-spacing-lg);
    }

    .stats-nav {
      display: none;
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      width: 36px;
      height: 36px;
      border: 0;
      border-radius: 999px;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--dw-surface-card) 92%, #fff 8%);
      color: var(--dw-text-primary);
      box-shadow: var(--dw-shadow-md);
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--dw-transition-fast);
      cursor: pointer;
    }

    .stats-nav.visible {
      opacity: 1;
      pointer-events: auto;
    }

    .stats-prev {
      left: 6px;
    }

    .stats-next {
      right: 6px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-md);
      padding: var(--dw-spacing-lg);
      background: var(--dw-gradient-card);
      border-radius: var(--dw-radius-lg);
      border: 1px solid rgba(0, 0, 0, 0.03); // Subtle border
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-5px);
        background: var(--dw-hover-gradient);
        border-color: var(--dw-primary);
        box-shadow: var(--dw-shadow-lg);

        .stat-icon {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--dw-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      mat-icon {
        color: white;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
    }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-family: 'Outfit', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: var(--dw-text-primary);
      line-height: 1;
    }

    .stat-label {
      font-size: 13px;
      color: var(--dw-text-secondary);
      margin-top: 4px;
    }

    .weather-section {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-xl);
      padding: var(--dw-spacing-xl);
      border-radius: var(--dw-radius-xl);
      margin-bottom: var(--dw-spacing-2xl);
      flex-wrap: wrap;
    }

    .weather-info {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-md);
    }

    .weather-icon {
      width: 64px;
      height: 64px;
      background: var(--dw-gradient-primary);
      border-radius: var(--dw-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;

      mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: white;
      }
    }

    .weather-temp {
      font-family: 'Outfit', sans-serif;
      font-size: 2rem;
      font-weight: 600;
      display: block;
    }

    .weather-location {
      color: var(--dw-text-secondary);
      font-size: 14px;
    }

    .weather-suggestion {
      flex: 1;
      min-width: 200px;
      
      h4 {
        margin-bottom: var(--dw-spacing-xs);
      }

      p {
        color: var(--dw-text-secondary);
        margin: 0;
      }
    }

    .suggested-items {
      display: flex;
      gap: var(--dw-spacing-sm);
    }

    .mini-item {
      width: 60px;
      height: 60px;
      border-radius: var(--dw-radius-md);
      overflow: hidden;
      border: 2px solid var(--dw-surface-card);
      transition: all var(--dw-transition-fast);
      cursor: pointer;

      &:hover {
        border-color: var(--dw-primary);
        transform: scale(1.1);
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--dw-spacing-lg);

      h2 {
        margin: 0;
      }
    }

    .view-all-link {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--dw-primary-light);
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
      transition: color var(--dw-transition-fast);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      &:hover {
        color: var(--dw-primary);
      }
    }

    .category-section {
      margin-bottom: var(--dw-spacing-2xl);
    }

    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: var(--dw-spacing-md);
    }

    .category-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--dw-spacing-sm);
      padding: var(--dw-spacing-lg);
      background: var(--dw-surface-card);
      border-radius: var(--dw-radius-lg);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all var(--dw-transition-normal);
      text-decoration: none;
      color: inherit;

      &:hover {
        border-color: var(--dw-primary);
        transform: translateY(-2px);
        box-shadow: var(--dw-shadow-glow);

        .category-icon {
          background: var(--dw-gradient-primary);
          
          mat-icon {
            color: white;
          }
        }
      }
    }

    .category-icon {
      width: 48px;
      height: 48px;
      background: var(--dw-surface-elevated);
      border-radius: var(--dw-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--dw-transition-normal);

      mat-icon {
        color: var(--dw-primary-light);
        font-size: 24px;
        width: 24px;
        height: 24px;
        transition: color var(--dw-transition-fast);
      }
    }

    .category-name {
      font-weight: 600;
      color: var(--dw-text-primary);
    }

    .category-count {
      font-size: 12px;
      color: var(--dw-text-muted);
    }

    .recent-section {
      margin-bottom: var(--dw-spacing-2xl);
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: var(--dw-spacing-lg);
    }

    .highlight-section {
      margin-bottom: var(--dw-spacing-2xl);
    }

    .highlight-card {
      display: flex;
      gap: var(--dw-spacing-xl);
      padding: var(--dw-spacing-lg);
      border-radius: var(--dw-radius-xl);
      overflow: hidden;
    }

    .highlight-card.clickable {
      cursor: pointer;
      transition: box-shadow var(--dw-transition-fast), transform var(--dw-transition-fast);
    }

    .highlight-card.clickable:hover {
      transform: translateY(-2px);
      box-shadow: var(--dw-shadow-lg);
    }

    .highlight-image {
      width: 200px;
      height: 250px;
      border-radius: var(--dw-radius-lg);
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .highlight-content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: var(--dw-spacing-md);
    }

    .highlight-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: fit-content;

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    }

    .highlight-meta {
      color: var(--dw-text-secondary);
      
      strong {
        color: var(--dw-accent);
        font-size: 1.5rem;
      }
    }

    .highlight-tags {
      display: flex;
      gap: var(--dw-spacing-sm);
      flex-wrap: wrap;
    }

    .tag {
      font-size: 12px;
      padding: 4px 12px;
      background: rgba(124, 58, 237, 0.15);
      color: var(--dw-primary-light);
      border-radius: var(--dw-radius-full);
    }

    @media (max-width: 768px) {
      .dashboard {
        padding: var(--dw-spacing-md);
      }

      .welcome-section,
      .stats-section,
      .weather-section,
      .category-section,
      .recent-section,
      .highlight-section {
        margin-bottom: var(--dw-spacing-lg);
      }

      .quick-actions {
        display: none;
      }

      .stats-section {
        padding-inline: 16px;
      }

      .stats-nav {
        display: flex;
      }

      .stats-row {
        display: flex;
        gap: var(--dw-spacing-md);
        overflow-x: auto;
        scroll-behavior: smooth;
        scroll-snap-type: x mandatory;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .stats-row::-webkit-scrollbar {
        display: none;
      }

      .stat-card {
        min-width: auto;
        width: calc((100% - var(--dw-spacing-md)) / 2);
        flex: 0 0 calc((100% - var(--dw-spacing-md)) / 2);
        padding: var(--dw-spacing-sm) var(--dw-spacing-md);
        scroll-snap-align: start;
      }

      .stat-icon {
        width: 44px;
        height: 44px;
      }

      .stat-icon mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .stat-value {
        font-size: 1.5rem;
      }

      .stat-label {
        font-size: 12px;
      }

      .items-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .welcome-title {
        font-size: 1.75rem;
      }

      .category-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .category-card {
        padding: var(--dw-spacing-md) var(--dw-spacing-sm);
      }

      .category-icon {
        width: 40px;
        height: 40px;
      }

      .category-name {
        font-size: 12px;
        text-align: center;
      }

      .category-count {
        text-align: center;
      }

      .highlight-card {
        flex-direction: column;
      }

      .highlight-image {
        width: 100%;
        height: 200px;
      }
    }
  `]
})
export class DashboardComponent implements AfterViewInit {
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);
  @ViewChild('statsRow') private statsRow?: ElementRef<HTMLDivElement>;

  user = this.wardrobeService.user;
  stats = this.wardrobeService.dashboardStats;
  recentItems = this.wardrobeService.recentItems;
  weatherSuggestion = this.wardrobeService.getWeatherSuggestion();

  favoriteCount = () => this.wardrobeService.favoriteItems().length;
  unusedCount = () => this.stats().leastWornItems.filter(item => item.worn < 5).length;
  canScrollStatsLeft = signal(false);
  canScrollStatsRight = signal(false);

  ngAfterViewInit(): void {
    setTimeout(() => this.refreshStatsScrollState());
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.refreshStatsScrollState();
  }

  navigateTo(path: string | string[]): void {
    this.router.navigate(Array.isArray(path) ? path : [path]);
  }

  openFavorites(): void {
    this.router.navigate(['/wardrobe'], { queryParams: { filter: 'favorites' } });
  }

  openRarelyUsed(): void {
    this.router.navigate(['/wardrobe'], { queryParams: { filter: 'unused' } });
  }

  openWeatherSuggestions(): void {
    const ids = this.weatherSuggestion.suggestedItems.map(item => item.id).join(',');
    this.router.navigate(['/wardrobe'], { queryParams: { filter: 'weather', ids } });
  }

  openItem(itemId: string): void {
    this.router.navigate(['/wardrobe', itemId]);
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      tops: 'checkroom',
      bottoms: 'straighten',
      dresses: 'dry_cleaning',
      outerwear: 'ac_unit',
      shoes: 'hiking',
      accessories: 'watch',
      activewear: 'fitness_center',
      formal: 'style',
      swimwear: 'pool',
    };
    return icons[category] || 'category';
  }

  getWeatherIcon(): string {
    const condition = this.weatherSuggestion.weather.condition;
    const icons: Record<string, string> = {
      sunny: 'wb_sunny',
      cloudy: 'cloud',
      rainy: 'umbrella',
      snowy: 'ac_unit',
      windy: 'air',
    };
    return icons[condition] || 'thermostat';
  }

  getUserFirstName(): string {
    return this.user()?.name?.split(' ')[0] || 'Guest';
  }

  onViewItem(item: WardrobeItem | Accessory): void {
    this.navigateTo(['/wardrobe', item.id]);
  }

  onToggleFavorite(item: WardrobeItem | Accessory): void {
    this.wardrobeService.toggleFavorite(item.id);
  }

  onStatsScroll(): void {
    this.refreshStatsScrollState();
  }

  scrollStats(direction: 'left' | 'right'): void {
    const container = this.statsRow?.nativeElement;
    if (!container) {
      return;
    }
    const offset = container.clientWidth;
    container.scrollBy({
      left: direction === 'right' ? offset : -offset,
      behavior: 'smooth',
    });
  }

  private refreshStatsScrollState(): void {
    const container = this.statsRow?.nativeElement;
    if (!container) {
      this.canScrollStatsLeft.set(false);
      this.canScrollStatsRight.set(false);
      return;
    }
    this.canScrollStatsLeft.set(container.scrollLeft > 2);
    this.canScrollStatsRight.set(container.scrollLeft + container.clientWidth < container.scrollWidth - 2);
  }
}

