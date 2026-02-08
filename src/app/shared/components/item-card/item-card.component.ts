import {Component, input, output, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { WardrobeItem, Accessory } from '../../../core/models';

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
  ],
  template: `
    <div class="item-card" [class.favorite]="item().favorite" (click)="onCardClick()">
      <div class="card-image">
        <img [src]="item().imageUrl" [alt]="item().name" loading="lazy">
        
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

        <div class="color-dot" [style.background-color]="item().colorHex"></div>
      </div>

      <div class="card-content">
        <h4 class="item-name">{{ item().name }}</h4>
        <div class="item-meta">
          <span class="item-category">{{ getCategoryLabel() }}</span>
          @if (isWardrobeItem(item())) {
            <span class="item-worn">
              <mat-icon>repeat</mat-icon>
              {{ getWornCount() }}x worn
            </span>
          }
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
      border: 1px solid rgba(255, 255, 255, 0.06);
      overflow: hidden;
      cursor: pointer;
      transition: all var(--dw-transition-normal);

      &:hover {
        transform: translateY(-4px);
        border-color: rgba(124, 58, 237, 0.3);
        box-shadow: var(--dw-shadow-lg), var(--dw-shadow-glow);

        .card-overlay {
          opacity: 1;
        }

        .card-image img {
          transform: scale(1.05);
        }
      }

      &.favorite {
        border-color: rgba(244, 114, 182, 0.3);
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

    .card-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      padding: var(--dw-spacing-sm);
      display: flex;
      justify-content: space-between;
      opacity: 0;
      transition: opacity var(--dw-transition-fast);
      background: linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%);
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
      background: rgba(124, 58, 237, 0.15);
      color: var(--dw-primary-light);
      border-radius: var(--dw-radius-full);
    }

    .delete-option {
      color: var(--dw-error);
    }
  `]
})
export class ItemCardComponent {
  item = input.required<WardrobeItem | Accessory>();

  viewItem = output<WardrobeItem | Accessory>();
  editItem = output<WardrobeItem | Accessory>();
  deleteItem = output<WardrobeItem | Accessory>();
  addToOutfit = output<WardrobeItem | Accessory>();
  toggleFavorite = output<WardrobeItem | Accessory>();

  isWardrobeItem(item: WardrobeItem | Accessory): item is WardrobeItem {
    return 'worn' in item;
  }

  getCategoryLabel(): string {
    return this.item().category.charAt(0).toUpperCase() + this.item().category.slice(1);
  }

  getWornCount(): number {
    const item = this.item();
    return this.isWardrobeItem(item) ? item.worn : 0;
  }

  onCardClick(): void {
    this.viewItem.emit(this.item());
  }

  onFavoriteClick(event: Event): void {
    event.stopPropagation();
    this.toggleFavorite.emit(this.item());
  }
}
