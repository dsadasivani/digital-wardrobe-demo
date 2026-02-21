import { CommonModule, Location } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  Signal,
  WritableSignal,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Accessory } from '../../../core/models';
import { CatalogOptionsService } from '../../../core/services';
import { WardrobeService } from '../../../core/services/wardrobe.service';
import { DetailSkeletonComponent } from '../../../shared/components/detail-skeleton/detail-skeleton.component';
import { InlineActionLoaderComponent } from '../../../shared/components/inline-action-loader/inline-action-loader.component';
import { ImageReadyDirective } from '../../../shared/directives/image-ready.directive';

interface DetailActionFeedback {
  kind: 'favorite' | 'worn';
  icon: string;
  label: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-accessory-detail',
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
      <dw-detail-skeleton icon="watch"></dw-detail-skeleton>
    } @else if (accessory()) {
      <div class="accessory-detail-page animate-fade-in">
        <section class="hero glass">
          <header class="hero-header">
            <button mat-icon-button (click)="goBack()" aria-label="Go back">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <div class="title">
              <p>Accessory Detail</p>
              <h1>{{ accessory()!.name }}</h1>
              <span>Added {{ accessory()!.createdAt | date: 'mediumDate' }}</span>
            </div>
            <button
              mat-icon-button
              class="favorite-btn"
              [class.active]="accessory()!.favorite"
              [class.feedback-pop]="favoritePulse()"
              [disabled]="isFavoritePending() || isDeletePending() || isMarkWornPending()"
              (click)="toggleFavorite()"
              [attr.aria-label]="accessory()!.favorite ? 'Remove favorite' : 'Add favorite'"
            >
              <mat-icon>{{ accessory()!.favorite ? 'favorite' : 'favorite_border' }}</mat-icon>
            </button>
          </header>

          <div class="hero-stats">
            <article class="worn-stat" [class.feedback-pop]="wornStatPulse()">
              <label>Worn</label>
              <strong class="wear-count" [class.bump]="wornStatPulse()">{{ accessory()!.worn }}x</strong>
              <small>{{ accessory()!.lastWorn ? ('Last ' + (accessory()!.lastWorn | date: 'MMM d')) : 'Never worn' }}</small>
            </article>
            <article>
              <label>Category</label>
              <strong>{{ categoryLabel() }}</strong>
              <small>{{ accessory()!.occasion || 'Any occasion' }}</small>
            </article>
            <article>
              <label>Color</label>
              <strong>{{ accessory()!.color }}</strong>
              <small>{{ accessory()!.brand || 'Brand unspecified' }}</small>
            </article>
          </div>

          <div class="hero-actions">
            <button mat-flat-button color="primary" class="mark-worn-btn" [class.feedback-pop]="markWornPulse()" (click)="markAsWorn()" [disabled]="isMarkWornPending() || isDeletePending() || isFavoritePending()">
              <mat-icon>check_circle</mat-icon>
              Mark as Worn
            </button>
            <button mat-stroked-button [routerLink]="['/accessories', accessory()!.id, 'edit']">
              <mat-icon>edit</mat-icon>
              Edit
            </button>
            <button mat-stroked-button color="warn" (click)="deleteAccessory()" [disabled]="isDeletePending() || isMarkWornPending() || isFavoritePending()">
              <mat-icon>delete</mat-icon>
              Delete
            </button>
          </div>

          @if (actionFeedback(); as feedback) {
            <div
              class="action-feedback"
              [class.favorite]="feedback.kind === 'favorite'"
              [class.worn]="feedback.kind === 'worn'"
              role="status"
              aria-live="polite"
            >
              <mat-icon>{{ feedback.icon }}</mat-icon>
              <span>{{ feedback.label }}</span>
            </div>
          }

          @if (isDeletePending() || isMarkWornPending() || isFavoritePending()) {
            <div class="pending">
              @if (isDeletePending()) {
                <dw-inline-action-loader
                  label="Deleting accessory..."
                  tone="destructive"
                  icon="delete_forever"
                ></dw-inline-action-loader>
              }
              @if (isMarkWornPending()) {
                <dw-inline-action-loader
                  label="Updating wear count..."
                  tone="positive"
                  icon="check_circle"
                ></dw-inline-action-loader>
              }
              @if (isFavoritePending()) {
                <dw-inline-action-loader
                  label="Saving favorite..."
                  tone="positive"
                  icon="favorite"
                ></dw-inline-action-loader>
              }
            </div>
          }
        </section>

        <div class="content-grid">
          <div class="image-column">
            <section class="image-panel glass">
              @for (frame of imageFrames(); track frame.key) {
                <img
                  class="animated-gallery-image"
                  [src]="frame.url"
                  [dwImageReady]="frame.url"
                  [alt]="accessory()!.name"
                  [style.--swipe-shift.px]="frame.slideOffset"
                  (touchstart)="onImageTouchStart($event)"
                  (touchend)="onImageTouchEnd($event)"
                  (touchcancel)="onImageTouchCancel()"
                >
              }
              @if (isCurrentImagePrimary()) {
                <span class="primary-image-badge" aria-label="Primary image">
                  <mat-icon>workspace_premium</mat-icon>
                </span>
              }
              @if (imageGallery().length > 1) {
                <button type="button" class="image-nav-btn image-nav-prev" (click)="showPreviousImage($event)" aria-label="Show previous image">
                  <mat-icon>chevron_left</mat-icon>
                </button>
                <button type="button" class="image-nav-btn image-nav-next" (click)="showNextImage($event)" aria-label="Show next image">
                  <mat-icon>chevron_right</mat-icon>
                </button>
                <span class="image-counter">{{ selectedImageIndex() + 1 }} / {{ imageGallery().length }}</span>
              }
            </section>
            @if (imageGallery().length > 1) {
              <div class="image-gallery">
                @for (url of imageGallery(); track i; let i = $index) {
                  <button
                    type="button"
                    class="thumb-btn"
                    [class.active]="selectedImageIndex() === i"
                    (click)="selectedImageIndex.set(i)"
                  >
                    <img [src]="url" [dwImageReady]="url" [alt]="accessory()!.name + ' image ' + (i + 1)">
                    @if (i === primaryImageIndex()) {
                      <span class="thumb-primary-icon" aria-label="Primary image">
                        <mat-icon>workspace_premium</mat-icon>
                      </span>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <section class="info-panel glass">
            <header class="panel-head">
              <div>
                <p>Overview</p>
                <h2>Accessory Details</h2>
              </div>
            </header>
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
              <div><span class="label">Occasion</span><strong>{{ accessory()!.occasion || 'Unspecified' }}</strong></div>
              <div><span class="label">Brand</span><strong>{{ accessory()!.brand || 'Unspecified' }}</strong></div>
              <div><span class="label">Price</span><strong>{{ accessory()!.price ? ('$' + accessory()!.price) : 'Not listed' }}</strong></div>
              <div><span class="label">Purchased</span><strong>{{ accessory()!.purchaseDate ? (accessory()!.purchaseDate | date: 'mediumDate') : 'Unknown' }}</strong></div>
              <div><span class="label">Created</span><strong>{{ accessory()!.createdAt | date: 'mediumDate' }}</strong></div>
              <div><span class="label">Last Worn</span><strong>{{ accessory()!.lastWorn ? (accessory()!.lastWorn | date: 'mediumDate') : 'Never' }}</strong></div>
            </div>

            @if (accessory()!.tags.length) {
              <div class="tags-group">
                <h3>Style Tags</h3>
                <div class="tags">
                @for (tag of accessory()!.tags; track tag) {
                  <mat-chip>{{ tag }}</mat-chip>
                }
                </div>
              </div>
            } @else {
              <p class="muted">No tags yet.</p>
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
                    <img [src]="related.imageUrl" [dwImageReady]="related.imageUrl" [alt]="related.name">
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
    .accessory-detail-page { max-width: 1200px; margin: 0 auto; padding: var(--dw-spacing-xl); display: grid; gap: var(--dw-spacing-lg); }
    .hero { border-radius: var(--dw-radius-xl); border: 1px solid var(--dw-border-subtle); padding: 14px; display: grid; gap: 10px; }
    .hero-header { display: flex; gap: 10px; align-items: center; }
    .title { flex: 1; min-width: 0; }
    .title p { margin: 0; text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; color: var(--dw-text-muted); font-weight: 600; }
    .title h1 { margin: 2px 0 0; font-size: clamp(1.35rem, 2.8vw, 2rem); line-height: 1.15; }
    .title span { color: var(--dw-text-secondary); font-size: 13px; }
    .favorite-btn { position: relative; border: 1px solid var(--dw-border-subtle); background: var(--dw-surface-elevated); }
    .favorite-btn mat-icon { color: var(--dw-text-secondary); transition: color 180ms ease, transform 180ms ease; }
    .favorite-btn.active mat-icon { color: var(--dw-accent); }
    .favorite-btn.feedback-pop { animation: detailActionPop 280ms cubic-bezier(0.2, 0.9, 0.2, 1); }
    .favorite-btn.feedback-pop mat-icon { animation: detailHeartBeat 420ms ease; }
    .hero-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .hero-stats article { border: 1px solid var(--dw-border-subtle); border-radius: var(--dw-radius-md); padding: 10px; background: color-mix(in srgb, var(--dw-surface-elevated) 90%, transparent); display: grid; gap: 2px; }
    .hero-stats label { text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; color: var(--dw-text-muted); font-weight: 600; }
    .hero-stats strong { font-size: 1.1rem; line-height: 1.05; }
    .hero-stats small { color: var(--dw-text-secondary); font-size: 12px; }
    .worn-stat.feedback-pop { border-color: color-mix(in srgb, var(--dw-primary) 44%, var(--dw-border-subtle)); }
    .wear-count.bump { animation: detailCountPop 340ms cubic-bezier(0.18, 0.9, 0.22, 1); }
    .hero-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .hero-actions button { width: 100%; }
    .mark-worn-btn {
      --mdc-filled-button-container-color: var(--dw-primary-dark) !important;
      --mdc-filled-button-label-text-color: var(--dw-primary-light) !important;
      color: var(--dw-primary-light) !important;
      border: 1px solid color-mix(in srgb, var(--dw-primary-light) 24%, transparent);
      font-weight: 600;
    }
    .mark-worn-btn.feedback-pop { animation: detailActionPop 280ms cubic-bezier(0.2, 0.9, 0.2, 1); }
    .mark-worn-btn:hover:not(:disabled) { filter: brightness(1.04); }
    .mark-worn-btn:disabled { opacity: 0.62; }
    .action-feedback {
      width: fit-content;
      min-height: 32px;
      border-radius: var(--dw-radius-full);
      border: 1px solid var(--dw-border-subtle);
      padding: 0 12px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      background: var(--dw-surface-card);
      animation: detailFeedbackIn 220ms ease-out;
    }
    .action-feedback mat-icon { width: 16px; height: 16px; font-size: 16px; }
    .action-feedback.favorite {
      border-color: color-mix(in srgb, var(--dw-accent) 35%, transparent);
      color: var(--dw-accent);
      background: color-mix(in srgb, var(--dw-accent) 11%, var(--dw-surface-card));
    }
    .action-feedback.worn {
      border-color: color-mix(in srgb, var(--dw-primary) 35%, transparent);
      color: var(--dw-primary-dark);
      background: color-mix(in srgb, var(--dw-primary) 12%, var(--dw-surface-card));
    }
    .pending { display: flex; gap: 8px; flex-wrap: wrap; }
    .content-grid { display: grid; gap: var(--dw-spacing-lg); grid-template-columns: minmax(280px, 420px) 1fr; }
    .image-column { display: grid; gap: 10px; align-content: start; }
    .image-panel { position: relative; border-radius: var(--dw-radius-xl); overflow: hidden; aspect-ratio: 3/4; }
    .image-panel img { width: 100%; height: 100%; object-fit: cover; }
    .animated-gallery-image {
      animation: imageSwipeIn 220ms ease;
      will-change: transform, opacity;
    }
    @keyframes imageSwipeIn {
      from {
        transform: translateX(var(--swipe-shift, 8px)) scale(0.995);
      }
      to {
        transform: translateX(0) scale(1);
      }
    }
    @keyframes detailActionPop {
      0% { transform: scale(1); }
      40% { transform: scale(1.12); }
      100% { transform: scale(1); }
    }
    @keyframes detailHeartBeat {
      0% { transform: scale(1); }
      36% { transform: scale(1.22); }
      62% { transform: scale(0.94); }
      100% { transform: scale(1); }
    }
    @keyframes detailCountPop {
      0% { transform: scale(1); }
      45% { transform: scale(1.18); color: var(--dw-primary); }
      100% { transform: scale(1); }
    }
    @keyframes detailFeedbackIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .primary-image-badge {
      position: absolute;
      left: 12px;
      top: 12px;
      z-index: 3;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      color: var(--dw-on-primary);
      border: 1px solid color-mix(in srgb, var(--dw-on-primary) 28%, transparent);
      background:
        radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--dw-on-primary) 35%, transparent), transparent 45%),
        linear-gradient(145deg, color-mix(in srgb, var(--dw-primary) 86%, black 14%), color-mix(in srgb, var(--dw-primary) 62%, black 38%));
      box-shadow:
        0 8px 18px color-mix(in srgb, var(--dw-primary) 36%, transparent),
        0 2px 6px rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(4px);
    }
    .primary-image-badge mat-icon { width: 17px; height: 17px; font-size: 17px; }
    .image-nav-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 999px;
      background: color-mix(in srgb, var(--dw-overlay-scrim) 78%, transparent);
      color: var(--dw-on-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 2;
    }
    .image-nav-prev { left: 10px; }
    .image-nav-next { right: 10px; }
    .image-nav-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .image-counter {
      position: absolute;
      left: 50%;
      bottom: 10px;
      transform: translateX(-50%);
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      color: var(--dw-on-primary);
      background: color-mix(in srgb, var(--dw-overlay-scrim) 72%, transparent);
    }
    .image-gallery { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .thumb-btn { position: relative; width: 64px; height: 64px; padding: 0; border: 1px solid var(--dw-border-subtle); border-radius: 10px; overflow: hidden; background: var(--dw-surface-card); }
    .thumb-btn.active { border-color: var(--dw-primary); box-shadow: var(--dw-shadow-sm); }
    .thumb-primary-icon {
      position: absolute;
      left: 4px;
      top: 4px;
      width: 20px;
      height: 20px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--dw-on-primary) 24%, transparent);
      background: linear-gradient(145deg, color-mix(in srgb, var(--dw-primary) 82%, black 18%), color-mix(in srgb, var(--dw-primary) 56%, black 44%));
      color: var(--dw-on-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px color-mix(in srgb, var(--dw-primary) 34%, transparent);
    }
    .thumb-primary-icon mat-icon { width: 12px; height: 12px; font-size: 12px; }
    .thumb-btn img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .info-panel { border-radius: var(--dw-radius-xl); border: 1px solid var(--dw-border-subtle); padding: 12px; display: flex; flex-direction: column; gap: 12px; }
    .panel-head { display: flex; justify-content: space-between; gap: 10px; align-items: start; margin-bottom: 2px; }
    .panel-head p { margin: 0; text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; color: var(--dw-text-muted); font-weight: 600; }
    .panel-head h2 { margin: 2px 0 0; font-size: 1.1rem; }
    .top-meta { display: flex; flex-wrap: wrap; gap: 8px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: var(--dw-surface-card); border: 1px solid var(--dw-border-subtle); font-size: 12px; }
    .badge.favorite { color: var(--dw-accent); }
    .color-dot { width: 10px; height: 10px; border-radius: 50%; }
    .stats { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
    .stats div { border: 1px solid var(--dw-border-subtle); border-radius: var(--dw-radius-md); padding: 10px; background: color-mix(in srgb, var(--dw-surface-elevated) 90%, transparent); }
    .label { display: block; color: var(--dw-text-secondary); font-size: 12px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.08em; }
    .stats strong { line-height: 1.3; }
    .tags-group h3 { margin: 0 0 8px; font-size: 1rem; }
    .tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .muted { margin: 0; color: var(--dw-text-secondary); line-height: 1.45; }
    .related-section { margin-top: var(--dw-spacing-2xl); }
    .related-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .related-header h2 { font-size: 1.2rem; margin: 0; }
    .related-header a { color: var(--dw-primary); text-decoration: none; font-size: 13px; font-weight: 600; }
    .related-container { position: relative; }
    .related-row { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(160px, 180px); gap: 12px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; -ms-overflow-style: none; }
    .related-row::-webkit-scrollbar { display: none; }
    .related-card { border-radius: var(--dw-radius-lg); overflow: hidden; text-decoration: none; color: inherit; border: 1px solid var(--dw-border-subtle); }
    .related-card img { width: 100%; height: 180px; object-fit: cover; display: block; }
    .related-meta { padding: 10px; display: flex; flex-direction: column; gap: 2px; }
    .related-meta .name { font-size: 13px; font-weight: 600; color: var(--dw-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .related-meta .sub { font-size: 12px; color: var(--dw-text-secondary); }
    .related-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--dw-border-strong); background: var(--dw-surface-elevated); color: var(--dw-text-primary); display: inline-flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: var(--dw-shadow-sm); z-index: 2; }
    .related-prev { left: 6px; }
    .related-next { right: 6px; }
    .related-nav mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; }
    .not-found mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--dw-text-muted); }
    @media (max-width: 900px) {
      .accessory-detail-page { padding: var(--dw-spacing-md); }
      .content-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .accessory-detail-page { padding: 10px; gap: 10px; }
      .hero,
      .info-panel { border-radius: 14px; padding: 10px; box-shadow: var(--dw-shadow-sm); }
      .hero {
        background:
          radial-gradient(
            circle at 14% 0%,
            color-mix(in srgb, var(--dw-primary) 16%, transparent),
            transparent 44%
          ),
          var(--dw-surface-overlay);
      }
      .hero-header { align-items: flex-start; gap: 8px; }
      .title p { font-size: 10.5px; }
      .title h1 { font-size: 1.28rem; }
      .title span { font-size: 12px; }
      .favorite-btn { width: 40px; height: 40px; margin-top: 2px; border-radius: 12px; }
      .hero-stats {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(146px, 1fr);
        overflow-x: auto;
        gap: 8px;
        padding-bottom: 2px;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .hero-stats::-webkit-scrollbar { display: none; }
      .hero-stats article { padding: 9px; min-height: 86px; align-content: start; }
      .hero-stats strong { font-size: 1rem; }
      .hero-stats small { font-size: 11px; line-height: 1.3; }
      .hero-actions { grid-template-columns: 1fr 1fr; gap: 7px; }
      .hero-actions button:first-child { grid-column: 1 / -1; }
      .hero-actions button { min-height: 40px; justify-content: flex-start; padding-inline: 10px; font-size: 12px; border-radius: 10px; }
      .pending { gap: 6px; }
      .content-grid { gap: 12px; }
      .image-panel { border-radius: var(--dw-radius-lg); aspect-ratio: 4/3; }
      .primary-image-badge { left: 8px; top: 8px; width: 30px; height: 30px; }
      .image-nav-btn { width: 32px; height: 32px; }
      .image-nav-prev { left: 8px; }
      .image-nav-next { right: 8px; }
      .image-nav-btn { display: none; }
      .image-counter { bottom: 8px; }
      .thumb-btn { width: 56px; height: 56px; }
      .panel-head h2 { font-size: 1.04rem; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .related-section { margin-top: 16px; }
      .related-header { margin-bottom: 8px; }
      .related-row { grid-auto-columns: minmax(132px, 146px); gap: 8px; }
      .related-card img { height: 136px; }
      .related-meta { padding: 8px; }
      .related-nav { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .favorite-btn.feedback-pop,
      .favorite-btn.feedback-pop mat-icon,
      .mark-worn-btn.feedback-pop,
      .wear-count.bump,
      .action-feedback {
        animation: none !important;
      }
    }
  `]
})
export class AccessoryDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly SWIPE_THRESHOLD_PX = 36;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private wardrobeService = inject(WardrobeService);
  private catalogOptionsService = inject(CatalogOptionsService);
  private relatedRowRef = viewChild<ElementRef<HTMLElement>>('relatedRow');

  accessoryId = signal<string | null>(null);
  isDetailLoading = signal(true);
  selectedImageIndex = signal(0);
  imageAnimationKey = signal(0);
  imageSlideOffsetPx = signal(10);
  accessory: Signal<Accessory | undefined> = computed(() => {
    const id = this.accessoryId();
    if (!id) {
      return undefined;
    }
    return this.wardrobeService.accessoryList().find(item => item.id === id);
  });
  imageGallery = computed(() => {
    const current = this.accessory();
    if (!current) {
      return [];
    }
    return current.imageUrls?.length ? current.imageUrls : [current.imageUrl];
  });
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
      slideOffset: this.imageSlideOffsetPx(),
    },
  ]);
  primaryImageUrl = computed(() => {
    const current = this.accessory();
    if (!current) {
      return '';
    }
    return current.primaryImageUrl?.trim() || current.imageUrl?.trim() || '';
  });
  primaryImageIndex = computed(() => {
    const gallery = this.imageGallery();
    if (!gallery.length) {
      return -1;
    }
    const primaryUrl = this.primaryImageUrl();
    const index = gallery.findIndex(url => url === primaryUrl);
    return index >= 0 ? index : 0;
  });
  isCurrentImagePrimary = computed(() => this.primaryImageIndex() === this.selectedImageIndex());
  canScrollLeft = signal(false);
  canScrollRight = signal(true);
  favoritePulse = signal(false);
  markWornPulse = signal(false);
  wornStatPulse = signal(false);
  actionFeedback = signal<DetailActionFeedback | null>(null);
  isDeletePending = computed(() => {
    const id = this.accessoryId();
    return !!id && this.wardrobeService.isDeleteMutationPending(id);
  });
  isMarkWornPending = computed(() => {
    const id = this.accessoryId();
    return !!id && this.wardrobeService.isMarkWornMutationPending(id);
  });
  isFavoritePending = computed(() => {
    const id = this.accessoryId();
    return !!id && this.wardrobeService.isFavoriteMutationPending(id);
  });
  touchStartX = signal<number | null>(null);
  touchStartY = signal<number | null>(null);
  categoryOptions = this.catalogOptionsService.accessoryCategories;
  private actionFeedbackTimeoutId = signal<number | null>(null);
  private favoritePulseTimeoutId = signal<number | null>(null);
  private markWornPulseTimeoutId = signal<number | null>(null);
  private wornStatPulseTimeoutId = signal<number | null>(null);

  categoryLabel = computed(() => {
    const category = this.accessory()?.category;
    if (!category) {
      return '';
    }
    return this.categoryOptions().find((option) => option.id === category)?.label
      ?? this.formatCategoryLabel(category);
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
    void this.loadCategoryOptions();
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.accessoryId.set(id);
      this.isDetailLoading.set(true);
      this.selectedImageIndex.set(0);
      void this.loadAccessoryForRoute(id);
      queueMicrotask(() => this.refreshRelatedScrollState());
    });
  }

  ngAfterViewInit(): void {
    queueMicrotask(() => this.refreshRelatedScrollState());
  }

  ngOnDestroy(): void {
    this.clearTimer(this.actionFeedbackTimeoutId);
    this.clearTimer(this.favoritePulseTimeoutId);
    this.clearTimer(this.markWornPulseTimeoutId);
    this.clearTimer(this.wornStatPulseTimeoutId);
  }

  goBack(): void {
    this.location.back();
  }

  async deleteAccessory(): Promise<void> {
    const current = this.accessory();
    if (!current || this.isDeletePending() || this.isMarkWornPending() || this.isFavoritePending()) {
      return;
    }
    if (confirm(`Delete "${current.name}" from accessories?`)) {
      try {
        await this.wardrobeService.deleteAccessory(current.id);
        await this.router.navigate(['/accessories']);
      } catch {
        // Keep page interactive if delete fails.
      }
    }
  }

  async markAsWorn(): Promise<void> {
    const current = this.accessory();
    if (!current || this.isMarkWornPending() || this.isDeletePending() || this.isFavoritePending()) {
      return;
    }
    try {
      await this.wardrobeService.markAccessoryAsWorn(current.id);
      this.triggerMarkWornFeedback();
    } catch {
      // Keep detail page interactive if update fails.
    }
  }

  async toggleFavorite(): Promise<void> {
    const current = this.accessory();
    if (!current || this.isFavoritePending() || this.isDeletePending() || this.isMarkWornPending()) {
      return;
    }
    const isAddingFavorite = !current.favorite;
    try {
      await this.wardrobeService.toggleAccessoryFavorite(current.id);
      this.triggerFavoriteFeedback(isAddingFavorite);
    } catch {
      // Keep page interactive if update fails.
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

  showPreviousImage(event?: Event): void {
    event?.stopPropagation();
    this.shiftImage(-1);
  }

  showNextImage(event?: Event): void {
    event?.stopPropagation();
    this.shiftImage(1);
  }

  onImageTouchStart(event: TouchEvent): void {
    if (this.imageGallery().length < 2 || event.touches.length !== 1) {
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

    if (
      this.imageGallery().length < 2 ||
      startX === null ||
      startY === null ||
      event.changedTouches.length !== 1
    ) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX < AccessoryDetailComponent.SWIPE_THRESHOLD_PX || absDeltaX <= absDeltaY) {
      return;
    }

    this.shiftImage(deltaX < 0 ? 1 : -1);
  }

  onImageTouchCancel(): void {
    this.touchStartX.set(null);
    this.touchStartY.set(null);
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    this.shiftImage(-1);
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    this.shiftImage(1);
  }

  private refreshRelatedScrollState(): void {
    const container = this.relatedRowRef()?.nativeElement;
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

  private shiftImage(step: number): void {
    const total = this.imageGallery().length;
    if (total < 2) {
      return;
    }
    this.imageSlideOffsetPx.set(step >= 0 ? 10 : -10);
    this.imageAnimationKey.update(value => value + 1);
    this.selectedImageIndex.update(current => ((current + step) % total + total) % total);
  }

  private async loadAccessoryForRoute(id: string | null): Promise<void> {
    if (!id) {
      this.isDetailLoading.set(false);
      return;
    }
    try {
      await this.wardrobeService.fetchAccessoryById(id);
    } catch {
      // Keep page shell visible and let navigation recover naturally.
    } finally {
      this.isDetailLoading.set(false);
    }
  }

  private async loadCategoryOptions(): Promise<void> {
    try {
      await this.catalogOptionsService.ensureAccessoryOptionsLoaded();
    } catch {
      // Keep detail page usable with fallback labels if metadata is unavailable.
    }
  }

  private formatCategoryLabel(category: string): string {
    return category
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (value) => value.toUpperCase());
  }

  private triggerFavoriteFeedback(isAddingFavorite: boolean): void {
    this.triggerPulse('favorite');
    this.showActionFeedback({
      kind: 'favorite',
      icon: isAddingFavorite ? 'favorite' : 'favorite_border',
      label: isAddingFavorite ? 'Added to favorites' : 'Removed from favorites',
    });
    this.triggerHaptics(14);
  }

  private triggerMarkWornFeedback(): void {
    this.triggerPulse('mark-worn');
    this.triggerPulse('worn-stat');
    this.showActionFeedback({
      kind: 'worn',
      icon: 'check_circle',
      label: 'Wear logged',
    });
    this.triggerHaptics([12, 38, 16]);
  }

  private triggerPulse(type: 'favorite' | 'mark-worn' | 'worn-stat'): void {
    const durationMs = 360;
    if (type === 'favorite') {
      this.clearTimer(this.favoritePulseTimeoutId);
      this.favoritePulse.set(false);
      this.favoritePulseTimeoutId.set(window.setTimeout(() => {
        this.favoritePulse.set(true);
        this.favoritePulseTimeoutId.set(window.setTimeout(() => {
          this.favoritePulse.set(false);
          this.favoritePulseTimeoutId.set(null);
        }, durationMs));
      }, 0));
      return;
    }

    if (type === 'mark-worn') {
      this.clearTimer(this.markWornPulseTimeoutId);
      this.markWornPulse.set(false);
      this.markWornPulseTimeoutId.set(window.setTimeout(() => {
        this.markWornPulse.set(true);
        this.markWornPulseTimeoutId.set(window.setTimeout(() => {
          this.markWornPulse.set(false);
          this.markWornPulseTimeoutId.set(null);
        }, durationMs));
      }, 0));
      return;
    }

    this.clearTimer(this.wornStatPulseTimeoutId);
    this.wornStatPulse.set(false);
    this.wornStatPulseTimeoutId.set(window.setTimeout(() => {
      this.wornStatPulse.set(true);
      this.wornStatPulseTimeoutId.set(window.setTimeout(() => {
        this.wornStatPulse.set(false);
        this.wornStatPulseTimeoutId.set(null);
      }, durationMs));
    }, 0));
  }

  private showActionFeedback(feedback: DetailActionFeedback): void {
    this.clearTimer(this.actionFeedbackTimeoutId);
    this.actionFeedback.set(feedback);
    this.actionFeedbackTimeoutId.set(window.setTimeout(() => {
      this.actionFeedback.set(null);
      this.actionFeedbackTimeoutId.set(null);
    }, 1800));
  }

  private triggerHaptics(pattern: number | number[]): void {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return;
    }
    navigator.vibrate(pattern);
  }

  private clearTimer(timerIdSignal: WritableSignal<number | null>): void {
    const timerId = timerIdSignal();
    if (timerId === null) {
      return;
    }
    clearTimeout(timerId);
    timerIdSignal.set(null);
  }
}
