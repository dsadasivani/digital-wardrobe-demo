import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ACCESSORY_CATEGORIES, AccessoryCategory } from '../../../core/models';
import { WardrobeService } from '../../../core/services/wardrobe.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-add-accessory',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="add-accessory-page animate-fade-in">
      <header class="page-header">
        <button mat-icon-button routerLink="/accessories" aria-label="Back to accessories">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>Add Accessory</h1>
          <p>Create a new accessory entry in your collection</p>
        </div>
      </header>

      <div class="upload-section glass">
        <div class="drop-zone" [class.has-image]="previewUrl()" (click)="fileInput.click()">
          @if (previewUrl()) {
            <img [src]="previewUrl()!" alt="Preview" class="preview-image">
            <button class="remove-btn" type="button" (click)="removeImage($event)">
              <mat-icon>close</mat-icon>
            </button>
          } @else {
            <mat-icon>add_photo_alternate</mat-icon>
            <p>Click to upload accessory image</p>
            <span>PNG or JPG up to 10MB</span>
          }
        </div>
        <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)">
      </div>

      <form class="accessory-form glass" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput [(ngModel)]="name" name="name" required placeholder="e.g., Classic Leather Belt">
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="category" name="category" required>
              @for (entry of categories; track entry.id) {
                <mat-option [value]="entry.id">{{ entry.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Color</mat-label>
            <input matInput [(ngModel)]="color" name="color" required placeholder="e.g., Black">
          </mat-form-field>
        </div>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Color Hex</mat-label>
            <input matInput [(ngModel)]="colorHex" name="colorHex" required placeholder="#1a1a1a">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Brand</mat-label>
            <input matInput [(ngModel)]="brand" name="brand" placeholder="e.g., Gucci">
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Image URL (optional)</mat-label>
          <input matInput [(ngModel)]="imageUrl" name="imageUrl" placeholder="https://...">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tags (comma separated)</mat-label>
          <input matInput [(ngModel)]="tags" name="tags" placeholder="e.g., formal, everyday, travel">
        </mat-form-field>

        <div class="actions">
          <button mat-stroked-button type="button" routerLink="/accessories">Cancel</button>
          <button mat-flat-button color="primary" type="submit" class="save-btn">Save Accessory</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .add-accessory-page { padding: var(--dw-spacing-xl); max-width: 960px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: var(--dw-spacing-lg); }
    .page-header h1 { margin: 0; }
    .page-header p { margin: 4px 0 0; color: var(--dw-text-secondary); }
    .upload-section { padding: var(--dw-spacing-lg); border-radius: var(--dw-radius-xl); margin-bottom: var(--dw-spacing-lg); }
    .drop-zone { position: relative; aspect-ratio: 4/3; max-height: 280px; border: 2px dashed var(--dw-surface-card); border-radius: var(--dw-radius-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all var(--dw-transition-fast); }
    .drop-zone:hover { border-color: var(--dw-primary); background: color-mix(in srgb, var(--dw-primary) 10%, transparent); }
    .drop-zone mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--dw-text-muted); margin-bottom: 12px; }
    .drop-zone p { margin: 0 0 6px; color: var(--dw-text-primary); }
    .drop-zone span { font-size: 12px; color: var(--dw-text-secondary); }
    .drop-zone.has-image { border-style: solid; border-color: var(--dw-primary); }
    .preview-image { width: 100%; height: 100%; object-fit: contain; border-radius: var(--dw-radius-md); }
    .remove-btn { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(0, 0, 0, 0.62); color: white; display: flex; align-items: center; justify-content: center; }
    .accessory-form { border-radius: var(--dw-radius-xl); padding: var(--dw-spacing-lg); display: flex; flex-direction: column; gap: 14px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-form-field { width: 100%; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
    .save-btn {
      --mdc-filled-button-container-color: transparent !important;
      --mdc-filled-button-label-text-color: var(--dw-primary) !important;
      background: transparent !important;
      color: var(--dw-primary) !important;
      border: none !important;
      box-shadow: none !important;
      min-width: 150px;
      font-weight: 600;
    }
    .save-btn:hover {
      background: color-mix(in srgb, var(--dw-primary) 10%, transparent) !important;
    }
    @media (max-width: 768px) {
      .add-accessory-page { padding: var(--dw-spacing-md); }
      .row { grid-template-columns: 1fr; }
    }
  `],
})
export class AddAccessoryComponent {
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);

  categories = ACCESSORY_CATEGORIES;
  name = '';
  category: AccessoryCategory = 'bags';
  color = '';
  colorHex = '#8b4513';
  brand = '';
  imageUrl = '';
  tags = '';
  previewUrl = signal<string | null>(null);

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.previewUrl.set(null);
  }

  save(): void {
    if (!this.name.trim() || !this.color.trim() || !this.colorHex.trim()) {
      return;
    }
    const normalizedHex = this.colorHex.trim().startsWith('#')
      ? this.colorHex.trim()
      : `#${this.colorHex.trim()}`;

    this.wardrobeService.addAccessory({
      name: this.name.trim(),
      category: this.category,
      color: this.color.trim(),
      colorHex: normalizedHex,
      brand: this.brand.trim() || undefined,
      imageUrl:
        this.previewUrl() ||
        this.imageUrl.trim() ||
        'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=400&fit=crop',
      favorite: false,
      tags: this.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    this.router.navigate(['/accessories']);
  }
}
