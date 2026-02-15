import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ACCESSORY_CATEGORIES, AccessoryCategory, OCCASION_OPTIONS } from '../../../core/models';
import { ImageCropperService } from '../../../core/services';
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
        <div class="drop-zone" [class.has-image]="previewUrls().length > 0" (click)="fileInput.click()">
          @if (previewUrls().length > 0) {
            <img [src]="primaryPreviewUrl()" alt="Preview" class="preview-image">
            <div class="image-meta">{{ previewUrls().length }} image{{ previewUrls().length > 1 ? 's' : '' }}</div>
            <button class="remove-btn" type="button" (click)="clearImages($event)">
              <mat-icon>close</mat-icon>
            </button>
          } @else {
            <mat-icon>add_photo_alternate</mat-icon>
            <p>Click to upload accessory image</p>
            <span>PNG or JPG up to 10MB (crop each image)</span>
          }
        </div>
        <input #fileInput type="file" accept="image/*" multiple hidden (change)="onFileSelected($event)">
        @if (previewUrls().length > 0) {
          <div class="preview-grid">
            @for (url of previewUrls(); track i; let i = $index) {
              <div class="preview-thumb" [class.active]="i === selectedImageIndex()">
                <img [src]="url" [alt]="'Image ' + (i + 1)" (click)="setPrimaryImage(i, $event)">
                @if (i === selectedImageIndex()) {
                  <span class="primary-chip">Primary</span>
                } @else {
                  <button type="button" class="primary-btn" (click)="setPrimaryImage(i, $event)">Set primary</button>
                }
                <button type="button" class="thumb-remove" (click)="removeImage(i, $event)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>
        }
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
          <mat-label>Occasion (optional)</mat-label>
          <mat-select [(ngModel)]="occasion" name="occasion">
            <mat-option [value]="''">None</mat-option>
            @for (option of occasionOptions; track option) {
              <mat-option [value]="option">{{ option | titlecase }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Purchased Date (optional)</mat-label>
          <input matInput type="date" [(ngModel)]="purchaseDate" name="purchaseDate">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Price (optional)</mat-label>
          <input matInput type="number" min="0" step="0.01" [(ngModel)]="price" name="price" placeholder="e.g., 49.99">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tags (comma separated)</mat-label>
          <input matInput [(ngModel)]="tags" name="tags" placeholder="e.g., formal, everyday, travel">
        </mat-form-field>

        @if (errorMessage()) {
          <p class="form-error">{{ errorMessage() }}</p>
        }

        <div class="actions">
          <button mat-stroked-button type="button" routerLink="/accessories">Cancel</button>
          <button mat-flat-button color="primary" type="submit" class="save-btn" [disabled]="isSaving()">Save Accessory</button>
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
    .image-meta { position: absolute; left: 10px; bottom: 10px; padding: 4px 10px; border-radius: 999px; font-size: 12px; background: color-mix(in srgb, var(--dw-overlay-scrim) 90%, transparent); color: var(--dw-on-primary); }
    .remove-btn { position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%; border: none; background: rgba(0, 0, 0, 0.62); color: white; display: flex; align-items: center; justify-content: center; }
    .preview-grid { margin-top: 10px; display: grid; grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); gap: 8px; }
    .preview-thumb { position: relative; border: 1px solid var(--dw-border-subtle); border-radius: 10px; overflow: hidden; aspect-ratio: 1; background: var(--dw-surface-card); }
    .preview-thumb.active { border-color: var(--dw-primary); box-shadow: var(--dw-shadow-sm); }
    .preview-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .primary-chip { position: absolute; left: 4px; top: 4px; padding: 2px 7px; border-radius: 999px; background: color-mix(in srgb, var(--dw-primary) 84%, black 16%); color: var(--dw-on-primary); font-size: 10px; font-weight: 600; }
    .primary-btn { position: absolute; left: 4px; bottom: 4px; border: none; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 600; background: color-mix(in srgb, var(--dw-overlay-scrim) 85%, transparent); color: var(--dw-on-primary); }
    .thumb-remove { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border: none; border-radius: 50%; background: color-mix(in srgb, var(--dw-overlay-scrim) 90%, transparent); color: var(--dw-on-primary); display: inline-flex; align-items: center; justify-content: center; }
    .thumb-remove mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .accessory-form { border-radius: var(--dw-radius-xl); padding: var(--dw-spacing-lg); display: flex; flex-direction: column; gap: 14px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-form-field { width: 100%; }
    .form-error { margin: 0; color: var(--dw-error); font-size: 13px; }
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
      .add-accessory-page { padding: 12px; }
      .page-header { align-items: flex-start; gap: 10px; margin-bottom: 12px; }
      .page-header h1 { font-size: 1.25rem; line-height: 1.25; }
      .page-header p { font-size: 13px; margin-top: 2px; }
      .upload-section { padding: 12px; margin-bottom: 12px; border-radius: var(--dw-radius-lg); }
      .drop-zone { min-height: 220px; max-height: none; }
      .drop-zone mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 10px; }
      .drop-zone p { font-size: 13px; }
      .drop-zone span { font-size: 11px; }
      .accessory-form { border-radius: var(--dw-radius-lg); padding: 12px; gap: 10px; }
      .row { grid-template-columns: 1fr; gap: 10px; }
      .actions { margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .actions button { width: 100%; min-height: 40px; }
      .save-btn { min-width: 0; }
    }
  `],
})
export class AddAccessoryComponent {
  private wardrobeService = inject(WardrobeService);
  private imageCropper = inject(ImageCropperService);
  private router = inject(Router);

  categories = ACCESSORY_CATEGORIES;
  occasionOptions = OCCASION_OPTIONS;
  name = '';
  category: AccessoryCategory = 'bags';
  color = '';
  colorHex = '#8b4513';
  brand = '';
  price = '';
  occasion = '';
  purchaseDate = '';
  tags = '';
  previewUrls = signal<string[]>([]);
  selectedImageIndex = signal(0);
  primaryPreviewUrl = computed(() => this.previewUrls()[this.selectedImageIndex()] ?? this.previewUrls()[0] ?? '');
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (!files.length) {
      return;
    }
    this.errorMessage.set(null);
    const croppedUrls: string[] = [];
    try {
      for (const file of files) {
        const cropped = await this.imageCropper.cropFile(file, {
          title: 'Crop Accessory Image',
          aspectRatio: 3 / 4,
          maxOutputWidth: 1200,
          maxOutputHeight: 1600,
          quality: 0.9,
        });
        if (cropped) {
          croppedUrls.push(cropped);
        }
      }
      if (croppedUrls.length) {
        this.previewUrls.update(existing => [...existing, ...croppedUrls]);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open image cropper.';
      this.errorMessage.set(message);
    }
  }

  removeImage(index: number, event: Event): void {
    event.stopPropagation();
    this.previewUrls.update(images => images.filter((_, i) => i !== index));
    this.selectedImageIndex.update(current => {
      if (current === index) {
        return 0;
      }
      if (current > index) {
        return current - 1;
      }
      return current;
    });
  }

  clearImages(event: Event): void {
    event.stopPropagation();
    this.previewUrls.set([]);
    this.selectedImageIndex.set(0);
  }

  setPrimaryImage(index: number, event: Event): void {
    event.stopPropagation();
    this.selectedImageIndex.set(index);
  }

  async save(): Promise<void> {
    if (!this.name.trim() || !this.color.trim() || !this.colorHex.trim()) {
      this.errorMessage.set('Please fill all required fields.');
      return;
    }
    const normalizedHex = this.colorHex.trim().startsWith('#')
      ? this.colorHex.trim()
      : `#${this.colorHex.trim()}`;
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      const imageUrls = this.previewUrls().length
        ? this.getOrderedImageUrls()
        : ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=400&fit=crop'];
      await this.wardrobeService.addAccessory({
        name: this.name.trim(),
        category: this.category,
        color: this.color.trim(),
        colorHex: normalizedHex,
        brand: this.brand.trim() || undefined,
        price: this.price ? Number(this.price) : undefined,
        occasion: this.occasion || undefined,
        purchaseDate: this.purchaseDate ? new Date(this.purchaseDate) : undefined,
        imageUrl: imageUrls[0],
        imageUrls,
        primaryImageUrl: imageUrls[0],
        favorite: false,
        tags: this.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });

      await this.router.navigate(['/accessories']);
    } catch (error) {
      this.errorMessage.set(this.extractErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const fieldError = error.error?.fieldErrors?.[0];
      if (fieldError?.field && fieldError?.message) {
        return `${fieldError.field}: ${fieldError.message}`;
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'Unable to save accessory. Please review your inputs and try again.';
  }

  private getOrderedImageUrls(): string[] {
    const images = this.previewUrls();
    if (images.length <= 1) {
      return images;
    }
    const primaryIndex = this.selectedImageIndex();
    const normalizedPrimaryIndex = ((primaryIndex % images.length) + images.length) % images.length;
    const primaryImage = images[normalizedPrimaryIndex];
    return [primaryImage, ...images.filter((_, index) => index !== normalizedPrimaryIndex)];
  }
}
