import { CommonModule, Location } from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Accessory } from '../../../core/models';
import { WardrobeService } from '../../../core/services/wardrobe.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-accessory-detail',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatChipsModule],
  template: `
    @if (accessory()) {
      <div class="accessory-detail-page animate-fade-in">
        <header class="detail-header">
          <button mat-icon-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>{{ accessory()!.name }}</h1>
          <div class="actions">
            <button mat-stroked-button color="warn" (click)="deleteAccessory()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
            <button mat-flat-button color="primary" class="edit-btn" [routerLink]="['/accessories', accessory()!.id, 'edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
          </div>
        </header>

        <div class="content-grid">
          <section class="image-panel glass">
            <img [src]="accessory()!.imageUrl" [alt]="accessory()!.name">
          </section>

          <section class="info-panel glass">
            <div class="top-meta">
              <span class="badge">
                <mat-icon>watch</mat-icon>
                {{ categoryLabel() }}
              </span>
              <span class="badge">
                <span class="color-dot" [style.background-color]="accessory()!.colorHex"></span>
                {{ accessory()!.color }}
              </span>
              @if (accessory()!.favorite) {
                <span class="badge favorite">
                  <mat-icon>favorite</mat-icon>
                  Favorite
                </span>
              }
            </div>

            <div class="stats">
              <div><span class="label">Brand</span><strong>{{ accessory()!.brand || 'N/A' }}</strong></div>
              <div><span class="label">Created</span><strong>{{ accessory()!.createdAt | date }}</strong></div>
            </div>

            @if (accessory()!.tags.length) {
              <div class="tags">
                @for (tag of accessory()!.tags; track tag) {
                  <mat-chip>{{ tag }}</mat-chip>
                }
              </div>
            }
          </section>
        </div>
      </div>
    } @else {
      <div class="not-found animate-fade-in">
        <mat-icon>search_off</mat-icon>
        <h2>Accessory not found</h2>
        <button mat-flat-button color="primary" routerLink="/accessories">Back to accessories</button>
      </div>
    }
  `,
  styles: [`
    .accessory-detail-page { padding: var(--dw-spacing-xl); max-width: 1200px; margin: 0 auto; }
    .detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: var(--dw-spacing-xl); }
    .detail-header h1 { margin: 0; flex: 1; }
    .actions { display: flex; gap: 8px; }
    .edit-btn {
      --mdc-filled-button-container-color: transparent !important;
      --mdc-filled-button-label-text-color: var(--dw-primary) !important;
      background: transparent !important;
      color: var(--dw-primary) !important;
      border: none !important;
      box-shadow: none !important;
      font-weight: 600;
    }
    .edit-btn:hover {
      background: color-mix(in srgb, var(--dw-primary) 10%, transparent) !important;
    }
    .content-grid { display: grid; gap: var(--dw-spacing-xl); grid-template-columns: minmax(280px, 420px) 1fr; }
    .image-panel { border-radius: var(--dw-radius-xl); overflow: hidden; aspect-ratio: 3/4; }
    .image-panel img { width: 100%; height: 100%; object-fit: cover; }
    .info-panel { border-radius: var(--dw-radius-xl); padding: var(--dw-spacing-lg); display: flex; flex-direction: column; gap: var(--dw-spacing-lg); }
    .top-meta { display: flex; flex-wrap: wrap; gap: 8px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--dw-surface-card); font-size: 12px; }
    .badge.favorite { color: var(--dw-accent); }
    .color-dot { width: 10px; height: 10px; border-radius: 50%; }
    .stats { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .label { display: block; color: var(--dw-text-secondary); font-size: 12px; margin-bottom: 4px; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; }
    .not-found mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--dw-text-muted); }
    @media (max-width: 900px) {
      .accessory-detail-page { padding: var(--dw-spacing-md); }
      .content-grid { grid-template-columns: 1fr; }
      .detail-header { flex-wrap: wrap; }
    }
  `]
})
export class AccessoryDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private wardrobeService = inject(WardrobeService);

  accessory = signal<Accessory | undefined>(undefined);
  categoryLabel = computed(() => {
    const category = this.accessory()?.category ?? '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.accessory.set(id ? this.wardrobeService.getAccessoryById(id) : undefined);
    });
  }

  goBack(): void {
    this.location.back();
  }

  deleteAccessory(): void {
    const current = this.accessory();
    if (!current) {
      return;
    }
    if (confirm(`Delete "${current.name}" from accessories?`)) {
      this.wardrobeService.deleteAccessory(current.id);
      this.router.navigate(['/accessories']);
    }
  }
}
