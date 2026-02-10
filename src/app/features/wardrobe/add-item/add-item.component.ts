import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WardrobeService } from '../../../core/services';
import { WARDROBE_CATEGORIES, WardrobeCategory } from '../../../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'dw-add-item',
    imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
    template: `
    <div class="add-item-page animate-fade-in">
      <header class="page-header">
        <h1>Add New Item</h1>
        <p class="subtitle">Add a new piece to your wardrobe</p>
      </header>

      <div class="upload-section glass">
        <div class="drop-zone" [class.has-image]="previewUrl()" (click)="fileInput.click()">
          @if (previewUrl()) {
            <img [src]="previewUrl()" alt="Preview" class="preview-image">
            <button class="remove-btn" (click)="removeImage($event)"><mat-icon>close</mat-icon></button>
          } @else {
            <mat-icon>add_photo_alternate</mat-icon>
            <p>Click or drag to upload image</p>
            <span>PNG, JPG up to 10MB</span>
          }
        </div>
        <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)">
      </div>

      <form class="item-form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Item Name</mat-label>
          <input matInput [(ngModel)]="itemName" name="name" required placeholder="e.g., Blue Oxford Shirt">
        </mat-form-field>

        <div class="form-row">
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
            <input matInput [(ngModel)]="color" name="color" required placeholder="e.g., Navy Blue">
          </mat-form-field>
        </div>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Brand (optional)</mat-label>
            <input matInput [(ngModel)]="brand" name="brand" placeholder="e.g., Ralph Lauren">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Size (optional)</mat-label>
            <input matInput [(ngModel)]="size" name="size" placeholder="e.g., M, 32, 10">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Tags (comma separated)</mat-label>
          <input matInput [(ngModel)]="tags" name="tags" placeholder="e.g., casual, work, summer">
        </mat-form-field>

        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
          <button mat-raised-button color="primary" class="submit-btn" type="submit">Add to Wardrobe</button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .add-item-page { padding: var(--dw-spacing-xl); max-width: 800px; margin: 0 auto; }
    .page-header { margin-bottom: var(--dw-spacing-xl); }
    .subtitle { color: var(--dw-text-secondary); margin: 0; }
    .upload-section { padding: var(--dw-spacing-lg); border-radius: var(--dw-radius-xl); margin-bottom: var(--dw-spacing-xl); }
    .drop-zone { position: relative; aspect-ratio: 4/3; max-height: 300px; border: 2px dashed var(--dw-surface-card); border-radius: var(--dw-radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .drop-zone:hover { border-color: var(--dw-primary); background: rgba(124,58,237,0.05); }
    .drop-zone mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--dw-text-muted); margin-bottom: 16px; }
    .drop-zone p { color: var(--dw-text-primary); margin: 0 0 8px; }
    .drop-zone span { font-size: 12px; color: var(--dw-text-muted); }
    .drop-zone.has-image { border-style: solid; border-color: var(--dw-primary); }
    .preview-image { width: 100%; height: 100%; object-fit: contain; border-radius: var(--dw-radius-md); }
    .remove-btn { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.6); border: none; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .item-form { display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 16px; }
    .form-row mat-form-field { flex: 1; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
    .submit-btn {
      --mdc-protected-button-container-color: transparent !important;
      --mdc-protected-button-label-text-color: var(--dw-primary) !important;
      --mdc-protected-button-container-elevation: 0 !important;
      background: transparent !important;
      color: var(--dw-primary) !important;
      border: none !important;
      box-shadow: none !important;
      font-weight: 600;
    }
    .submit-btn:hover { background: color-mix(in srgb, var(--dw-primary) 10%, transparent) !important; }
    @media (max-width: 768px) {
      .add-item-page {
        padding: 12px;
      }

      .page-header {
        margin-bottom: 12px;
      }

      .page-header h1 {
        font-size: 1.25rem;
      }

      .upload-section {
        padding: 12px;
        margin-bottom: 12px;
        border-radius: var(--dw-radius-lg);
      }

      .drop-zone {
        aspect-ratio: 4 / 3;
        max-height: none;
        min-height: 220px;
      }

      .drop-zone mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        margin-bottom: 10px;
      }

      .drop-zone p {
        font-size: 13px;
      }

      .drop-zone span {
        font-size: 11px;
      }

      .item-form {
        gap: 10px;
      }

      .form-row {
        flex-direction: column;
        gap: 10px;
      }

      .form-actions {
        margin-top: 8px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .form-actions button {
        width: 100%;
      }
    }
  `]
})
export class AddItemComponent {
    private wardrobeService = inject(WardrobeService);
    private router = inject(Router);

    categories = WARDROBE_CATEGORIES;
    itemName = '';
    category = '';
    color = '';
    brand = '';
    size = '';
    tags = '';
    previewUrl = signal<string | null>(null);

    onFileSelected(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => this.previewUrl.set(reader.result as string);
            reader.readAsDataURL(file);
        }
    }

    removeImage(event: Event) {
        event.stopPropagation();
        this.previewUrl.set(null);
    }

    onSubmit() {
        if (this.itemName && this.category && this.color) {
            this.wardrobeService.addItem({
                name: this.itemName,
                category: this.category as WardrobeCategory,
                color: this.color,
                colorHex: '#7c3aed',
                brand: this.brand || undefined,
                size: this.size || undefined,
                imageUrl: this.previewUrl() || 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=500&fit=crop',
                favorite: false,
                tags: this.tags.split(',').map(t => t.trim()).filter(t => t),
            });
            this.router.navigate(['/wardrobe']);
        }
    }

    cancel() {
        this.router.navigate(['/wardrobe']);
    }
}
