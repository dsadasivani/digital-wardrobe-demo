import { CommonModule, Location } from '@angular/common';
import {Component, computed, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OCCASION_OPTIONS, WARDROBE_CATEGORIES, WardrobeCategory, WardrobeItem } from '../../../core/models';
import { ImageCropperService, MediaUploadService } from '../../../core/services';
import { WardrobeService } from '../../../core/services/wardrobe.service';
import { ImageReadyDirective } from '../../../shared/directives/image-ready.directive';

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
    ImageReadyDirective,
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
          <div class="image-editor">
            <div class="image-preview">
              <img [src]="primaryImage()" [dwImageReady]="primaryImage()" alt="Item image preview">
            </div>
            <div class="image-actions">
              <button mat-stroked-button type="button" (click)="imageInput.click()">
                <mat-icon>photo_camera</mat-icon>
                Add Images
              </button>
              <input #imageInput type="file" hidden multiple accept="image/*" (change)="onImageSelected($event)">
              <span class="image-hint">Select one or more images and crop each</span>
            </div>
            @if (imageUrls().length > 0) {
              <div class="preview-grid">
                @for (url of imageUrls(); track i; let i = $index) {
                  <div class="preview-thumb" [class.active]="i === selectedImageIndex()">
                    <img [src]="url" [dwImageReady]="url" [alt]="'Image ' + (i + 1)" (click)="setPrimaryImage(i, $event)">
                    @if (i === selectedImageIndex()) {
                      <span class="primary-chip" aria-label="Primary image">
                        <mat-icon>workspace_premium</mat-icon>
                        Primary
                      </span>
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

          <mat-form-field appearance="outline">
            <mat-label>Occasion</mat-label>
            <mat-select [(ngModel)]="occasion" name="occasion">
              <mat-option [value]="''">None</mat-option>
              @for (option of occasionOptions; track option) {
                <mat-option [value]="option">{{ option | titlecase }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

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
            <mat-label>Tags (comma separated)</mat-label>
            <input matInput [(ngModel)]="tags" name="tags">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Notes</mat-label>
            <textarea matInput rows="3" [(ngModel)]="notes" name="notes"></textarea>
          </mat-form-field>

          @if (errorMessage()) {
            <p class="form-error">{{ errorMessage() }}</p>
          }

          <div class="actions">
            <button mat-stroked-button type="button" (click)="goBack()">Cancel</button>
            <button mat-flat-button color="primary" type="submit" class="save-btn" [disabled]="isSaving()">Save Changes</button>
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
    .image-editor { display: grid; gap: 10px; justify-content: flex-start; }
    .image-preview { width: 180px; height: 220px; border-radius: var(--dw-radius-md); overflow: hidden; border: 1px solid var(--dw-surface-card); }
    .image-preview img { width: 100%; height: 100%; object-fit: cover; }
    .image-actions { display: grid; gap: 6px; justify-items: flex-start; }
    .image-hint { color: var(--dw-text-muted); font-size: 12px; }
    .preview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); gap: 8px; max-width: 360px; }
    .preview-thumb { position: relative; border: 1px solid var(--dw-border-subtle); border-radius: 8px; overflow: hidden; aspect-ratio: 1; cursor: pointer; }
    .preview-thumb.active { border-color: var(--dw-primary); box-shadow: var(--dw-shadow-sm); }
    .preview-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .primary-chip { position: absolute; left: 4px; top: 4px; display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 999px; background: color-mix(in srgb, var(--dw-primary) 84%, black 16%); color: var(--dw-on-primary); font-size: 10px; font-weight: 600; }
    .primary-chip mat-icon { width: 11px; height: 11px; font-size: 11px; }
    .primary-btn { position: absolute; left: 4px; bottom: 4px; border: none; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 600; background: color-mix(in srgb, var(--dw-overlay-scrim) 85%, transparent); color: var(--dw-on-primary); }
    .thumb-remove { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border: none; border-radius: 50%; background: color-mix(in srgb, var(--dw-overlay-scrim) 92%, transparent); color: var(--dw-on-primary); display: inline-flex; align-items: center; justify-content: center; }
    .thumb-remove mat-icon { width: 13px; height: 13px; font-size: 13px; }
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
      min-width: 140px;
      font-weight: 600;
    }
    .save-btn:hover {
      background: color-mix(in srgb, var(--dw-primary) 10%, transparent) !important;
    }
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; }
    .not-found mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--dw-text-muted); }
    @media (max-width: 768px) {
      .edit-item-page { padding: 12px; }
      .page-header { align-items: flex-start; gap: 10px; margin-bottom: 12px; }
      .page-header h1 { font-size: 1.25rem; line-height: 1.25; }
      .page-header p { font-size: 13px; margin-top: 2px; }
      .edit-form { border-radius: var(--dw-radius-lg); padding: 12px; gap: 10px; }
      .image-editor { width: 100%; }
      .image-preview { width: 100%; height: auto; aspect-ratio: 4 / 3; border-radius: var(--dw-radius-lg); }
      .image-actions { width: 100%; }
      .image-actions button { width: 100%; justify-content: center; min-height: 40px; }
      .preview-grid { max-width: none; }
      .row { grid-template-columns: 1fr; gap: 10px; }
      .actions { margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .actions button { width: 100%; min-height: 40px; }
      .save-btn { min-width: 0; }
    }
  `]
})
export class EditItemComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private imageCropper = inject(ImageCropperService);
  private mediaUpload = inject(MediaUploadService);
  private wardrobeService = inject(WardrobeService);

  categories = WARDROBE_CATEGORIES;
  occasionOptions = OCCASION_OPTIONS;
  itemId = signal<string | null>(null);

  name = '';
  category: WardrobeCategory = 'tops';
  color = '';
  brand = '';
  size = '';
  occasion = '';
  price = '';
  purchaseDate = '';
  imageUrls = signal<string[]>([]);
  imagePaths = signal<string[]>([]);
  selectedImageIndex = signal(0);
  primaryImage = computed(() => this.imageUrls()[this.selectedImageIndex()] ?? this.imageUrls()[0] ?? '');
  tags = '';
  notes = '';
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.itemId.set(id);
      void this.loadItemForEdit(id);
    });
  }

  goBack(): void {
    this.location.back();
  }

  async onImageSelected(event: Event): Promise<void> {
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
          title: 'Crop Item Image',
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
        this.imageUrls.update(existing => [...existing, ...croppedUrls]);
        this.imagePaths.update(existing => [...existing, ...croppedUrls.map(() => '')]);
        this.selectedImageIndex.set(0);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open image cropper.';
      this.errorMessage.set(message);
    }
  }

  removeImage(index: number, event: Event): void {
    event.stopPropagation();
    this.imageUrls.update(images => images.filter((_, i) => i !== index));
    this.imagePaths.update(paths => paths.filter((_, i) => i !== index));
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

  setPrimaryImage(index: number, event: Event): void {
    event.stopPropagation();
    this.selectedImageIndex.set(index);
  }

  async save(): Promise<void> {
    const id = this.itemId();
    if (!id || !this.name || !this.category || !this.color) {
      this.errorMessage.set('Please fill all required fields.');
      return;
    }
    if (!this.imageUrls().length) {
      this.errorMessage.set('Please add at least one image.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      await this.uploadPendingImages();
      const orderedImages = this.getOrderedImages();
      const hasCompletePaths =
        orderedImages.imagePaths.length === orderedImages.imageUrls.length &&
        orderedImages.imagePaths.every(path => !!path);
      await this.wardrobeService.updateItem(id, {
        name: this.name.trim(),
        category: this.category,
        color: this.color.trim(),
        brand: this.brand.trim() || undefined,
        size: this.size.trim() || undefined,
        occasion: this.occasion || undefined,
        price: this.price ? Number(this.price) : undefined,
        purchaseDate: this.purchaseDate ? new Date(this.purchaseDate) : undefined,
        imageUrl: orderedImages.imageUrls[0]?.trim(),
        imageUrls: orderedImages.imageUrls,
        primaryImageUrl: orderedImages.imageUrls[0]?.trim(),
        imagePaths: hasCompletePaths ? orderedImages.imagePaths : undefined,
        primaryImagePath: hasCompletePaths ? orderedImages.imagePaths[0] : undefined,
        tags: this.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        notes: this.notes.trim() || undefined,
      });

      await this.router.navigate(['/wardrobe', id]);
    } catch (error) {
      this.errorMessage.set(this.extractErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  private patchForm(item: WardrobeItem): void {
    this.name = item.name;
    this.category = item.category;
    this.color = item.color;
    this.brand = item.brand ?? '';
    this.size = item.size ?? '';
    this.occasion = item.occasion ?? '';
    this.price = item.price?.toString() ?? '';
    this.purchaseDate = item.purchaseDate ? this.toDateInput(item.purchaseDate) : '';
    const urls = item.imageUrls?.length ? item.imageUrls : [item.imageUrl];
    this.imageUrls.set(urls);
    this.imagePaths.set(this.alignImagePaths(item.imagePaths, urls.length));
    this.selectedImageIndex.set(0);
    this.tags = item.tags.join(', ');
    this.notes = item.notes ?? '';
  }

  private toDateInput(date: Date): string {
    const actual = date instanceof Date ? date : new Date(date);
    return actual.toISOString().split('T')[0];
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
    return 'Unable to save changes. Please review your inputs and try again.';
  }

  private getOrderedImages(): { imageUrls: string[]; imagePaths: string[] } {
    const images = this.imageUrls();
    const paths = this.normalizeImagePaths(images.length);
    if (images.length <= 1) {
      return { imageUrls: images, imagePaths: paths };
    }
    const primaryIndex = this.selectedImageIndex();
    const normalizedPrimaryIndex = ((primaryIndex % images.length) + images.length) % images.length;
    const primaryImage = images[normalizedPrimaryIndex];
    const primaryPath = paths[normalizedPrimaryIndex] ?? '';
    return {
      imageUrls: [primaryImage, ...images.filter((_, index) => index !== normalizedPrimaryIndex)],
      imagePaths: [primaryPath, ...paths.filter((_, index) => index !== normalizedPrimaryIndex)],
    };
  }

  private alignImagePaths(imagePaths: string[] | undefined, expectedLength: number): string[] {
    const paths = imagePaths ?? [];
    return Array.from({ length: expectedLength }, (_, index) => paths[index] ?? '');
  }

  private normalizeImagePaths(expectedLength: number): string[] {
    return this.alignImagePaths(this.imagePaths(), expectedLength);
  }

  private async uploadPendingImages(): Promise<void> {
    const currentUrls = this.imageUrls();
    const currentPaths = this.normalizeImagePaths(currentUrls.length);
    const pending = currentUrls
      .map((url, index) => ({ url, index }))
      .filter(entry => this.mediaUpload.isDataUrl(entry.url) && !currentPaths[entry.index]);

    if (!pending.length) {
      return;
    }

    const uploadedImages = await this.mediaUpload.uploadDataUrls(
      pending.map(entry => entry.url),
      'wardrobe-item',
    );

    if (uploadedImages.length !== pending.length) {
      throw new Error('Image upload was incomplete.');
    }

    const nextUrls = [...currentUrls];
    const nextPaths = [...currentPaths];
    pending.forEach((entry, index) => {
      nextUrls[entry.index] = uploadedImages[index].url;
      nextPaths[entry.index] = uploadedImages[index].path;
    });

    this.imageUrls.set(nextUrls);
    this.imagePaths.set(nextPaths);
  }

  private async loadItemForEdit(id: string | null): Promise<void> {
    if (!id) {
      return;
    }
    try {
      const item = await this.wardrobeService.fetchWardrobeItemById(id);
      if (item) {
        this.patchForm(item);
      }
    } catch {
      this.errorMessage.set('Unable to load item details right now.');
    }
  }
}
