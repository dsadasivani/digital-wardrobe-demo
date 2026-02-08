import { CommonModule, Location } from '@angular/common';
import {Component, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { WARDROBE_CATEGORIES, WardrobeCategory, WardrobeItem } from '../../../core/models';
import { WardrobeService } from '../../../core/services/wardrobe.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-edit-item',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    @if (itemId()) {
      <div class="edit-item-page animate-fade-in">
        <header class="page-header">
          <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1>Edit Item</h1>
            <p>Update wardrobe item details</p>
          </div>
        </header>

        <form class="edit-form glass" (ngSubmit)="save()">
          <div class="image-preview">
            <img [src]="imageUrl" alt="Item image preview">
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput [(ngModel)]="name" name="name" required>
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="category" name="category" required>
                @for (cat of categories; track cat.id) {
                  <mat-option [value]="cat.id">{{ cat.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Color</mat-label>
              <input matInput [(ngModel)]="color" name="color" required>
            </mat-form-field>
          </div>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Brand</mat-label>
              <input matInput [(ngModel)]="brand" name="brand">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Size</mat-label>
              <input matInput [(ngModel)]="size" name="size">
            </mat-form-field>
          </div>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Price</mat-label>
              <input matInput type="number" min="0" step="0.01" [(ngModel)]="price" name="price">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Purchase Date</mat-label>
              <input matInput type="date" [(ngModel)]="purchaseDate" name="purchaseDate">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Image URL</mat-label>
            <input matInput [(ngModel)]="imageUrl" name="imageUrl">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tags (comma separated)</mat-label>
            <input matInput [(ngModel)]="tags" name="tags">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Notes</mat-label>
            <textarea matInput rows="3" [(ngModel)]="notes" name="notes"></textarea>
          </mat-form-field>

          <div class="actions">
            <button mat-stroked-button type="button" (click)="goBack()">Cancel</button>
            <button mat-flat-button color="primary" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    } @else {
      <div class="not-found animate-fade-in">
        <mat-icon>search_off</mat-icon>
        <h2>Item not found</h2>
        <button mat-flat-button color="primary" routerLink="/wardrobe">Back to wardrobe</button>
      </div>
    }
  `,
  styles: [`
    .edit-item-page { padding: var(--dw-spacing-xl); max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: var(--dw-spacing-lg); }
    .page-header h1 { margin: 0; }
    .page-header p { margin: 4px 0 0; color: var(--dw-text-secondary); }
    .edit-form { border-radius: var(--dw-radius-xl); padding: var(--dw-spacing-lg); display: flex; flex-direction: column; gap: 14px; }
    .image-preview { width: 180px; height: 220px; border-radius: var(--dw-radius-md); overflow: hidden; border: 1px solid var(--dw-surface-card); }
    .image-preview img { width: 100%; height: 100%; object-fit: cover; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-form-field { width: 100%; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; }
    .not-found mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--dw-text-muted); }
    @media (max-width: 768px) {
      .edit-item-page { padding: var(--dw-spacing-md); }
      .row { grid-template-columns: 1fr; }
    }
  `]
})
export class EditItemComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private wardrobeService = inject(WardrobeService);

  categories = WARDROBE_CATEGORIES;
  itemId = signal<string | null>(null);

  name = '';
  category: WardrobeCategory = 'tops';
  color = '';
  brand = '';
  size = '';
  price = '';
  purchaseDate = '';
  imageUrl = '';
  tags = '';
  notes = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.itemId.set(id);
      const item = id ? this.wardrobeService.getItemById(id) : undefined;
      if (item) {
        this.patchForm(item);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  save(): void {
    const id = this.itemId();
    if (!id || !this.name || !this.category || !this.color) {
      return;
    }

    this.wardrobeService.updateItem(id, {
      name: this.name.trim(),
      category: this.category,
      color: this.color.trim(),
      brand: this.brand.trim() || undefined,
      size: this.size.trim() || undefined,
      price: this.price ? Number(this.price) : undefined,
      purchaseDate: this.purchaseDate ? new Date(this.purchaseDate) : undefined,
      imageUrl: this.imageUrl.trim(),
      tags: this.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      notes: this.notes.trim() || undefined,
    });

    this.router.navigate(['/wardrobe', id]);
  }

  private patchForm(item: WardrobeItem): void {
    this.name = item.name;
    this.category = item.category;
    this.color = item.color;
    this.brand = item.brand ?? '';
    this.size = item.size ?? '';
    this.price = item.price?.toString() ?? '';
    this.purchaseDate = item.purchaseDate ? this.toDateInput(item.purchaseDate) : '';
    this.imageUrl = item.imageUrl;
    this.tags = item.tags.join(', ');
    this.notes = item.notes ?? '';
  }

  private toDateInput(date: Date): string {
    const actual = date instanceof Date ? date : new Date(date);
    return actual.toISOString().split('T')[0];
  }
}
