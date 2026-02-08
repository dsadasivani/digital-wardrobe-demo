import {Component, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { WardrobeService } from '../../../core/services/wardrobe.service';
import { Outfit } from '../../../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'dw-outfit-detail',
    imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatChipsModule],
    template: `
    @if (outfit(); as selectedOutfit) {
    <div class="outfit-detail-container animate-fade-in">
      <header class="detail-header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ selectedOutfit.name }}</h1>
        <div class="actions">
          <button mat-stroked-button color="warn" (click)="deleteOutfit()">
            <mat-icon>delete</mat-icon> Delete
          </button>
          <button mat-flat-button color="primary" [routerLink]="['/outfit-canvas', selectedOutfit.id]">
            <mat-icon>edit</mat-icon> Edit
          </button>
        </div>
      </header>

      <div class="detail-content">
        <div class="image-section glass">
          <img [src]="selectedOutfit.imageUrl" [alt]="selectedOutfit.name">
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
              @for (outfitItem of selectedOutfit.items; track outfitItem.itemId) {
                <div class="item-card glass">
                  <div class="item-icon"><mat-icon>checkroom</mat-icon></div>
                  <span>{{ outfitItem.itemId }}</span>
                </div>
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
             <h3>Last Worn</h3>
             <p>{{ selectedOutfit.lastWorn ? (selectedOutfit.lastWorn | date) : 'Never' }}</p>
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

    .image-section {
      border-radius: var(--dw-radius-xl);
      overflow: hidden;
      position: relative;
      aspect-ratio: 3/4;
      
      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .meta-overlay {
        position: absolute;
        bottom: 16px;
        left: 16px;
        display: flex;
        gap: 8px;
        
        .badge {
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 12px;
          backdrop-filter: blur(4px);
        }
      }
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .item-card {
      padding: 12px;
      border-radius: var(--dw-radius-md);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
      font-size: 12px;
      color: var(--dw-text-secondary);
    }
  `]
})
export class OutfitDetailComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private location = inject(Location);
    private wardrobeService = inject(WardrobeService);

    outfit = signal<Outfit | undefined>(undefined);

    ngOnInit() {
        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                const found = this.wardrobeService.outfitList().find(o => o.id === id);
                this.outfit.set(found);
            }
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
}
