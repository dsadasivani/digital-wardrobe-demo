import { ChangeDetectionStrategy, Component, OnDestroy, computed, input, linkedSignal, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { WardrobeItem, Accessory } from '../../../core/models';
import { ImageReadyDirective } from '../../directives/image-ready.directive';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-item-card',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule,
    ImageReadyDirective,
  ],
  template: `
    <div
      class="item-card"
      [class.favorite]="item().favorite"
      (click)="onCardClick()"
      (mouseenter)="onCardHoverStart()"
      (mouseleave)="onCardHoverEnd()"
    >
      <div class="card-image">
        <div
          class="image-swipe-surface"
          (touchstart)="onImageTouchStart($event)"
          (touchend)="onImageTouchEnd($event)"
          (touchcancel)="onImageTouchCancel()"
        ></div>

        @for (frame of imageFrames(); track frame.key) {
          <img [src]="frame.url" [dwImageReady]="frame.url" [alt]="item().name" loading="lazy" class="animated-image">
        }

        <div class="card-overlay">
          <button 
            class="overlay-btn favorite-btn"
            [class.active]="item().favorite"
            (click)="onFavoriteClick($event)"
            matTooltip="Toggle favorite">
            <mat-icon>{{ item().favorite ? 'favorite' : 'favorite_border' }}</mat-icon>
          </button>
          
          <button 
            class="overlay-btn menu-btn"
            [matMenuTriggerFor]="cardMenu"
            (click)="$event.stopPropagation()"
            matTooltip="More options">
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>

        @if (hasMultipleImages()) {
          <div class="image-dots" (click)="$event.stopPropagation()">
            @for (image of imageGallery(); track i; let i = $index) {
              <button
                type="button"
                class="image-dot"
                [class.active]="selectedImageIndex() === i"
                [attr.aria-label]="'Show image ' + (i + 1)"
                (click)="onImageDotSelect(i, $event)"
              ></button>
            }
          </div>
        }

        <div class="color-dot" [style.background-color]="item().colorHex"></div>
      </div>

      <div class="card-content">
        <h4 class="item-name">{{ item().name }}</h4>
        <div class="item-meta">
          <span class="item-category">{{ getCategoryLabel() }}</span>
          <span class="item-worn">
            <mat-icon>repeat</mat-icon>
            {{ getWornCount() }}x worn
          </span>
        </div>
        
        @if (item().tags.length) {
          <div class="item-tags">
            @for (tag of item().tags.slice(0, 3); track tag) {
              <span class="tag">{{ tag }}</span>
            }
          </div>
        }
      </div>

      <mat-menu #cardMenu="matMenu">
        <button mat-menu-item (click)="viewItem.emit(item())">
          <mat-icon>visibility</mat-icon>
          <span>View Details</span>
        </button>
        <button mat-menu-item (click)="editItem.emit(item())">
          <mat-icon>edit</mat-icon>
          <span>Edit</span>
        </button>
        <button mat-menu-item (click)="addToOutfit.emit(item())">
          <mat-icon>add_to_photos</mat-icon>
          <span>Add to Outfit</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item class="delete-option" (click)="deleteItem.emit(item())">
          <mat-icon color="warn">delete</mat-icon>
          <span>Delete</span>
        </button>
      </mat-menu>
    </div>
  `,
  styles: [`
    .item-card {
      background: var(--dw-gradient-card);
      border-radius: var(--dw-radius-lg);
      border: 1px solid var(--dw-border-subtle);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--dw-transition-normal);

      &:hover {
        transform: translateY(-4px);
        border-color: var(--dw-border-strong);
        box-shadow: var(--dw-shadow-lg), var(--dw-shadow-glow);

        .card-overlay {
          opacity: 1;
        }

        .card-image img {
          transform: scale(1.05);
        }
      }

      &.favorite {
        border-color: color-mix(in srgb, var(--dw-accent) 42%, transparent);
      }
    }

    .card-image {
      position: relative;
      aspect-ratio: 3 / 4;
      overflow: hidden;
      background: var(--dw-surface-base);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--dw-transition-slow);
      }
    }

    .image-swipe-surface {
      position: absolute;
      inset: 0;
      z-index: 1;
    }

    .animated-image {
      animation: cardImageSwap 300ms ease;
    }

    @keyframes cardImageSwap {
      from {
        transform: scale(1.03);
      }
      to {
        transform: scale(1);
      }
    }

    .card-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: var(--dw-spacing-sm);
      display: flex;
      justify-content: space-between;
      z-index: 2;
      opacity: 0;
      transition: opacity var(--dw-transition-fast);
      background: var(--dw-image-overlay);
    }

    .image-dots {
      position: absolute;
      left: 50%;
      bottom: 10px;
      transform: translateX(-50%);
      display: flex;
      gap: 5px;
      padding: 4px 7px;
      border-radius: 999px;
      background: color-mix(in srgb, var(--dw-overlay-scrim) 65%, transparent);
      z-index: 2;
      opacity: 0;
      transition: opacity var(--dw-transition-fast);
    }

    .image-dot {
      width: 6px;
      height: 6px;
      border: 0;
      border-radius: 50%;
      padding: 0;
      background: color-mix(in srgb, var(--dw-on-primary) 58%, transparent);
      transition: transform var(--dw-transition-fast), background var(--dw-transition-fast);

      &.active {
        background: var(--dw-on-primary);
        transform: scale(1.2);
      }
    }

    .item-card:hover .image-dots {
      opacity: 1;
    }

    .overlay-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--dw-transition-fast);

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.1);
      }

      &.active {
        background: var(--dw-accent);
        color: white;
      }
    }

    .color-dot {
      position: absolute;
      bottom: var(--dw-spacing-sm);
      right: var(--dw-spacing-sm);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      box-shadow: var(--dw-shadow-sm);
    }

    .card-content {
      padding: var(--dw-spacing-md);
    }

    .item-name {
      font-family: 'Outfit', sans-serif;
      font-size: 1rem;
      font-weight: 600;
      color: var(--dw-text-primary);
      margin: 0 0 var(--dw-spacing-xs);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-meta {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-md);
      font-size: 12px;
      color: var(--dw-text-secondary);
      margin-bottom: var(--dw-spacing-sm);
    }

    .item-category {
      text-transform: capitalize;
    }

    .item-worn {
      display: flex;
      align-items: center;
      gap: 4px;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .item-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag {
      font-size: 11px;
      padding: 2px 8px;
      background: color-mix(in srgb, var(--dw-primary) 15%, transparent);
      color: var(--dw-primary);
      border-radius: var(--dw-radius-full);
    }

    .delete-option {
      color: var(--dw-error);
    }

    @media (max-width: 768px) {
      .item-card {
        border-radius: var(--dw-radius-md);
      }

      .item-card:hover {
        transform: none;
        box-shadow: none;
      }

      .card-image {
        aspect-ratio: 4 / 5;
      }

      .image-dots {
        opacity: 1;
        bottom: 6px;
      }

      .card-overlay {
        opacity: 1;
        padding: 6px;
        background: var(--dw-image-overlay);
      }

      .overlay-btn {
        width: 32px;
        height: 32px;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }

      .color-dot {
        width: 16px;
        height: 16px;
        right: 6px;
        bottom: 6px;
      }

      .card-content {
        padding: 10px;
      }

      .item-name {
        font-size: 0.9rem;
        white-space: normal;
        line-height: 1.25;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .item-meta {
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 6px;
      }

      .item-tags {
        gap: 4px;
      }

      .tag {
        font-size: 10px;
        padding: 2px 6px;
      }
    }
  `]
})
export class ItemCardComponent implements OnDestroy {
  private static readonly SWIPE_THRESHOLD_PX = 36;

  item = input.required<WardrobeItem | Accessory>();
  selectedImageIndex = linkedSignal(() => this.item().id ? 0 : 0);
  imageAnimationKey = signal(0);
  hoverCycleTimerId = signal<number | null>(null);
  touchStartX = signal<number | null>(null);
  touchStartY = signal<number | null>(null);
  suppressClickUntil = signal(0);

  viewItem = output<WardrobeItem | Accessory>();
  editItem = output<WardrobeItem | Accessory>();
  deleteItem = output<WardrobeItem | Accessory>();
  addToOutfit = output<WardrobeItem | Accessory>();
  toggleFavorite = output<WardrobeItem | Accessory>();

  imageGallery = computed(() => {
    const images = (this.item().imageUrls ?? []).filter(Boolean);
    if (images.length) {
      return images;
    }
    return this.item().imageUrl ? [this.item().imageUrl] : [];
  });
  hasMultipleImages = computed(() => this.imageGallery().length > 1);
  currentImageUrl = computed(() => {
    const gallery = this.imageGallery();
    if (!gallery.length) {
      return '';
    }
    const index = this.selectedImageIndex();
    return gallery[index] ?? gallery[0];
  });
  imageFrames = computed(() => [
    {
      key: this.imageAnimationKey(),
      url: this.currentImageUrl(),
    },
  ]);

  ngOnDestroy(): void {
    this.stopHoverCycle();
  }

  getCategoryLabel(): string {
    return this.item().category.charAt(0).toUpperCase() + this.item().category.slice(1);
  }

  getWornCount(): number {
    return this.item().worn;
  }

  onCardClick(): void {
    if (Date.now() < this.suppressClickUntil()) {
      return;
    }
    this.viewItem.emit(this.item());
  }

  onCardHoverStart(): void {
    if (!this.supportsHover() || !this.hasMultipleImages()) {
      return;
    }
    if (this.hoverCycleTimerId() !== null) {
      return;
    }
    const timerId = window.setInterval(() => {
      this.showNextImage();
    }, 1200);
    this.hoverCycleTimerId.set(timerId);
  }

  onCardHoverEnd(): void {
    this.stopHoverCycle();
    this.setImageIndex(0);
  }

  onImageDotSelect(index: number, event: Event): void {
    event.stopPropagation();
    this.setImageIndex(index);
  }

  onImageTouchStart(event: TouchEvent): void {
    if (!this.hasMultipleImages() || event.touches.length !== 1) {
      return;
    }
    const touch = event.touches[0];
    this.touchStartX.set(touch.clientX);
    this.touchStartY.set(touch.clientY);
  }

  onImageTouchEnd(event: TouchEvent): void {
    const startX = this.touchStartX();
    const startY = this.touchStartY();
    this.onImageTouchCancel();

    if (!this.hasMultipleImages() || startX === null || startY === null || event.changedTouches.length !== 1) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX < ItemCardComponent.SWIPE_THRESHOLD_PX || absDeltaX <= absDeltaY) {
      return;
    }

    this.suppressClickUntil.set(Date.now() + 250);
    if (deltaX < 0) {
      this.showNextImage();
      return;
    }
    this.showPreviousImage();
  }

  onImageTouchCancel(): void {
    this.touchStartX.set(null);
    this.touchStartY.set(null);
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.toggleFavorite.emit(this.item());
  }

  private supportsHover(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  private showPreviousImage(): void {
    if (!this.hasMultipleImages()) {
      return;
    }
    const total = this.imageGallery().length;
    this.setImageIndex(this.selectedImageIndex() - 1 + total);
  }

  private showNextImage(): void {
    if (!this.hasMultipleImages()) {
      return;
    }
    this.setImageIndex(this.selectedImageIndex() + 1);
  }

  private setImageIndex(index: number): void {
    const total = this.imageGallery().length;
    if (!total) {
      return;
    }
    const normalized = ((index % total) + total) % total;
    if (normalized === this.selectedImageIndex()) {
      return;
    }
    this.selectedImageIndex.set(normalized);
    this.imageAnimationKey.update(value => value + 1);
  }

  private stopHoverCycle(): void {
    const timerId = this.hoverCycleTimerId();
    if (timerId === null) {
      return;
    }
    clearInterval(timerId);
    this.hoverCycleTimerId.set(null);
  }
}
