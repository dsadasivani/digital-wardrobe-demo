import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

import {
  ImageCropperDialogComponent,
  ImageCropOptions,
} from '../../shared/components/image-cropper-dialog/image-cropper-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class ImageCropperService {
  private static readonly DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

  private dialog = inject(MatDialog);

  async cropFile(file: File, options: ImageCropOptions = {}): Promise<string | null> {
    this.validateFile(file);

    const dialogRef = this.dialog.open(ImageCropperDialogComponent, {
      disableClose: true,
      autoFocus: false,
      width: 'min(96vw, 920px)',
      maxWidth: '96vw',
      data: { file, options },
    });

    const cropped = await firstValueFrom(dialogRef.afterClosed());
    return typeof cropped === 'string' && cropped.length > 0 ? cropped : null;
  }

  private validateFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select a valid image file.');
    }
    if (file.size > ImageCropperService.DEFAULT_MAX_BYTES) {
      throw new Error('Image must be 10MB or smaller.');
    }
  }
}
