import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { WardrobeService } from '../../../core/services/wardrobe.service';
import { Accessory, Outfit, OutfitItem, WardrobeItem } from '../../../core/models';
import { ImageReadyDirective } from '../../../shared/directives/image-ready.directive';

interface OutfitResolvedItem {
  source: OutfitItem;
  data: WardrobeItem | Accessory | null;
  type: 'wardrobe' | 'accessory';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'dw-outfit-detail',
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatChipsModule, ImageReadyDirective],
    template: `
    @if (outfit(); as selectedOutfit) {
    <div class="outfit-detail-container animate-fade-in">
      <header class="detail-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ selectedOutfit.name }}</h1>
        <div class="actions">
          <button mat-stroked-button color="primary" (click)="markAsWorn()">
            <mat-icon>check_circle</mat-icon> Mark as Worn
          </button>
          <button mat-stroked-button color="warn" (click)="deleteOutfit()">
            <mat-icon>delete</mat-icon> Delete
          </button>
          <button mat-flat-button color="primary" class="edit-btn" [routerLink]="['/outfit-canvas', selectedOutfit.id]">
            <mat-icon>edit</mat-icon> Edit
          </button>
        </div>
      </header>

      <div class="detail-content">
        <div class="image-section glass">
          @if (detailPreviewImages(); as previewImages) {
            @if (previewImages.length > 0) {
              <div
                class="hero-image-grid"
                [class.layout-1]="previewImages.length === 1"
                [class.layout-2]="previewImages.length === 2"
                [class.layout-3]="previewImages.length === 3"
              >
                @for (imageUrl of previewImages; track imageUrl + '-' + $index) {
                  <div class="hero-grid-cell">
                    <img [src]="imageUrl" [dwImageReady]="imageUrl" [alt]="selectedOutfit.name + ' item ' + ($index + 1)" />
                  </div>
                }
              </div>
            } @else {
              <div class="hero-image-fallback">
                <mat-icon>style</mat-icon>
              </div>
            }
          }
          @if (hiddenDetailItemsCount() > 0) {
            <div class="hero-more-badge">+{{ hiddenDetailItemsCount() }}</div>
          }
          <div class="meta-overlay">
            @if (selectedOutfit.season) {
              <span class="badge">{{ selectedOutfit.season }}</span>
            }
            @if (selectedOutfit.occasion) {
              <span class="badge">{{ selectedOutfit.occasion }}</span>
            }
          </div>
        </div>

        <div class="info-section">
          <section class="items-list">
            <h3>Items in this Look</h3>
            <div class="items-grid">
              @for (resolvedItem of resolvedItems(); track resolvedItem.source.itemId) {
                @if (resolvedItem.data; as itemData) {
                  <a
                    class="item-card glass"
                    [routerLink]="resolvedItem.type === 'wardrobe' ? ['/wardrobe', itemData.id] : ['/accessories', itemData.id]"
                  >
                    <img [src]="itemData.imageUrl" [dwImageReady]="itemData.imageUrl" [alt]="itemData.name" />
                    <span>{{ itemData.name }}</span>
                    <small>{{ resolvedItem.type === 'wardrobe' ? 'Wardrobe' : 'Accessory' }}</small>
                  </a>
                } @else {
                  <div class="item-card glass missing">
                    <div class="item-icon">
                      <mat-icon>{{ resolvedItem.type === 'wardrobe' ? 'checkroom' : 'watch' }}</mat-icon>
                    </div>
                    <span>Unavailable Item</span>
                    <small>{{ resolvedItem.source.itemId }}</small>
                  </div>
                }
              }
            </div>
          </section>

          @if (selectedOutfit.notes) {
            <section class="notes-section">
              <h3>Notes</h3>
              <p>{{ selectedOutfit.notes }}</p>
            </section>
          }
          
          <section class="dates-section">
             <h3>Worn Count</h3>
             <p>{{ selectedOutfit.worn }} times</p>
          </section>

          <section class="dates-section">
             <h3>Last Worn</h3>
             <p>{{ selectedOutfit.lastWorn ? (selectedOutfit.lastWorn | date) : 'Never' }}</p>
          </section>

          <section class="dates-section">
             <h3>Scheduled Dates</h3>
             @if (selectedOutfit.plannedDates?.length) {
               <div class="planned-list">
                 @for (day of selectedOutfit.plannedDates; track day) {
                   <span class="planned-chip">{{ day }}</span>
                 }
               </div>
             } @else {
               <p>Not scheduled yet</p>
             }
          </section>
        </div>
      </div>
    </div>
    }
  `,
    styles: [`
    .outfit-detail-container {
      padding: var(--dw-spacing-xl);
      max-width: 1000px;
      margin: 0 auto;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: var(--dw-spacing-xl);

      h1 { margin: 0; flex: 1; }
      
      .actions {
        display: flex;
        gap: 8px;
      }
    }

    .detail-content {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--dw-spacing-2xl);
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: var(--dw-spacing-lg);
    }

    .items-list h3,
    .notes-section h3,
    .dates-section h3 {
      margin: 0 0 8px;
      font-size: 1rem;
    }

    .notes-section p,
    .dates-section p {
      margin: 0;
      color: var(--dw-text-secondary);
    }

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

    .image-section {
      border-radius: var(--dw-radius-xl);
      overflow: hidden;
      position: relative;
      aspect-ratio: 3/4;
      background:
        radial-gradient(circle at 12% 14%, color-mix(in srgb, var(--dw-primary) 16%, transparent), transparent 58%),
        var(--dw-surface-elevated);

      .meta-overlay {
        position: absolute;
        bottom: 16px;
        left: 16px;
        display: flex;
        gap: 8px;
        
        .badge {
          background: color-mix(in srgb, var(--dw-overlay-scrim) 92%, transparent);
          color: var(--dw-on-primary);
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          backdrop-filter: blur(4px);
        }
      }
    }
    .hero-image-grid {
      position: absolute;
      inset: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 8px;
      padding: 10px;
    }
    .hero-grid-cell {
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid color-mix(in srgb, var(--dw-border-subtle) 76%, transparent);
      background: color-mix(in srgb, var(--dw-surface-card) 80%, black);
    }
    .hero-grid-cell img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .hero-image-grid.layout-1 .hero-grid-cell:nth-child(1) { grid-column: 1 / span 2; grid-row: 1 / span 2; }
    .hero-image-grid.layout-2 .hero-grid-cell:nth-child(1) { grid-row: 1 / span 2; }
    .hero-image-grid.layout-3 .hero-grid-cell:nth-child(1) { grid-row: 1 / span 2; }
    .hero-image-fallback {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      color: var(--dw-text-muted);
    }
    .hero-image-fallback mat-icon { font-size: 52px; width: 52px; height: 52px; }
    .hero-more-badge {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 2;
      min-width: 40px;
      height: 34px;
      padding: 0 12px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: color-mix(in srgb, var(--dw-overlay-scrim) 90%, transparent);
      color: var(--dw-on-primary);
      border: 1px solid color-mix(in srgb, var(--dw-border-strong) 38%, transparent);
      font-size: 13px;
      font-weight: 700;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .item-card {
      text-decoration: none;
      padding: 12px;
      border-radius: var(--dw-radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
      font-size: 12px;
      color: var(--dw-text-secondary);
      min-height: 172px;
      transition: transform var(--dw-transition-fast), box-shadow var(--dw-transition-fast);
    }

    .item-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--dw-shadow-md);
    }

    .item-card img {
      width: 100%;
      height: 102px;
      object-fit: cover;
      border-radius: var(--dw-radius-sm);
    }

    .item-card span {
      color: var(--dw-text-primary);
      font-weight: 600;
      line-height: 1.2;
    }

    .item-card small {
      font-size: 11px;
      color: var(--dw-text-muted);
    }

    .item-card.missing {
      justify-content: center;
    }

    .item-card.missing .item-icon {
      width: 42px;
      height: 42px;
      border-radius: 999px;
      background: var(--dw-surface-card);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .planned-list {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .planned-chip {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--dw-surface-card);
      border: 1px solid var(--dw-border-subtle);
      color: var(--dw-text-primary);
    }

    @media (max-width: 768px) {
      .outfit-detail-container {
        padding: 12px;
      }

      .detail-header {
        gap: 10px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .detail-header h1 {
        font-size: 1.15rem;
        line-height: 1.25;
      }

      .detail-header .actions {
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .detail-header .actions button {
        width: 100%;
        min-height: 40px;
      }

      .detail-content {
        gap: 12px;
      }

      .image-section {
        aspect-ratio: 4 / 3;
        border-radius: var(--dw-radius-lg);
      }

      .hero-image-grid {
        gap: 6px;
        padding: 8px;
      }
      .hero-more-badge {
        top: 10px;
        right: 10px;
        height: 30px;
        min-width: 36px;
        padding: 0 10px;
        font-size: 12px;
      }

      .image-section .meta-overlay {
        left: 10px;
        bottom: 10px;
        gap: 6px;
        flex-wrap: wrap;
        max-width: calc(100% - 20px);
      }

      .items-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 10px;
      }

      .item-card {
        min-height: 142px;
        padding: 8px;
        gap: 6px;
      }

      .item-card img {
        height: 76px;
      }

      .item-card span {
        font-size: 12px;
      }
    }
  `]
})
export class OutfitDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private wardrobeService = inject(WardrobeService);

    outfit = signal<Outfit | undefined>(undefined);
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

        return {
          source: sourceItem,
          data: data ?? null,
          type: sourceItem.type,
        };
      });
    });
    detailPreviewImages = computed<string[]>(() => {
      const selectedOutfit = this.outfit();
      if (!selectedOutfit) {
        return [];
      }

      const uniqueImages: string[] = [];
      for (const resolvedItem of this.resolvedItems()) {
        const imageUrl = resolvedItem.data?.imageUrl;
        if (!imageUrl || uniqueImages.includes(imageUrl)) {
          continue;
        }
        uniqueImages.push(imageUrl);
        if (uniqueImages.length === 4) {
          return uniqueImages;
        }
      }

      if (uniqueImages.length === 0 && selectedOutfit.imageUrl) {
        uniqueImages.push(selectedOutfit.imageUrl);
      }

      return uniqueImages;
    });
    hiddenDetailItemsCount = computed<number>(() => {
      const selectedOutfit = this.outfit();
      if (!selectedOutfit) {
        return 0;
      }
      return Math.max(0, selectedOutfit.items.length - 4);
    });

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            void this.loadOutfitDetails(id);
        });
    }

    goBack() {
        this.location.back();
    }

    deleteOutfit() {
        if (confirm('Are you sure you want to delete this outfit?')) {
            const id = this.outfit()?.id;
            if (id) {
                this.wardrobeService.deleteOutfit(id);
                this.router.navigate(['/outfits']);
            }
        }
    }

    async markAsWorn(): Promise<void> {
        const id = this.outfit()?.id;
        if (!id) {
          return;
        }
        await this.wardrobeService.markOutfitAsWorn(id);
        this.outfit.set(this.wardrobeService.getOutfitById(id));
    }

    private async loadOutfitDetails(id: string | null): Promise<void> {
        if (!id) {
            this.outfit.set(undefined);
            return;
        }
        try {
            const outfit = await this.wardrobeService.fetchOutfitById(id);
            this.outfit.set(outfit);
            if (outfit) {
              await this.wardrobeService.ensureOutfitDependenciesLoaded(outfit);
            }
        } catch {
            this.outfit.set(undefined);
        }
    }
}
