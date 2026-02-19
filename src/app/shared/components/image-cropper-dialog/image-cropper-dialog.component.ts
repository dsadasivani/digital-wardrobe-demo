import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ImageCropOptions {
  title?: string;
  aspectRatio?: number;
  outputType?: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  maxOutputWidth?: number;
  maxOutputHeight?: number;
}

export interface ImageCropDialogData {
  file: File;
  options?: ImageCropOptions;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

type PointerMode = 'draw' | 'move';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-image-cropper-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>{{ title() }}</h2>

    <mat-dialog-content class="cropper-content">
      @if (errorMessage()) {
        <p class="crop-error">{{ errorMessage() }}</p>
      } @else if (isLoading()) {
        <div class="crop-loading">
          <mat-icon>hourglass_top</mat-icon>
          <span>Preparing image...</span>
        </div>
      } @else {
        <div
          #cropSurface
          class="crop-surface"
          [style.width.px]="canvasWidth()"
          [style.height.px]="canvasHeight()"
          (pointerdown)="onPointerDown($event)"
          (pointermove)="onPointerMove($event)"
          (pointerup)="onPointerUp($event)"
          (pointercancel)="onPointerUp($event)"
        >
          <canvas #previewCanvas [width]="canvasWidth()" [height]="canvasHeight()"></canvas>
          @if (selection()) {
            <div
              class="selection"
              [style.left.px]="selection()!.x"
              [style.top.px]="selection()!.y"
              [style.width.px]="selection()!.width"
              [style.height.px]="selection()!.height"
            ></div>
          }
          <div class="instructions">
            <mat-icon>crop</mat-icon>
            <span>Drag to crop. Drag inside box to reposition.</span>
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="crop-actions">
      <button mat-flat-button type="button" class="action-neutral action-utility" (click)="fitToImage()" [disabled]="isLoading() || !!errorMessage()">
        <mat-icon>fit_screen</mat-icon>
        Full Image
      </button>
      <button mat-flat-button type="button" class="action-neutral action-utility" (click)="resetSelection()" [disabled]="isLoading() || !!errorMessage()">
        <mat-icon>restart_alt</mat-icon>
        Reset
      </button>
      <button mat-flat-button type="button" class="action-secondary" (click)="cancel()">Cancel</button>
      <button mat-flat-button type="button" class="action-primary" (click)="confirmCrop()" [disabled]="isLoading() || !!errorMessage()">
        Use Image
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .cropper-content {
        min-width: min(86vw, 780px);
        max-width: min(92vw, 860px);
        overflow: hidden;
        padding-bottom: 6px;
      }

      .crop-loading {
        min-height: 260px;
        display: grid;
        gap: 8px;
        place-items: center;
        color: var(--dw-text-secondary);
      }

      .crop-loading mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      .crop-error {
        margin: 12px 0;
        color: var(--dw-error);
      }

      .crop-surface {
        position: relative;
        margin: 0 auto;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--dw-border-subtle);
        background: var(--dw-surface-card);
        touch-action: none;
        user-select: none;
      }

      .crop-surface canvas {
        display: block;
        width: 100%;
        height: 100%;
      }

      .selection {
        position: absolute;
        border: 2px solid color-mix(in srgb, var(--dw-accent) 84%, #fff 16%);
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.45);
        border-radius: 10px;
        pointer-events: none;
      }

      .selection::before {
        content: '';
        position: absolute;
        inset: 10px;
        border: 1px dashed color-mix(in srgb, #fff 58%, transparent);
        border-radius: 8px;
        opacity: 0.9;
      }

      .instructions {
        position: absolute;
        left: 10px;
        bottom: 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: color-mix(in srgb, var(--dw-overlay-scrim) 84%, transparent);
        color: var(--dw-on-primary);
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 12px;
        pointer-events: none;
      }

      .instructions mat-icon {
        width: 14px;
        height: 14px;
        font-size: 14px;
      }

      .crop-actions {
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid color-mix(in srgb, var(--dw-border-subtle) 82%, transparent);
      }

      .action-neutral {
        --mdc-filled-button-container-color: var(--dw-surface-elevated) !important;
        --mdc-filled-button-label-text-color: var(--dw-text-secondary) !important;
        border-radius: 10px !important;
        color: var(--dw-text-secondary) !important;
      }

      .action-utility {
        --mdc-filled-button-container-color: var(--dw-surface-card) !important;
        border: 1px solid var(--dw-border-subtle) !important;
        background: var(--dw-surface-card) !important;
        min-height: 34px;
      }

      .action-utility .mat-icon {
        width: 16px;
        height: 16px;
        font-size: 16px;
        margin-right: 4px;
        opacity: 0.86;
      }

      .action-secondary {
        --mdc-filled-button-container-color: var(--dw-surface-card) !important;
        --mdc-filled-button-label-text-color: var(--dw-text-primary) !important;
        border-radius: 10px !important;
        border: 1px solid var(--dw-border-strong) !important;
        color: var(--dw-text-primary) !important;
        background: var(--dw-surface-card) !important;
      }

      .action-primary {
        --mdc-filled-button-container-color: var(--dw-surface-elevated) !important;
        --mdc-filled-button-label-text-color: var(--dw-primary) !important;
        border-radius: 10px !important;
        color: var(--dw-primary) !important;
        background: var(--dw-surface-elevated) !important;
        border: 1px solid var(--dw-primary) !important;
        box-shadow: none !important;
      }

      .action-neutral:hover {
        background: var(--dw-surface-hover) !important;
        color: var(--dw-text-primary) !important;
      }

      .action-utility:hover {
        border-color: var(--dw-border-strong) !important;
        background: var(--dw-surface-hover) !important;
      }

      .action-secondary:hover {
        background: var(--dw-surface-hover) !important;
        border-color: var(--dw-border-strong) !important;
      }

      .action-primary:hover {
        background: var(--dw-surface-card) !important;
        border-color: var(--dw-primary-dark) !important;
      }

      .action-primary[disabled],
      .action-secondary[disabled],
      .action-neutral[disabled] {
        opacity: 0.52;
      }

      @media (max-width: 768px) {
        .cropper-content {
          min-width: min(92vw, 560px);
          padding-inline: 4px;
        }

        .crop-actions {
          flex-wrap: wrap;
          justify-content: flex-end;
        }
      }
    `,
  ],
})
export class ImageCropperDialogComponent implements OnInit {
  private static readonly MIN_SELECTION = 22;

  private dialogRef = inject(MatDialogRef<ImageCropperDialogComponent, string | null>);
  private data = inject<ImageCropDialogData>(MAT_DIALOG_DATA);
  private previewCanvas = viewChild<ElementRef<HTMLCanvasElement>>('previewCanvas');
  private cropSurface = viewChild<ElementRef<HTMLDivElement>>('cropSurface');

  title = signal('Crop Image');
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  canvasWidth = signal(0);
  canvasHeight = signal(0);
  selection = signal<CropRect | null>(null);
  pointerStart = signal<Point | null>(null);
  pointerMode = signal<PointerMode>('draw');
  dragOffset = signal<Point | null>(null);
  activePointerId = signal<number | null>(null);

  private sourceImage: HTMLImageElement | null = null;

  ngOnInit(): void {
    const customTitle = this.data.options?.title?.trim();
    if (customTitle) {
      this.title.set(customTitle);
    }
    void this.initialize();
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  onPointerDown(event: PointerEvent): void {
    if (!this.sourceImage || this.isLoading() || this.errorMessage()) {
      return;
    }
    event.preventDefault();
    const point = this.getLocalPoint(event);
    const currentSelection = this.selection();
    const surface = this.cropSurface()?.nativeElement;
    surface?.setPointerCapture(event.pointerId);
    this.activePointerId.set(event.pointerId);

    if (
      currentSelection &&
      this.isPointInsideSelection(point, currentSelection) &&
      !this.isSelectionCoveringSurface(currentSelection)
    ) {
      this.pointerMode.set('move');
      this.dragOffset.set({
        x: point.x - currentSelection.x,
        y: point.y - currentSelection.y,
      });
      this.pointerStart.set(point);
      return;
    }

    this.pointerMode.set('draw');
    this.dragOffset.set(null);
    this.pointerStart.set(point);
    this.selection.set({ x: point.x, y: point.y, width: 1, height: 1 });
  }

  onPointerMove(event: PointerEvent): void {
    const start = this.pointerStart();
    if (!start) {
      return;
    }
    event.preventDefault();
    const end = this.getLocalPoint(event);

    if (this.pointerMode() === 'move') {
      this.moveSelection(end);
      return;
    }

    this.selection.set(this.buildSelection(start, end));
  }

  onPointerUp(event?: PointerEvent): void {
    const surface = this.cropSurface()?.nativeElement;
    const activePointer = event?.pointerId ?? this.activePointerId();
    if (surface && activePointer !== null && surface.hasPointerCapture(activePointer)) {
      surface.releasePointerCapture(activePointer);
    }

    const current = this.selection();
    this.pointerStart.set(null);
    this.dragOffset.set(null);
    this.pointerMode.set('draw');
    this.activePointerId.set(null);
    if (!current) {
      return;
    }
    if (current.width < ImageCropperDialogComponent.MIN_SELECTION || current.height < ImageCropperDialogComponent.MIN_SELECTION) {
      this.resetSelection();
    }
  }

  resetSelection(): void {
    const width = this.canvasWidth();
    const height = this.canvasHeight();
    if (!width || !height) {
      return;
    }

    const ratio = this.data.options?.aspectRatio;
    if (!ratio || ratio <= 0) {
      this.selection.set({
        x: width * 0.06,
        y: height * 0.06,
        width: width * 0.88,
        height: height * 0.88,
      });
      return;
    }

    const maxWidth = width * 0.88;
    const maxHeight = height * 0.88;
    let cropWidth = maxWidth;
    let cropHeight = cropWidth / ratio;
    if (cropHeight > maxHeight) {
      cropHeight = maxHeight;
      cropWidth = cropHeight * ratio;
    }

    this.selection.set({
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    });
  }

  fitToImage(): void {
    const width = this.canvasWidth();
    const height = this.canvasHeight();
    if (!width || !height) {
      return;
    }
    this.selection.set({ x: 0, y: 0, width, height });
  }

  confirmCrop(): void {
    if (!this.sourceImage) {
      this.dialogRef.close(null);
      return;
    }

    const width = this.canvasWidth();
    const height = this.canvasHeight();
    const selected = this.selection() ?? { x: 0, y: 0, width, height };
    const sourceWidth = this.sourceImage.naturalWidth;
    const sourceHeight = this.sourceImage.naturalHeight;
    const scaleX = sourceWidth / width;
    const scaleY = sourceHeight / height;

    const sx = Math.max(0, Math.round(selected.x * scaleX));
    const sy = Math.max(0, Math.round(selected.y * scaleY));
    const sw = Math.max(1, Math.round(selected.width * scaleX));
    const sh = Math.max(1, Math.round(selected.height * scaleY));

    let outputWidth = sw;
    let outputHeight = sh;
    const maxWidth = this.data.options?.maxOutputWidth;
    const maxHeight = this.data.options?.maxOutputHeight;
    if (maxWidth || maxHeight) {
      const widthFactor = maxWidth ? maxWidth / outputWidth : Number.POSITIVE_INFINITY;
      const heightFactor = maxHeight ? maxHeight / outputHeight : Number.POSITIVE_INFINITY;
      const factor = Math.min(1, widthFactor, heightFactor);
      outputWidth = Math.max(1, Math.round(outputWidth * factor));
      outputHeight = Math.max(1, Math.round(outputHeight * factor));
    }

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const context = canvas.getContext('2d');
    if (!context) {
      this.dialogRef.close(null);
      return;
    }

    context.drawImage(this.sourceImage, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);
    const outputType = this.resolveOutputType();
    const quality = this.data.options?.quality ?? 0.9;
    const croppedDataUrl = canvas.toDataURL(outputType, quality);
    this.dialogRef.close(croppedDataUrl);
  }

  private async initialize(): Promise<void> {
    try {
      const dataUrl = await this.readFileAsDataUrl(this.data.file);
      const image = await this.loadImage(dataUrl);
      this.sourceImage = image;

      const { width, height } = this.computeCanvasSize(image.naturalWidth, image.naturalHeight);
      this.canvasWidth.set(width);
      this.canvasHeight.set(height);

    } catch {
      this.errorMessage.set('Unable to open image for cropping.');
    } finally {
      this.isLoading.set(false);
      this.scheduleInitialRender();
    }
  }

  private computeCanvasSize(sourceWidth: number, sourceHeight: number): { width: number; height: number } {
    const maxWidth = 760;
    const maxHeight = 460;
    const ratio = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);
    return {
      width: Math.max(240, Math.round(sourceWidth * ratio)),
      height: Math.max(180, Math.round(sourceHeight * ratio)),
    };
  }

  private drawPreview(): void {
    if (!this.sourceImage) {
      return;
    }
    const canvasRef = this.previewCanvas();
    if (!canvasRef) {
      return;
    }
    const canvas = canvasRef.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(this.sourceImage, 0, 0, canvas.width, canvas.height);
  }

  private getLocalPoint(event: PointerEvent): Point {
    const surface = this.cropSurface();
    if (!surface) {
      return { x: 0, y: 0 };
    }
    const rect = surface.nativeElement.getBoundingClientRect();
    return {
      x: this.clamp(event.clientX - rect.left, 0, this.canvasWidth()),
      y: this.clamp(event.clientY - rect.top, 0, this.canvasHeight()),
    };
  }

  private buildSelection(start: Point, end: Point): CropRect {
    const ratio = this.data.options?.aspectRatio;
    let width = Math.abs(end.x - start.x);
    let height = Math.abs(end.y - start.y);
    const xDirection = end.x >= start.x ? 1 : -1;
    const yDirection = end.y >= start.y ? 1 : -1;

    if (ratio && ratio > 0) {
      if (height === 0 && width === 0) {
        width = 1;
        height = 1 / ratio;
      } else if (height === 0) {
        height = width / ratio;
      } else if (width / height > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }
    }

    const rawX = xDirection > 0 ? start.x : start.x - width;
    const rawY = yDirection > 0 ? start.y : start.y - height;
    const x = this.clamp(rawX, 0, this.canvasWidth() - width);
    const y = this.clamp(rawY, 0, this.canvasHeight() - height);

    return {
      x,
      y,
      width: this.clamp(width, 1, this.canvasWidth()),
      height: this.clamp(height, 1, this.canvasHeight()),
    };
  }

  private moveSelection(pointer: Point): void {
    const currentSelection = this.selection();
    const offset = this.dragOffset();
    if (!currentSelection || !offset) {
      return;
    }

    const nextX = this.clamp(pointer.x - offset.x, 0, this.canvasWidth() - currentSelection.width);
    const nextY = this.clamp(pointer.y - offset.y, 0, this.canvasHeight() - currentSelection.height);
    this.selection.set({
      ...currentSelection,
      x: nextX,
      y: nextY,
    });
  }

  private isPointInsideSelection(point: Point, selection: CropRect): boolean {
    return (
      point.x >= selection.x &&
      point.x <= selection.x + selection.width &&
      point.y >= selection.y &&
      point.y <= selection.y + selection.height
    );
  }

  private isSelectionCoveringSurface(selection: CropRect): boolean {
    const epsilon = 1;
    return (
      selection.x <= epsilon &&
      selection.y <= epsilon &&
      Math.abs(this.canvasWidth() - selection.width) <= epsilon &&
      Math.abs(this.canvasHeight() - selection.height) <= epsilon
    );
  }

  private resolveOutputType(): 'image/jpeg' | 'image/png' | 'image/webp' {
    if (this.data.options?.outputType) {
      return this.data.options.outputType;
    }
    if (this.data.file.type === 'image/png') {
      return 'image/png';
    }
    if (this.data.file.type === 'image/webp') {
      return 'image/webp';
    }
    return 'image/jpeg';
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Invalid image data'));
      image.src = dataUrl;
    });
  }

  private scheduleInitialRender(): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.drawPreview();
        this.resetSelection();
      });
    });
  }
}
