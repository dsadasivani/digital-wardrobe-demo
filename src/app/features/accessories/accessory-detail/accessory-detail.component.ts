import { CommonModule, Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
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

        @if (relatedAccessories().length) {
          <section class="related-section">
            <div class="related-header">
              <h2>Related Accessories</h2>
              <a routerLink="/accessories">See all</a>
            </div>
            <div class="related-container">
              @if (canScrollLeft()) {
                <button
                  class="related-nav related-prev"
                  type="button"
                  (click)="scrollRelatedRow(relatedRow, 'left')"
                  aria-label="Scroll related accessories left">
                  <mat-icon>chevron_left</mat-icon>
                </button>
              }
              <div class="related-row" #relatedRow (scroll)="onRelatedScroll(relatedRow)">
                @for (related of relatedAccessories(); track related.id) {
                  <a class="related-card glass" [routerLink]="['/accessories', related.id]">
                    <img [src]="related.imageUrl" [alt]="related.name">
                    <div class="related-meta">
                      <span class="name">{{ related.name }}</span>
                      <span class="sub">{{ related.color }}</span>
                    </div>
                  </a>
                }
              </div>
              @if (canScrollRight()) {
                <button
                  class="related-nav related-next"
                  type="button"
                  (click)="scrollRelatedRow(relatedRow, 'right')"
                  aria-label="Scroll related accessories right">
                  <mat-icon>chevron_right</mat-icon>
                </button>
              }
            </div>
          </section>
        }
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
    .related-section { margin-top: var(--dw-spacing-2xl); }
    .related-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .related-header h2 { font-size: 1.2rem; margin: 0; }
    .related-header a { color: var(--dw-primary); text-decoration: none; font-size: 13px; font-weight: 600; }
    .related-container { position: relative; }
    .related-row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(160px, 180px); gap: 12px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; -ms-overflow-style: none; }
    .related-row::-webkit-scrollbar { display: none; }
    .related-card { border-radius: var(--dw-radius-lg); overflow: hidden; text-decoration: none; color: inherit; border: 1px solid rgba(255, 255, 255, 0.08); }
    .related-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
    .related-meta { padding: 10px; display: flex; flex-direction: column; gap: 2px; }
    .related-meta .name { font-size: 13px; font-weight: 600; color: var(--dw-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .related-meta .sub { font-size: 12px; color: var(--dw-text-secondary); }
    .related-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.12); background: var(--dw-surface-elevated); color: var(--dw-text-primary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--dw-shadow-sm); z-index: 2; }
    .related-prev { left: 6px; }
    .related-next { right: 6px; }
    .related-nav mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; }
    .not-found mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--dw-text-muted); }
    @media (max-width: 900px) {
      .accessory-detail-page { padding: var(--dw-spacing-md); }
      .content-grid { grid-template-columns: 1fr; }
      .detail-header { flex-wrap: wrap; }
    }
    @media (max-width: 768px) {
      .accessory-detail-page { padding: 12px; }
      .detail-header { gap: 10px; margin-bottom: 12px; }
      .detail-header h1 { font-size: 1.15rem; line-height: 1.25; }
      .actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .actions button { width: 100%; min-height: 40px; }
      .content-grid { gap: 12px; }
      .image-panel { border-radius: var(--dw-radius-lg); aspect-ratio: 4/3; }
      .info-panel { border-radius: var(--dw-radius-lg); padding: 12px; gap: 12px; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .related-section { margin-top: 16px; }
      .related-header { margin-bottom: 8px; }
      .related-row { grid-auto-columns: minmax(132px, 146px); gap: 8px; }
      .related-card img { height: 136px; }
      .related-meta { padding: 8px; }
      .related-nav { display: none; }
    }
  `]
})
export class AccessoryDetailComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private wardrobeService = inject(WardrobeService);
  @ViewChild('relatedRow') private relatedRowRef?: ElementRef<HTMLElement>;

  accessory = signal<Accessory | undefined>(undefined);
  canScrollLeft = signal(false);
  canScrollRight = signal(true);

  categoryLabel = computed(() => {
    const category = this.accessory()?.category ?? '';
    return category.charAt(0).toUpperCase() + category.slice(1);
  });

  relatedAccessories = computed(() => {
    const current = this.accessory();
    if (!current) return [];

    return this.wardrobeService.accessoryList()
      .filter(item => item.id !== current.id)
      .filter(item =>
        item.category === current.category ||
        item.color === current.color ||
        item.tags.some(tag => current.tags.includes(tag))
      )
      .slice(0, 8);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.accessory.set(id ? this.wardrobeService.getAccessoryById(id) : undefined);
      queueMicrotask(() => this.refreshRelatedScrollState());
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.refreshRelatedScrollState());
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

  onRelatedScroll(container: HTMLElement): void {
    this.updateScrollControls(container);
  }

  scrollRelatedRow(container: HTMLElement, direction: 'left' | 'right'): void {
    const delta = direction === 'right' ? 280 : -280;
    container.scrollBy({ left: delta, behavior: 'smooth' });
    setTimeout(() => this.updateScrollControls(container), 220);
  }

  private refreshRelatedScrollState(): void {
    const container = this.relatedRowRef?.nativeElement;
    if (!container) {
      this.canScrollLeft.set(false);
      this.canScrollRight.set(false);
      return;
    }
    this.updateScrollControls(container);
  }

  private updateScrollControls(container: HTMLElement): void {
    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    this.canScrollLeft.set(container.scrollLeft > 2);
    this.canScrollRight.set(container.scrollLeft < maxScrollLeft - 2);
  }
}
