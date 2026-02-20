import { CommonModule, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Accessory, Outfit, OutfitItem, WardrobeItem } from '../../../core/models';
import { AppUiStateService } from '../../../core/services/app-ui-state.service';
import { WardrobeService } from '../../../core/services/wardrobe.service';
import { DetailSkeletonComponent } from '../../../shared/components/detail-skeleton/detail-skeleton.component';
import { InlineActionLoaderComponent } from '../../../shared/components/inline-action-loader/inline-action-loader.component';
import { ImageReadyDirective } from '../../../shared/directives/image-ready.directive';

interface OutfitResolvedItem {
  source: OutfitItem;
  data: WardrobeItem | Accessory | null;
  type: 'wardrobe' | 'accessory';
}

interface OutfitColorSwatch {
  hex: string;
  label: string;
  count: number;
}

const MAX_DETAIL_PREVIEW_IMAGES = 4;
const MAX_DETAIL_COLOR_SWATCHES = 8;

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-outfit-detail',
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    ImageReadyDirective,
    DetailSkeletonComponent,
    InlineActionLoaderComponent,
  ],
  template: `
    @if (isDetailLoading()) {
      <dw-detail-skeleton icon="style"></dw-detail-skeleton>
    } @else if (outfit(); as selectedOutfit) {
      <div class="page animate-fade-in">
        <section class="hero glass">
          <header class="hero-header">
            <button mat-icon-button (click)="goBack()" aria-label="Go back"><mat-icon>arrow_back</mat-icon></button>
            <div class="title">
              <p>Outfit detail</p>
              <h1>{{ selectedOutfit.name }}</h1>
              <span>Created {{ selectedOutfit.createdAt | date: 'mediumDate' }}</span>
            </div>
            <button
              mat-icon-button
              class="favorite-btn"
              [class.active]="selectedOutfit.favorite"
              [disabled]="isFavoritePending() || isDeletePending() || isMarkWornPending()"
              (click)="toggleFavorite()"
              [attr.aria-label]="selectedOutfit.favorite ? 'Remove favorite' : 'Add favorite'"
            >
              <mat-icon>{{ selectedOutfit.favorite ? 'favorite' : 'favorite_border' }}</mat-icon>
            </button>
          </header>

          <div class="hero-grid">
            <div class="media">
              @if (detailPreviewImages(); as images) {
                @if (images.length > 0) {
                  <div class="media-grid" [class.one]="images.length === 1" [class.two]="images.length === 2" [class.three]="images.length === 3">
                    @for (imageUrl of images; track imageUrl + '-' + $index) {
                      <div class="cell"><img [src]="imageUrl" [dwImageReady]="imageUrl" [alt]="selectedOutfit.name + ' item ' + ($index + 1)" /></div>
                    }
                  </div>
                } @else {
                  <div class="fallback"><mat-icon>style</mat-icon></div>
                }
              }
              @if (hiddenDetailItemsCount() > 0) { <span class="more">+{{ hiddenDetailItemsCount() }}</span> }
              <mat-chip-set class="chips">
                @if (selectedOutfit.season) { <mat-chip>{{ displayLabel(selectedOutfit.season) }}</mat-chip> }
                @if (selectedOutfit.occasion) { <mat-chip>{{ displayLabel(selectedOutfit.occasion) }}</mat-chip> }
              </mat-chip-set>
            </div>

            <div class="summary">
              <div class="stat-grid">
                <article><label>Items</label><strong>{{ selectedOutfit.items.length }}</strong><small>{{ wardrobePiecesCount() }} wardrobe · {{ accessoryPiecesCount() }} accessory</small></article>
                <article><label>Worn</label><strong>{{ selectedOutfit.worn }}x</strong><small>{{ selectedOutfit.lastWorn ? ('Last ' + (selectedOutfit.lastWorn | date: 'MMM d')) : 'Never worn' }}</small></article>
                <article><label>Next plan</label><strong>{{ nextPlannedDate() ? (nextPlannedDate()! | date: 'MMM d') : 'Not set' }}</strong><small>{{ upcomingPlannedDates().length }} upcoming</small></article>
              </div>

              <div class="actions">
                <button mat-flat-button color="primary" class="mark-worn-btn" (click)="markAsWorn()" [disabled]="isMarkWornPending() || isDeletePending() || isFavoritePending()">
                  <mat-icon>check_circle</mat-icon>
                  Mark worn
                </button>
                <button mat-stroked-button [routerLink]="['/outfit-canvas', selectedOutfit.id]"><mat-icon>edit</mat-icon>Edit</button>
                <button mat-stroked-button routerLink="/calendar"><mat-icon>calendar_month</mat-icon>Calendar</button>
                <button mat-stroked-button color="warn" (click)="deleteOutfit()" [disabled]="isDeletePending() || isMarkWornPending() || isFavoritePending()">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </div>
            </div>
          </div>

          @if (isDeletePending() || isMarkWornPending()) {
            <div class="pending">
              @if (isDeletePending()) { <dw-inline-action-loader label="Deleting outfit..." tone="destructive" icon="delete_forever"></dw-inline-action-loader> }
              @if (isMarkWornPending()) { <dw-inline-action-loader label="Updating wear count..." tone="positive" icon="check_circle"></dw-inline-action-loader> }
            </div>
          }
        </section>

        <section class="content">
          <article class="panel glass">
            <header class="panel-head">
              <div><p>Composition</p><h2>Items In This Look</h2></div>
              <div class="count-row">
                <span><mat-icon>checkroom</mat-icon>{{ wardrobePiecesCount() }}</span>
                <span><mat-icon>watch</mat-icon>{{ accessoryPiecesCount() }}</span>
                @if (missingPiecesCount() > 0) { <span class="bad"><mat-icon>error_outline</mat-icon>{{ missingPiecesCount() }}</span> }
              </div>
            </header>

            @if (isMobile()) {
              <div class="items-list-mobile">
                @for (resolvedItem of resolvedItems(); track resolvedItem.source.itemId + '-' + $index) {
                  @if (resolvedItem.data; as itemData) {
                    <a class="item mobile-item" [routerLink]="resolvedItem.type === 'wardrobe' ? ['/wardrobe', itemData.id] : ['/accessories', itemData.id]">
                      <div class="card-image">
                        <img [src]="itemData.imageUrl" [dwImageReady]="itemData.imageUrl" [alt]="itemData.name" />
                      </div>
                      <div class="card-content">
                        <span>{{ itemData.name }}</span>
                        <small>{{ displayTypeLabel(resolvedItem.type) }} · {{ displayLabel(itemData.category) }}</small>
                      </div>
                    </a>
                  } @else {
                    <article class="item missing mobile-item">
                      <div class="card-image">
                        <div class="missing-icon"><mat-icon>{{ resolvedItem.type === 'wardrobe' ? 'checkroom' : 'watch' }}</mat-icon></div>
                      </div>
                      <div class="card-content"><span>Unavailable item</span><small>{{ resolvedItem.source.itemId }}</small></div>
                    </article>
                  }
                }
              </div>
            } @else {
              <div class="items-grid">
                @for (resolvedItem of resolvedItems(); track resolvedItem.source.itemId + '-' + $index) {
                  @if (resolvedItem.data; as itemData) {
                    <a class="item" [routerLink]="resolvedItem.type === 'wardrobe' ? ['/wardrobe', itemData.id] : ['/accessories', itemData.id]">
                      <div class="card-image">
                        <img [src]="itemData.imageUrl" [dwImageReady]="itemData.imageUrl" [alt]="itemData.name" />
                      </div>
                      <div class="card-content">
                        <span>{{ itemData.name }}</span>
                        <small>{{ displayTypeLabel(resolvedItem.type) }} · {{ displayLabel(itemData.category) }}</small>
                      </div>
                    </a>
                  } @else {
                    <article class="item missing">
                      <div class="card-image">
                        <div class="missing-icon"><mat-icon>{{ resolvedItem.type === 'wardrobe' ? 'checkroom' : 'watch' }}</mat-icon></div>
                      </div>
                      <div class="card-content"><span>Unavailable item</span><small>{{ resolvedItem.source.itemId }}</small></div>
                    </article>
                  }
                }
              </div>
            }
          </article>

          <aside class="side">
            <article class="panel glass">
              <header class="panel-head"><div><p>Plan</p><h3>Schedule</h3></div></header>
              @if (sortedPlannedDates().length > 0) {
                <div class="next">
                  <span>Next planned date</span>
                  <strong>{{ nextPlannedDate() ? (nextPlannedDate()! | date: 'EEEE, MMM d') : 'No upcoming date' }}</strong>
                </div>
                @if (upcomingPlannedDates().length > 0) {
                  <div class="date-list">
                    @for (day of upcomingPlannedDates(); track day) { <span>{{ day | date: 'EEE, MMM d' }}</span> }
                  </div>
                }
                @if (pastPlannedDates().length > 0) {
                  <div class="date-list past">
                    @for (day of pastPlannedDates(); track day) { <span>{{ day | date: 'MMM d' }}</span> }
                  </div>
                }
              } @else {
                <p class="muted">No dates scheduled yet. Add this outfit in Calendar to plan ahead.</p>
              }
            </article>

            <article class="panel glass">
              <header class="panel-head"><div><p>Context</p><h3>Stylist Notes</h3></div></header>
              @if (selectedOutfit.notes) { <p class="muted">{{ selectedOutfit.notes }}</p> } @else { <p class="muted">No notes yet.</p> }
            </article>

            <article class="panel glass">
              <header class="panel-head"><div><p>Visual</p><h3>Color Palette</h3></div></header>
              @if (colorPalette().length > 0) {
                <div class="palette">
                  @for (swatch of colorPalette(); track swatch.hex + '-' + swatch.label) {
                    <div class="row">
                      <span class="dot" [style.background]="swatch.hex"></span>
                      <span>{{ swatch.label }}</span>
                      <small>{{ swatch.count }}</small>
                    </div>
                  }
                </div>
              } @else {
                <p class="muted">Palette unavailable until items load.</p>
              }
            </article>
          </aside>
        </section>
      </div>
    } @else {
      <div class="not-found animate-fade-in">
        <mat-icon>search_off</mat-icon>
        <h2>Outfit not found</h2>
        <button mat-flat-button color="primary" routerLink="/outfits">Back to outfits</button>
      </div>
    }
  `,
  styles: [
    `
      .page { max-width: 1200px; margin: 0 auto; padding: var(--dw-spacing-xl); display: grid; gap: var(--dw-spacing-lg); }
      .hero { padding: 14px; border-radius: var(--dw-radius-xl); border: 1px solid var(--dw-border-subtle); }
      .hero-header { display: flex; gap: 10px; align-items: center; }
      .title { flex: 1; min-width: 0; }
      .title p { margin: 0; text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; color: var(--dw-text-muted); font-weight: 600; }
      .title h1 { margin: 2px 0 0; font-size: clamp(1.35rem, 2.8vw, 2rem); line-height: 1.15; }
      .title span { color: var(--dw-text-secondary); font-size: 13px; }
      .favorite-btn { border: 1px solid var(--dw-border-subtle); background: var(--dw-surface-elevated); }
      .favorite-btn mat-icon { color: var(--dw-text-secondary); }
      .favorite-btn.active mat-icon { color: var(--dw-accent); }

      .hero-grid { margin-top: 12px; display: grid; gap: 12px; grid-template-columns: minmax(290px, 1fr) minmax(320px, 1fr); }
      .media { position: relative; min-height: 360px; border-radius: var(--dw-radius-lg); overflow: hidden; border: 1px solid var(--dw-border-subtle); background: var(--dw-surface-card); }
      .media-grid { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8px; padding: 10px; }
      .media-grid .cell { border-radius: 12px; overflow: hidden; border: 1px solid color-mix(in srgb, var(--dw-border-subtle) 74%, transparent); }
      .media-grid img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .media-grid.one .cell:first-child { grid-column: 1 / span 2; grid-row: 1 / span 2; }
      .media-grid.two .cell:first-child, .media-grid.three .cell:first-child { grid-row: 1 / span 2; }
      .fallback { position: absolute; inset: 0; display: grid; place-items: center; color: var(--dw-text-muted); }
      .fallback mat-icon { font-size: 52px; width: 52px; height: 52px; }
      .more { position: absolute; top: 10px; right: 10px; z-index: 2; min-height: 30px; border-radius: 999px; padding: 0 10px; display: inline-flex; align-items: center; background: color-mix(in srgb, var(--dw-overlay-scrim) 88%, transparent); color: var(--dw-on-primary); }
      .chips { position: absolute; left: 10px; right: 10px; bottom: 10px; z-index: 2; display: flex; flex-wrap: wrap; gap: 6px; }
      .chips mat-chip { background: color-mix(in srgb, var(--dw-overlay-scrim) 90%, transparent); color: var(--dw-on-primary); font-size: 11px; border: 1px solid color-mix(in srgb, var(--dw-on-primary) 26%, transparent); }

      .summary { display: grid; gap: 10px; align-content: start; }
      .stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .stat-grid article { border: 1px solid var(--dw-border-subtle); border-radius: var(--dw-radius-md); padding: 10px; background: color-mix(in srgb, var(--dw-surface-elevated) 90%, transparent); display: grid; gap: 2px; }
      .stat-grid label { text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; color: var(--dw-text-muted); font-weight: 600; }
      .stat-grid strong { font-size: 1.1rem; line-height: 1.05; }
      .stat-grid small { color: var(--dw-text-secondary); font-size: 12px; }
      .actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .actions button { width: 100%; }
      .mark-worn-btn {
        --mdc-filled-button-container-color: var(--dw-primary-dark) !important;
        --mdc-filled-button-label-text-color: var(--dw-primary-light) !important;
        color: var(--dw-primary-light) !important;
        border: 1px solid color-mix(in srgb, var(--dw-primary-light) 24%, transparent);
        font-weight: 600;
      }
      .mark-worn-btn:hover:not(:disabled) {
        filter: brightness(1.04);
      }
      .mark-worn-btn:disabled {
        opacity: 0.62;
      }
      .pending { margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap; }

      .content { display: grid; gap: var(--dw-spacing-lg); grid-template-columns: minmax(0, 1.45fr) minmax(290px, 1fr); }
      .panel { border-radius: var(--dw-radius-lg); border: 1px solid var(--dw-border-subtle); padding: 12px; }
      .panel-head { display: flex; justify-content: space-between; gap: 10px; align-items: start; margin-bottom: 10px; }
      .panel-head p { margin: 0; text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; color: var(--dw-text-muted); font-weight: 600; }
      .panel-head h2, .panel-head h3 { margin: 2px 0 0; }

      .count-row { display: flex; gap: 6px; flex-wrap: wrap; }
      .count-row span { border: 1px solid var(--dw-border-subtle); background: var(--dw-surface-card); border-radius: 999px; min-height: 28px; padding: 0 10px; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }
      .count-row .bad { color: var(--dw-error); border-color: color-mix(in srgb, var(--dw-error) 40%, transparent); }
      .count-row mat-icon { font-size: 14px; width: 14px; height: 14px; }

      .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(172px, 1fr)); gap: 10px; }
      .items-list-mobile { display: flex; flex-direction: column; gap: 8px; }
      .item { border: 1px solid var(--dw-border-subtle); border-radius: var(--dw-radius-md); overflow: hidden; text-decoration: none; color: inherit; background: color-mix(in srgb, var(--dw-surface-elevated) 90%, transparent); min-height: 195px; display: flex; flex-direction: column; }
      .item .card-image { width: 100%; height: 118px; background: var(--dw-surface-base); }
      .item .card-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .item .card-content { padding: 9px; display: grid; gap: 2px; }
      .item .card-content span { color: var(--dw-text-primary); font-weight: 600; line-height: 1.2; }
      .item .card-content small { color: var(--dw-text-secondary); font-size: 11px; }
      .item.missing { justify-content: center; }
      .item.missing .card-image { display: grid; place-items: center; }
      .missing-icon { width: 40px; height: 40px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid color-mix(in srgb, var(--dw-error) 34%, transparent); background: color-mix(in srgb, var(--dw-error) 10%, transparent); color: var(--dw-error); }
      .items-list-mobile .mobile-item { min-height: 120px; flex-direction: row; align-items: center; }
      .items-list-mobile .mobile-item .card-image { width: 120px; height: 120px; flex: 0 0 120px; border-right: 1px solid var(--dw-border-subtle); }
      .items-list-mobile .mobile-item .card-image img { width: 100%; height: 100%; object-fit: cover; }
      .items-list-mobile .mobile-item .card-content { flex: 1; padding: 10px; display: flex; flex-direction: column; justify-content: center; }
      .items-list-mobile .mobile-item .card-content span { font-size: 12px; }
      .items-list-mobile .mobile-item .card-content small { font-size: 10.5px; }
      .items-list-mobile .mobile-item.missing .card-image { height: 120px; }

      .side { display: grid; gap: 10px; align-content: start; }
      .next { border: 1px solid var(--dw-border-subtle); background: color-mix(in srgb, var(--dw-primary) 8%, var(--dw-surface-elevated) 92%); border-radius: var(--dw-radius-md); padding: 10px; display: grid; gap: 2px; }
      .next span { text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; color: var(--dw-text-muted); font-weight: 600; }
      .next strong { font-size: 14px; }
      .date-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
      .date-list span { border: 1px solid var(--dw-border-subtle); border-radius: 999px; min-height: 26px; padding: 0 10px; display: inline-flex; align-items: center; font-size: 12px; background: var(--dw-surface-card); }
      .date-list.past span { color: var(--dw-text-secondary); font-size: 11px; }
      .muted { margin: 0; color: var(--dw-text-secondary); line-height: 1.5; }
      .palette { display: grid; gap: 8px; }
      .palette .row { border: 1px solid var(--dw-border-subtle); border-radius: var(--dw-radius-full); background: color-mix(in srgb, var(--dw-surface-card) 90%, transparent); min-height: 30px; padding: 0 10px; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; }
      .dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid color-mix(in srgb, black 12%, transparent); }
      .palette small { color: var(--dw-text-muted); font-size: 11px; }

      .not-found { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
      .not-found mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--dw-text-muted); }

      @media (max-width: 1024px) {
        .hero-grid, .content { grid-template-columns: 1fr; }
        .media { min-height: 300px; }
      }

      @media (max-width: 768px) {
        .page {
          padding: 10px;
          gap: 10px;
        }

        .hero,
        .panel {
          border-radius: 14px;
          padding: 10px;
          box-shadow: var(--dw-shadow-sm);
        }

        .hero {
          background:
            radial-gradient(
              circle at 14% 0%,
              color-mix(in srgb, var(--dw-primary) 16%, transparent),
              transparent 44%
            ),
            var(--dw-surface-overlay);
        }

        .hero-header {
          align-items: flex-start;
          gap: 8px;
        }

        .favorite-btn {
          width: 40px;
          height: 40px;
          margin-top: 2px;
          border-radius: 12px;
        }

        .title p {
          font-size: 10.5px;
        }

        .title h1 {
          font-size: 1.28rem;
        }

        .title span {
          font-size: 12px;
        }

        .media {
          min-height: 248px;
          border-radius: 12px;
        }

        .media-grid {
          gap: 6px;
          padding: 8px;
        }

        .more {
          top: 8px;
          right: 8px;
          min-height: 28px;
          font-size: 12px;
          backdrop-filter: blur(4px);
        }

        .chips {
          left: 8px;
          right: 8px;
          bottom: 8px;
          gap: 5px;
        }

        .chips mat-chip {
          min-height: 24px;
          font-size: 10.5px;
          padding: 0 8px;
        }

        .stat-grid {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: minmax(146px, 1fr);
          overflow-x: auto;
          gap: 8px;
          padding-bottom: 2px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .stat-grid::-webkit-scrollbar {
          display: none;
        }

        .stat-grid article {
          padding: 9px;
          min-height: 86px;
          align-content: start;
        }

        .stat-grid strong {
          font-size: 1rem;
        }

        .stat-grid small {
          font-size: 11px;
          line-height: 1.3;
        }

        .actions {
          grid-template-columns: 1fr 1fr;
          gap: 7px;
        }

        .actions button:first-child {
          grid-column: 1 / -1;
        }

        .actions button {
          min-height: 40px;
          justify-content: flex-start;
          padding-inline: 10px;
          font-size: 12px;
          border-radius: 10px;
        }

        .content {
          gap: 10px;
        }

        .panel-head {
          gap: 8px;
          margin-bottom: 8px;
        }

        .panel-head h2,
        .panel-head h3 {
          font-size: 1.04rem;
        }

        .count-row span {
          min-height: 26px;
          font-size: 11.5px;
          padding: 0 9px;
        }

        .items-grid {
          grid-template-columns: 1fr;
          gap: 8px;
        }

        .item {
          min-height: 120px;
          flex-direction: row;
          align-items: center;
        }

        .item .card-image {
          width: 120px;
          height: 120px;
          flex: 0 0 120px;
          border-right: 1px solid var(--dw-border-subtle);
        }

        .item .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item .card-content {
          flex: 1;
          padding: 10px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .item .card-content span {
          font-size: 12px;
        }

        .item .card-content small {
          font-size: 10.5px;
        }

        .item.missing .card-image {
          height: 120px;
        }

        .next {
          padding: 9px;
        }

        .date-list {
          gap: 6px;
          margin-top: 7px;
        }

        .date-list span {
          min-height: 24px;
          font-size: 11px;
          padding: 0 9px;
        }

        .palette {
          gap: 6px;
        }

        .palette .row {
          min-height: 28px;
          padding: 0 9px;
          gap: 7px;
        }

        .dot {
          width: 12px;
          height: 12px;
        }
      }

    `,
  ],
})
export class OutfitDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private wardrobeService = inject(WardrobeService);
  private uiState = inject(AppUiStateService);
  private destroyRef = inject(DestroyRef);

  isDetailLoading = signal(true);
  outfit = signal<Outfit | undefined>(undefined);
  isFavoritePending = signal(false);
  todayIso = signal(new Date().toISOString().slice(0, 10));
  isMobile = this.uiState.isMobile;

  isDeletePending = computed(() => {
    const id = this.outfit()?.id;
    return !!id && this.wardrobeService.isDeleteMutationPending(id);
  });

  isMarkWornPending = computed(() => {
    const id = this.outfit()?.id;
    return !!id && this.wardrobeService.isMarkWornMutationPending(id);
  });

  resolvedItems = computed<OutfitResolvedItem[]>(() => {
    const selectedOutfit = this.outfit();
    if (!selectedOutfit) {
      return [];
    }

    return selectedOutfit.items.map((sourceItem) => {
      const data =
        sourceItem.type === 'wardrobe'
          ? this.wardrobeService.getItemById(sourceItem.itemId)
          : this.wardrobeService.getAccessoryById(sourceItem.itemId);
      return { source: sourceItem, data: data ?? null, type: sourceItem.type };
    });
  });

  detailPreviewImages = computed<string[]>(() => {
    const selectedOutfit = this.outfit();
    if (!selectedOutfit) {
      return [];
    }
    const seen = new Set<string>();
    const images: string[] = [];
    for (const resolvedItem of this.resolvedItems()) {
      const imageUrl = resolvedItem.data?.imageUrl;
      if (!imageUrl || seen.has(imageUrl)) {
        continue;
      }
      seen.add(imageUrl);
      images.push(imageUrl);
      if (images.length === MAX_DETAIL_PREVIEW_IMAGES) {
        return images;
      }
    }
    if (images.length === 0 && selectedOutfit.imageUrl) {
      images.push(selectedOutfit.imageUrl);
    }
    return images;
  });

  hiddenDetailItemsCount = computed<number>(() => {
    const selectedOutfit = this.outfit();
    if (!selectedOutfit) {
      return 0;
    }
    return Math.max(0, selectedOutfit.items.length - MAX_DETAIL_PREVIEW_IMAGES);
  });

  itemCounts = computed(() => {
    let wardrobe = 0;
    let accessory = 0;
    let missing = 0;

    for (const item of this.resolvedItems()) {
      if (item.type === 'wardrobe') {
        wardrobe++;
      } else {
        accessory++;
      }

      if (!item.data) {
        missing++;
      }
    }

    return { wardrobe, accessory, missing };
  });

  wardrobePiecesCount = computed(() => this.itemCounts().wardrobe);
  accessoryPiecesCount = computed(() => this.itemCounts().accessory);
  missingPiecesCount = computed(() => this.itemCounts().missing);

  sortedPlannedDates = computed<string[]>(() => {
    const selectedOutfit = this.outfit();
    if (!selectedOutfit?.plannedDates?.length) {
      return [];
    }
    const uniqueDays = Array.from(new Set(selectedOutfit.plannedDates));
    return uniqueDays.sort((a, b) => this.toDateSortValue(a) - this.toDateSortValue(b));
  });

  upcomingPlannedDates = computed<string[]>(() =>
    this.sortedPlannedDates().filter((day) => day >= this.todayIso()),
  );
  pastPlannedDates = computed<string[]>(() =>
    [...this.sortedPlannedDates().filter((day) => day < this.todayIso())].reverse(),
  );
  nextPlannedDate = computed<string | null>(() => this.upcomingPlannedDates()[0] ?? null);

  colorPalette = computed<OutfitColorSwatch[]>(() => {
    const swatches = new Map<string, OutfitColorSwatch>();
    for (const resolvedItem of this.resolvedItems()) {
      const data = resolvedItem.data;
      if (!data) {
        continue;
      }
      const hex = data.colorHex || '#b8a28a';
      const label = data.color || 'Unknown';
      const key = `${hex.toLowerCase()}::${label.toLowerCase()}`;
      const existing = swatches.get(key);
      if (existing) {
        swatches.set(key, { ...existing, count: existing.count + 1 });
        continue;
      }
      swatches.set(key, { hex, label, count: 1 });
    }
    return Array.from(swatches.values())
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, MAX_DETAIL_COLOR_SWATCHES);
  });

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.isDetailLoading.set(true);
      void this.loadOutfitDetails(params.get('id'));
    });
  }

  goBack(): void {
    this.location.back();
  }

  async toggleFavorite(): Promise<void> {
    const selectedOutfit = this.outfit();
    if (
      !selectedOutfit ||
      this.isFavoritePending() ||
      this.isDeletePending() ||
      this.isMarkWornPending()
    ) {
      return;
    }

    this.isFavoritePending.set(true);
    try {
      await this.wardrobeService.updateOutfit(selectedOutfit.id, { favorite: !selectedOutfit.favorite });
      this.outfit.set(this.wardrobeService.getOutfitById(selectedOutfit.id));
    } catch {
      // Keep page interactive on failure.
    } finally {
      this.isFavoritePending.set(false);
    }
  }

  async deleteOutfit(): Promise<void> {
    const id = this.outfit()?.id;
    if (!id || this.isDeletePending() || this.isMarkWornPending() || this.isFavoritePending()) {
      return;
    }
    if (confirm('Delete this outfit? This action cannot be undone.')) {
      try {
        await this.wardrobeService.deleteOutfit(id);
        await this.router.navigate(['/outfits']);
      } catch {
        // Keep page interactive if delete fails.
      }
    }
  }

  async markAsWorn(): Promise<void> {
    const id = this.outfit()?.id;
    if (!id || this.isMarkWornPending() || this.isDeletePending() || this.isFavoritePending()) {
      return;
    }
    try {
      await this.wardrobeService.markOutfitAsWorn(id);
      this.outfit.set(this.wardrobeService.getOutfitById(id));
    } catch {
      // Keep detail page interactive if update fails.
    }
  }

  displayTypeLabel(type: 'wardrobe' | 'accessory'): string {
    return type === 'wardrobe' ? 'Wardrobe' : 'Accessory';
  }

  displayLabel(value: string | null | undefined): string {
    if (!value) {
      return 'Unspecified';
    }
    return value
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter((token) => token.length > 0)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');
  }

  private toDateSortValue(day: string): number {
    const value = Date.parse(day);
    return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
  }

  private async loadOutfitDetails(id: string | null): Promise<void> {
    if (!id) {
      this.outfit.set(undefined);
      this.isDetailLoading.set(false);
      return;
    }
    try {
      const loadedOutfit = await this.wardrobeService.fetchOutfitById(id);
      this.outfit.set(loadedOutfit);
      if (loadedOutfit) {
        await this.wardrobeService.ensureOutfitDependenciesLoaded(loadedOutfit);
      }
    } catch {
      this.outfit.set(undefined);
    } finally {
      this.isDetailLoading.set(false);
    }
  }
}

