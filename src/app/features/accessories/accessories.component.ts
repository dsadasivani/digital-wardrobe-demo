import {Component, inject, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WardrobeService } from '../../core/services/wardrobe.service';
import { ItemCardComponent } from '../../shared/components/item-card/item-card.component';
import { Accessory, WardrobeItem } from '../../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-accessories',
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, ItemCardComponent],
  template: `
    <div class="accessories-page animate-fade-in">
      <header class="page-header">
        <div><h1>Accessories</h1><p class="subtitle">{{ accessories().length }} items</p></div>
        <button class="action-btn primary" routerLink="/wardrobe/add">
          <mat-icon>add</mat-icon><span>Add Accessory</span>
        </button>
      </header>

      <div class="items-grid">
        @for (item of accessories(); track item.id) {
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
            <mat-icon>watch</mat-icon>
            <h3>No accessories yet</h3>
            <button class="action-btn primary" routerLink="/wardrobe/add"><mat-icon>add</mat-icon>Add</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .accessories-page { padding: var(--dw-spacing-xl); max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--dw-spacing-xl); }
    .subtitle { color: var(--dw-text-secondary); margin: 0; }
    .action-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: var(--dw-radius-md); border: none; background: var(--dw-gradient-primary); color: white; font-weight: 500; cursor: pointer; }
    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--dw-spacing-lg); }
    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; padding: 48px; text-align: center; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: var(--dw-text-muted); margin-bottom: 16px; }
  `]
})
export class AccessoriesComponent {
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);
  accessories = this.wardrobeService.accessoryList;

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

  onToggleFavorite(item: WardrobeItem | Accessory): void {
    this.wardrobeService.toggleAccessoryFavorite(item.id);
  }

  onAddToOutfit(_item: WardrobeItem | Accessory): void {
    this.router.navigate(['/outfit-canvas']);
  }
}
