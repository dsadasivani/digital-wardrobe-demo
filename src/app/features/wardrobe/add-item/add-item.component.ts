import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  CatalogOptionsService,
  ImageCropperService,
  MediaUploadService,
  WardrobeService,
} from '../../../core/services';
import { WardrobeCategory } from '../../../core/models';
import { FormSaveLoaderComponent } from '../../../shared/components/form-save-loader/form-save-loader.component';
import {
  ColorOption,
  createColorOption,
  extractDominantColors,
  normalizeHex,
  resolveColorName,
} from '../../../shared/utils/color-extractor';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-add-item',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormSaveLoaderComponent,
  ],
  template: `
    <div class="add-item-page animate-fade-in">
      <header class="page-header">
        <h1>Add New Item</h1>
        <p class="subtitle">Add a new piece to your wardrobe</p>
      </header>

      <div class="upload-section glass">
        <div
          class="drop-zone"
          [class.has-image]="previewUrls().length > 0"
          (click)="fileInput.click()"
        >
          @if (previewUrls().length > 0) {
            <img [src]="primaryPreviewUrl()" alt="Preview" class="preview-image" />
            <div class="image-meta">
              {{ previewUrls().length }} image{{ previewUrls().length > 1 ? 's' : '' }}
            </div>
            <button class="remove-btn" type="button" (click)="clearImages($event)">
              <mat-icon>close</mat-icon>
            </button>
          } @else {
            <mat-icon>add_photo_alternate</mat-icon>
            <p>Click or drag to upload image</p>
            <span>PNG, JPG up to 10MB (crop each image)</span>
          }
        </div>
        <input
          #fileInput
          type="file"
          accept="image/*"
          multiple
          hidden
          (change)="onFileSelected($event)"
        />
        @if (previewUrls().length > 0) {
          <div class="preview-grid">
            @for (url of previewUrls(); track i; let i = $index) {
              <div class="preview-thumb" [class.active]="i === selectedImageIndex()">
                <img [src]="url" [alt]="'Image ' + (i + 1)" (click)="setPrimaryImage(i, $event)" />
                @if (i === selectedImageIndex()) {
                  <span class="primary-chip">Primary</span>
                } @else {
                  <button type="button" class="primary-btn" (click)="setPrimaryImage(i, $event)">
                    Set primary
                  </button>
                }
                <button type="button" class="thumb-remove" (click)="removeImage(i, $event)">
                  <mat-icon>close</mat-icon>
                </button>
              </div>
            }
          </div>
        }
      </div>

      <form class="item-form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Item Name</mat-label>
          <input
            matInput
            [(ngModel)]="itemName"
            name="name"
            required
            placeholder="e.g., Blue Oxford Shirt"
          />
        </mat-form-field>

        <div class="form-row">
          <div class="field-stack">
            <div class="select-plus-row">
              <mat-form-field appearance="outline" class="select-field">
                <mat-label>Category</mat-label>
                <mat-select [(ngModel)]="category" name="category" required>
                  @for (cat of categories(); track cat.id) {
                    <mat-option [value]="cat.id">{{ cat.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <button
                type="button"
                class="field-plus-btn"
                [class.active]="isAddingCategory()"
                [attr.aria-expanded]="isAddingCategory()"
                [attr.aria-label]="isAddingCategory() ? 'Close category creator' : 'Add category'"
                (click)="toggleCategoryCreator()"
              >
                <mat-icon>{{ isAddingCategory() ? 'close' : 'add' }}</mat-icon>
              </button>
            </div>
            @if (isAddingCategory()) {
              <div class="inline-create-panel">
                <p class="inline-hint">Create your own category label</p>
                <div class="inline-create-row">
                  <input
                    type="text"
                    [ngModel]="newCategoryLabel()"
                    (ngModelChange)="newCategoryLabel.set($event)"
                    name="newWardrobeCategory"
                    placeholder="e.g., Ethnic Wear"
                  />
                  <button
                    type="button"
                    class="inline-create-btn"
                    (click)="createCategory()"
                    [disabled]="isCreatingCategory()"
                  >
                    <mat-icon>{{ isCreatingCategory() ? 'hourglass_top' : 'check' }}</mat-icon>
                    <span>{{ isCreatingCategory() ? 'Adding...' : 'Save' }}</span>
                  </button>
                </div>
              </div>
            }
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Color</mat-label>
            <mat-icon matPrefix>palette</mat-icon>
            <input matInput [value]="color" readonly />
            <span
              matSuffix
              class="color-option-swatch input-swatch"
              [style.background-color]="selectedColorHex()"
            ></span>
          </mat-form-field>
        </div>

        <section class="color-intelligence glass">
          <div class="color-intelligence-header">
            <h3>Color Suggestions</h3>
            @if (isAnalyzingColors()) {
              <span class="analyzing-label">Analyzing image...</span>
            }
          </div>

          @if (detectedColorOptions().length > 0) {
            <div class="suggested-colors">
              @for (option of detectedColorOptions(); track option.hex) {
                <button
                  type="button"
                  class="suggested-color-btn"
                  [class.active]="selectedColorHex() === option.hex"
                  (click)="applyColorOption(option)"
                >
                  <small class="dominant-rank">Dominant {{ $index + 1 }}</small>
                  <span class="color-option-swatch" [style.background-color]="option.hex"></span>
                  <span>{{ option.name }}</span>
                  <small>{{ option.hex }}</small>
                </button>
              }
            </div>
          } @else {
            <p class="color-tip">Upload a photo to auto-detect dominant colors.</p>
          }

          <div class="custom-color-row">
            <label for="item-custom-color">Custom Color</label>
            <input
              id="item-custom-color"
              type="color"
              [value]="customColorHex()"
              (input)="onCustomColorInput($event)"
            />
            <button type="button" class="custom-color-apply" (click)="applyCustomColor()">
              Use Custom
            </button>
            <span class="selected-color-preview">
              <span
                class="color-option-swatch"
                [style.background-color]="selectedColorHex()"
              ></span>
              {{ color }}
            </span>
          </div>
        </section>

        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Brand (optional)</mat-label>
            <input matInput [(ngModel)]="brand" name="brand" placeholder="e.g., Ralph Lauren" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Size (optional)</mat-label>
            <input matInput [(ngModel)]="size" name="size" placeholder="e.g., M, 32, 10" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Purchased Date (optional)</mat-label>
          <input matInput type="date" [(ngModel)]="purchaseDate" name="purchaseDate" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Price (optional)</mat-label>
          <input
            matInput
            type="number"
            min="0"
            step="0.01"
            [(ngModel)]="price"
            name="price"
            placeholder="e.g., 49.99"
          />
        </mat-form-field>

        <div class="field-stack">
          <div class="select-plus-row">
            <mat-form-field appearance="outline" class="select-field">
              <mat-label>Occasion (optional)</mat-label>
              <mat-select [(ngModel)]="occasion" name="occasion">
                <mat-option [value]="''">None</mat-option>
                @for (option of occasionOptions(); track option) {
                  <mat-option [value]="option">{{ option | titlecase }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            <button
              type="button"
              class="field-plus-btn"
              [class.active]="isAddingOccasion()"
              [attr.aria-expanded]="isAddingOccasion()"
              [attr.aria-label]="isAddingOccasion() ? 'Close occasion creator' : 'Add occasion'"
              (click)="toggleOccasionCreator()"
            >
              <mat-icon>{{ isAddingOccasion() ? 'close' : 'add' }}</mat-icon>
            </button>
          </div>
          @if (isAddingOccasion()) {
            <div class="inline-create-panel">
              <p class="inline-hint">Create your own occasion label</p>
              <div class="inline-create-row">
                <input
                  type="text"
                  [ngModel]="newOccasionValue()"
                  (ngModelChange)="newOccasionValue.set($event)"
                  name="newWardrobeOccasion"
                  placeholder="e.g., brunch"
                />
                <button
                  type="button"
                  class="inline-create-btn"
                  (click)="createOccasion()"
                  [disabled]="isCreatingOccasion()"
                >
                  <mat-icon>{{ isCreatingOccasion() ? 'hourglass_top' : 'check' }}</mat-icon>
                  <span>{{ isCreatingOccasion() ? 'Adding...' : 'Save' }}</span>
                </button>
              </div>
            </div>
          }
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Tags (comma separated)</mat-label>
          <input matInput [(ngModel)]="tags" name="tags" placeholder="e.g., casual, work, summer" />
        </mat-form-field>

        @if (errorMessage()) {
          <p class="form-error">{{ errorMessage() }}</p>
        }
        @if (isSaving()) {
          <div class="save-loader-row">
            <dw-form-save-loader
              title="Creating item..."
              message="Adding this piece to your wardrobe."
              variant="create"
              icon="checkroom"
            ></dw-form-save-loader>
          </div>
        }

        <div class="form-actions">
          <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
          <button
            mat-raised-button
            color="primary"
            class="submit-btn"
            type="submit"
            [disabled]="isSaving()"
          >
            Add to Wardrobe
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .add-item-page {
        padding: var(--dw-spacing-xl);
        max-width: 800px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: var(--dw-spacing-xl);
      }
      .subtitle {
        color: var(--dw-text-secondary);
        margin: 0;
      }
      .upload-section {
        padding: var(--dw-spacing-lg);
        border-radius: var(--dw-radius-xl);
        margin-bottom: var(--dw-spacing-xl);
      }
      .drop-zone {
        position: relative;
        aspect-ratio: 4/3;
        max-height: 300px;
        border: 2px dashed var(--dw-surface-card);
        border-radius: var(--dw-radius-lg);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
      }
      .drop-zone:hover {
        border-color: var(--dw-primary);
        background: color-mix(in srgb, var(--dw-primary) 10%, transparent);
      }
      .drop-zone mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--dw-text-muted);
        margin-bottom: 16px;
      }
      .drop-zone p {
        color: var(--dw-text-primary);
        margin: 0 0 8px;
      }
      .drop-zone span {
        font-size: 12px;
        color: var(--dw-text-muted);
      }
      .drop-zone.has-image {
        border-style: solid;
        border-color: var(--dw-primary);
      }
      .preview-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: var(--dw-radius-md);
      }
      .image-meta {
        position: absolute;
        left: 10px;
        bottom: 10px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        background: color-mix(in srgb, var(--dw-overlay-scrim) 90%, transparent);
        color: var(--dw-on-primary);
      }
      .remove-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--dw-overlay-scrim) 92%, transparent);
        border: none;
        color: var(--dw-on-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .preview-grid {
        margin-top: 10px;
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
        gap: 8px;
      }
      .preview-thumb {
        position: relative;
        border: 1px solid var(--dw-border-subtle);
        border-radius: 10px;
        overflow: hidden;
        aspect-ratio: 1;
        background: var(--dw-surface-card);
      }
      .preview-thumb.active {
        border-color: var(--dw-primary);
        box-shadow: var(--dw-shadow-sm);
      }
      .preview-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .primary-chip {
        position: absolute;
        left: 4px;
        top: 4px;
        padding: 2px 7px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--dw-primary) 84%, black 16%);
        color: var(--dw-on-primary);
        font-size: 10px;
        font-weight: 600;
      }
      .primary-btn {
        position: absolute;
        left: 4px;
        bottom: 4px;
        border: none;
        border-radius: 999px;
        padding: 2px 8px;
        font-size: 10px;
        font-weight: 600;
        background: color-mix(in srgb, var(--dw-overlay-scrim) 85%, transparent);
        color: var(--dw-on-primary);
      }
      .thumb-remove {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 22px;
        height: 22px;
        border: none;
        border-radius: 50%;
        background: color-mix(in srgb, var(--dw-overlay-scrim) 90%, transparent);
        color: var(--dw-on-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .thumb-remove mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
      .item-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-row {
        display: flex;
        gap: 16px;
      }
      .form-row mat-form-field {
        flex: 1;
      }
      .field-stack {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .select-plus-row {
        display: flex;
        gap: 8px;
        align-items: flex-start;
      }
      .select-field {
        flex: 1;
      }
      .field-plus-btn {
        width: 40px;
        height: 40px;
        border: 1px solid var(--dw-border-subtle);
        border-radius: 10px;
        background: var(--dw-surface-elevated);
        color: var(--dw-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        margin-top: 8px;
        transition: all var(--dw-transition-fast);
        flex-shrink: 0;
      }
      .field-plus-btn mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }
      .field-plus-btn:hover {
        border-color: color-mix(in srgb, var(--dw-primary) 48%, transparent);
        background: color-mix(in srgb, var(--dw-primary) 12%, var(--dw-surface-elevated) 88%);
      }
      .field-plus-btn.active {
        color: var(--dw-on-primary);
        border-color: color-mix(in srgb, var(--dw-primary) 62%, transparent);
        background: color-mix(in srgb, var(--dw-primary) 70%, black 30%);
      }
      .inline-create-panel {
        display: grid;
        gap: 8px;
        padding: 8px 10px;
        border: 1px solid color-mix(in srgb, var(--dw-primary) 20%, var(--dw-border-subtle));
        border-radius: var(--dw-radius-sm);
        background: color-mix(in srgb, var(--dw-surface-card) 80%, transparent);
      }
      .inline-hint {
        margin: 0;
        font-size: 11px;
        color: var(--dw-text-secondary);
        line-height: 1.4;
      }
      .inline-create-row {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .inline-create-row input {
        flex: 1;
        min-width: 0;
        border: 1px solid var(--dw-border-subtle);
        border-radius: var(--dw-radius-md);
        background: var(--dw-surface-elevated);
        color: var(--dw-text-primary);
        padding: 8px 10px;
        font-size: 13px;
      }
      .inline-create-btn {
        border: 1px solid color-mix(in srgb, var(--dw-primary) 42%, transparent);
        border-radius: var(--dw-radius-md);
        background: color-mix(in srgb, var(--dw-primary) 14%, var(--dw-surface-elevated) 86%);
        color: var(--dw-primary);
        font-size: 12px;
        font-weight: 600;
        padding: 8px 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        white-space: nowrap;
      }
      .inline-create-btn mat-icon {
        width: 14px;
        height: 14px;
        font-size: 14px;
      }
      .color-option-swatch {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--dw-text-primary) 28%, transparent);
        flex-shrink: 0;
      }
      .input-swatch {
        margin-right: 6px;
      }
      .color-intelligence {
        border-radius: var(--dw-radius-lg);
        padding: 12px;
        display: grid;
        gap: 10px;
        border: 1px solid var(--dw-border-subtle);
        background: color-mix(in srgb, var(--dw-surface-card) 76%, var(--dw-surface-elevated) 24%);
      }
      .color-intelligence-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .color-intelligence-header h3 {
        margin: 0;
        font-size: 0.9rem;
      }
      .analyzing-label {
        font-size: 12px;
        color: var(--dw-text-secondary);
      }
      .suggested-colors {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }
      .suggested-color-btn {
        border: 1px solid var(--dw-border-subtle);
        border-radius: var(--dw-radius-md);
        background: var(--dw-surface-elevated);
        color: var(--dw-text-primary);
        padding: 8px;
        display: grid;
        gap: 4px;
        justify-items: start;
        cursor: pointer;
        text-align: left;
        transition: all var(--dw-transition-fast);
      }
      .suggested-color-btn .dominant-rank {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--dw-text-muted);
      }
      .suggested-color-btn small {
        color: var(--dw-text-secondary);
        font-size: 11px;
      }
      .suggested-color-btn.active {
        border-color: color-mix(in srgb, var(--dw-primary) 52%, transparent);
        box-shadow: var(--dw-shadow-sm);
        background: color-mix(in srgb, var(--dw-surface-elevated) 82%, var(--dw-primary) 18%);
      }
      .color-tip {
        margin: 0;
        font-size: 12px;
        color: var(--dw-text-secondary);
      }
      .custom-color-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .custom-color-row label {
        font-size: 12px;
        color: var(--dw-text-secondary);
        min-width: 86px;
      }
      .custom-color-row input[type='color'] {
        width: 40px;
        height: 30px;
        border: none;
        padding: 0;
        border-radius: var(--dw-radius-sm);
        background: transparent;
      }
      .custom-color-apply {
        border: 1px solid var(--dw-border-subtle);
        border-radius: var(--dw-radius-full);
        background: var(--dw-surface-elevated);
        color: var(--dw-text-primary);
        padding: 6px 10px;
        font-size: 12px;
        cursor: pointer;
      }
      .selected-color-preview {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--dw-text-secondary);
        margin-left: auto;
      }
      .form-error {
        margin: 0;
        color: var(--dw-error);
        font-size: 13px;
      }
      .save-loader-row {
        margin-top: 4px;
      }
      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 16px;
      }
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
      .submit-btn:hover {
        background: color-mix(in srgb, var(--dw-primary) 10%, transparent) !important;
      }
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

        .inline-create-row {
          flex-direction: column;
          align-items: stretch;
        }

        .inline-create-btn {
          width: 100%;
          justify-content: center;
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
    `,
  ],
})
export class AddItemComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private imageCropper = inject(ImageCropperService);
  private mediaUpload = inject(MediaUploadService);
  private router = inject(Router);
  private catalogOptionsService = inject(CatalogOptionsService);

  categories = this.catalogOptionsService.wardrobeCategories;
  occasionOptions = this.catalogOptionsService.occasionOptions;
  itemName = '';
  category = '';
  color = 'Black';
  colorHex = '#1A1A1A';
  brand = '';
  size = '';
  purchaseDate = '';
  price = '';
  occasion = '';
  tags = '';
  previewUrls = signal<string[]>([]);
  imagePaths = signal<string[]>([]);
  selectedImageIndex = signal(0);
  primaryPreviewUrl = computed(
    () => this.previewUrls()[this.selectedImageIndex()] ?? this.previewUrls()[0] ?? '',
  );
  selectedColorHex = signal('#1A1A1A');
  customColorHex = signal('#7D624A');
  detectedColorOptions = signal<ColorOption[]>([]);
  isAnalyzingColors = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  isAddingCategory = signal(false);
  isCreatingCategory = signal(false);
  newCategoryLabel = signal('');
  isAddingOccasion = signal(false);
  isCreatingOccasion = signal(false);
  newOccasionValue = signal('');
  private colorAnalysisRequestId = 0;

  ngOnInit(): void {
    void this.loadOptions();
  }

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
        this.previewUrls.update((existing) => [...existing, ...croppedUrls]);
        this.imagePaths.update((existing) => [...existing, ...croppedUrls.map(() => '')]);
        await this.refreshDominantColorSuggestions(this.primaryPreviewUrl());
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to open image cropper.';
      this.errorMessage.set(message);
    }
  }

  removeImage(index: number, event: Event) {
    event.stopPropagation();
    this.previewUrls.update((images) => images.filter((_, i) => i !== index));
    this.imagePaths.update((paths) => paths.filter((_, i) => i !== index));
    this.selectedImageIndex.update((current) => {
      if (current === index) {
        return 0;
      }
      if (current > index) {
        return current - 1;
      }
      return current;
    });
    void this.refreshDominantColorSuggestions(this.primaryPreviewUrl());
  }

  clearImages(event: Event): void {
    event.stopPropagation();
    this.previewUrls.set([]);
    this.imagePaths.set([]);
    this.selectedImageIndex.set(0);
    this.detectedColorOptions.set([]);
    this.isAnalyzingColors.set(false);
  }

  setPrimaryImage(index: number, event: Event): void {
    event.stopPropagation();
    this.selectedImageIndex.set(index);
    void this.refreshDominantColorSuggestions(this.previewUrls()[index] ?? '');
  }

  onCustomColorInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.customColorHex.set(normalizeHex(target.value));
  }

  applyCustomColor(): void {
    const option = createColorOption(this.customColorHex(), 'custom');
    this.applyColorOption(option);
  }

  applyColorOption(option: ColorOption): void {
    this.selectedColorHex.set(option.hex);
    this.colorHex = option.hex;
    this.color = option.name;
  }

  toggleCategoryCreator(): void {
    this.isAddingCategory.update((current) => !current);
    if (!this.isAddingCategory()) {
      this.newCategoryLabel.set('');
    }
  }

  toggleOccasionCreator(): void {
    this.isAddingOccasion.update((current) => !current);
    if (!this.isAddingOccasion()) {
      this.newOccasionValue.set('');
    }
  }

  async createCategory(): Promise<void> {
    const label = this.newCategoryLabel().trim();
    if (!label || this.isCreatingCategory()) {
      return;
    }
    this.isCreatingCategory.set(true);
    this.errorMessage.set(null);
    try {
      const created = await this.catalogOptionsService.addWardrobeCategory(label);
      this.category = created.id;
      this.newCategoryLabel.set('');
      this.isAddingCategory.set(false);
    } catch (error) {
      this.errorMessage.set(this.extractErrorMessage(error));
    } finally {
      this.isCreatingCategory.set(false);
    }
  }

  async createOccasion(): Promise<void> {
    const value = this.newOccasionValue().trim();
    if (!value || this.isCreatingOccasion()) {
      return;
    }
    this.isCreatingOccasion.set(true);
    this.errorMessage.set(null);
    try {
      const created = await this.catalogOptionsService.addOccasion(value);
      this.occasion = created;
      this.newOccasionValue.set('');
      this.isAddingOccasion.set(false);
    } catch (error) {
      this.errorMessage.set(this.extractErrorMessage(error));
    } finally {
      this.isCreatingOccasion.set(false);
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.itemName || !this.category || !this.color || !this.colorHex) {
      this.errorMessage.set('Please fill all required fields.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    try {
      if (this.previewUrls().length) {
        await this.uploadPendingImages();
      }
      const orderedImages = this.previewUrls().length
        ? this.getOrderedImages()
        : {
            imageUrls: [
              'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=500&fit=crop',
            ],
            imagePaths: [] as string[],
          };
      const hasCompletePaths =
        orderedImages.imagePaths.length === orderedImages.imageUrls.length &&
        orderedImages.imagePaths.every((path) => !!path);
      await this.wardrobeService.addItem({
        name: this.itemName,
        category: this.category as WardrobeCategory,
        color: this.color,
        colorHex: this.colorHex,
        brand: this.brand || undefined,
        size: this.size || undefined,
        purchaseDate: this.purchaseDate ? new Date(this.purchaseDate) : undefined,
        price: this.price ? Number(this.price) : undefined,
        occasion: this.occasion || undefined,
        imageUrl: orderedImages.imageUrls[0],
        imageUrls: orderedImages.imageUrls,
        primaryImageUrl: orderedImages.imageUrls[0],
        imagePaths: hasCompletePaths ? orderedImages.imagePaths : undefined,
        primaryImagePath: hasCompletePaths ? orderedImages.imagePaths[0] : undefined,
        favorite: false,
        tags: this.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
      });
      await this.router.navigate(['/wardrobe']);
    } catch (error) {
      this.errorMessage.set(this.extractErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/wardrobe']);
  }

  private async loadOptions(): Promise<void> {
    try {
      await this.catalogOptionsService.ensureWardrobeOptionsLoaded();
      if (!this.category) {
        const firstCategory = this.categories()[0];
        if (firstCategory) {
          this.category = firstCategory.id;
        }
      }
    } catch {
      if (!this.category) {
        const firstCategory = this.categories()[0];
        if (firstCategory) {
          this.category = firstCategory.id;
        }
      }
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
    return 'Unable to save item. Please review your inputs and try again.';
  }

  private getOrderedImages(): { imageUrls: string[]; imagePaths: string[] } {
    const images = this.previewUrls();
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

  private normalizeImagePaths(expectedLength: number): string[] {
    const paths = this.imagePaths();
    return Array.from({ length: expectedLength }, (_, index) => paths[index] ?? '');
  }

  private async uploadPendingImages(): Promise<void> {
    const currentUrls = this.previewUrls();
    const currentPaths = this.normalizeImagePaths(currentUrls.length);
    const pending = currentUrls
      .map((url, index) => ({ url, index }))
      .filter((entry) => this.mediaUpload.isDataUrl(entry.url) && !currentPaths[entry.index]);

    if (!pending.length) {
      return;
    }

    const uploadedImages = await this.mediaUpload.uploadDataUrls(
      pending.map((entry) => entry.url),
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

    this.previewUrls.set(nextUrls);
    this.imagePaths.set(nextPaths);
  }

  private async refreshDominantColorSuggestions(imageUrl: string): Promise<void> {
    if (!imageUrl) {
      this.detectedColorOptions.set([]);
      return;
    }

    const requestId = ++this.colorAnalysisRequestId;
    this.isAnalyzingColors.set(true);
    try {
      const dominantHexes = await extractDominantColors(imageUrl, 3);
      if (requestId !== this.colorAnalysisRequestId) {
        return;
      }

      const detectedOptions = dominantHexes.map((hex) =>
        createColorOption(hex, 'detected', resolveColorName(hex)),
      );
      this.detectedColorOptions.set(detectedOptions);

      if (detectedOptions.length > 0) {
        this.applyColorOption(detectedOptions[0]);
        this.customColorHex.set(detectedOptions[0].hex);
      }
    } catch {
      if (requestId !== this.colorAnalysisRequestId) {
        return;
      }
      this.detectedColorOptions.set([]);
    } finally {
      if (requestId === this.colorAnalysisRequestId) {
        this.isAnalyzingColors.set(false);
      }
    }
  }
}
