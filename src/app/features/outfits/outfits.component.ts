import {Component, inject, signal, computed, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WardrobeService } from '../../core/services/wardrobe.service';
import { Outfit } from '../../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-outfits',
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="outfits-page animate-fade-in">
      <header class="page-header">
        <div><h1>My Outfits</h1><p class="subtitle">{{ outfits().length }} combinations</p></div>
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
        @for (f of occasionFilters; track f) {
          <button class="chip" [class.active]="selectedOccasion() === f" (click)="selectedOccasion.set(f)">{{ f }}</button>
        }
      </section>

      <div class="outfits-grid">
        @for (outfit of filteredOutfits(); track outfit.id) {
          <div
            class="outfit-card"
            [class.favorite]="outfit.favorite"
            [routerLink]="['/outfits', outfit.id]">
            <div class="outfit-image">
              <img [src]="outfit.imageUrl" [alt]="outfit.name">
              @if (outfit.rating) {<div class="rating"><mat-icon>star</mat-icon>{{ outfit.rating }}</div>}
            </div>
            <div class="outfit-content">
              <h3>{{ outfit.name }}</h3>
              <div class="meta">
                @if (outfit.occasion) {<span class="badge">{{ outfit.occasion }}</span>}
                @if (outfit.season) {<span class="badge">{{ outfit.season }}</span>}
              </div>
              <span class="items-count"><mat-icon>layers</mat-icon>{{ outfit.items.length }} items</span>
              @if (outfit.plannedDates?.length) {
                <span class="planned-on"><mat-icon>event</mat-icon>{{ outfit.plannedDates![0] }}</span>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <mat-icon>style</mat-icon><h3>No outfits yet</h3>
            <button class="action-btn primary" routerLink="/outfit-canvas"><mat-icon>brush</mat-icon>Create</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .outfits-page { padding: var(--dw-spacing-xl); max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--dw-spacing-xl); }
    .header-actions { display: flex; gap: 8px; }
    .subtitle { color: var(--dw-text-secondary); margin: 0; }
    .action-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: var(--dw-radius-md); border: none; background: var(--dw-gradient-primary); color: white; font-weight: 500; cursor: pointer; }
    .action-btn.secondary { background: var(--dw-surface-card); color: var(--dw-text-primary); border: 1px solid rgba(140,123,112,0.2); }
    .filter-chips { display: flex; gap: 8px; margin-bottom: var(--dw-spacing-xl); flex-wrap: wrap; }
    .chip { padding: 8px 16px; border-radius: var(--dw-radius-full); border: 1px solid var(--dw-surface-card); background: var(--dw-surface-card); color: var(--dw-text-secondary); cursor: pointer; }
    .chip.active { background: var(--dw-primary); border-color: var(--dw-primary); color: white; }
    .outfits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--dw-spacing-lg); }
    .outfit-card { background: var(--dw-gradient-card); border-radius: var(--dw-radius-lg); border: 1px solid rgba(255,255,255,0.06); overflow: hidden; transition: all 0.25s; }
    .outfit-card:hover { transform: translateY(-4px); box-shadow: var(--dw-shadow-glow); }
    .outfit-image { position: relative; aspect-ratio: 4/5; overflow: hidden; }
    .outfit-image img { width: 100%; height: 100%; object-fit: cover; }
    .rating { position: absolute; bottom: 8px; left: 8px; display: flex; align-items: center; gap: 4px; background: rgba(0,0,0,0.6); padding: 4px 10px; border-radius: 20px; font-size: 13px; }
    .rating mat-icon { font-size: 16px; width: 16px; height: 16px; color: var(--dw-warning); }
    .outfit-content { padding: var(--dw-spacing-md); }
    .outfit-content h3 { font-size: 1.1rem; margin-bottom: 8px; }
    .meta { display: flex; gap: 8px; margin-bottom: 8px; }
    .badge { font-size: 11px; padding: 3px 10px; border-radius: 20px; background: rgba(124,58,237,0.2); color: var(--dw-primary-light); }
    .items-count { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--dw-text-secondary); }
    .items-count mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .planned-on { margin-top: 6px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--dw-text-secondary); }
    .planned-on mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .empty-state { grid-column: 1/-1; display: flex; flex-direction: column; align-items: center; padding: 48px; text-align: center; }
    .empty-state mat-icon { font-size: 64px; width: 64px; height: 64px; color: var(--dw-text-muted); margin-bottom: 16px; }
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
      .empty-state mat-icon { font-size: 44px; width: 44px; height: 44px; margin-bottom: 10px; }
    }
  `]
})
export class OutfitsComponent {
  private wardrobeService = inject(WardrobeService);
  outfits = this.wardrobeService.outfitList;
  selectedOccasion = signal<string>('All');
  occasionFilters = ['All', 'Work', 'Casual', 'Formal', 'Party', 'Vacation'];
  filteredOutfits = computed(() => {
    if (this.selectedOccasion() === 'All') return this.outfits();
    return this.outfits().filter(o => o.occasion?.toLowerCase() === this.selectedOccasion().toLowerCase());
  });
}
