import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MediaApi } from '../api/media.api';
import type { UploadedImageDto } from '../dto/media.dto';

@Injectable({ providedIn: 'root' })
export class MediaUploadService {
  private readonly mediaApi = inject(MediaApi);

  isDataUrl(value: string): boolean {
    return value.startsWith('data:image/');
  }

  async uploadDataUrls(dataUrls: string[], scope: string): Promise<UploadedImageDto[]> {
    if (!dataUrls.length) {
      return [];
    }
    const files = dataUrls.map((dataUrl, index) => this.dataUrlToFile(dataUrl, index));
    return firstValueFrom(this.mediaApi.uploadImages(files, scope));
  }

  private dataUrlToFile(dataUrl: string, index: number): File {
    const matches = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (!matches) {
      throw new Error('Invalid image data format.');
    }

    const contentType = matches[1].toLowerCase();
    const base64 = matches[2];
    const binary = globalThis.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }

    const extension = this.resolveExtension(contentType);
    const fileName = `wardrobe-${Date.now()}-${index}.${extension}`;
    return new File([bytes], fileName, { type: contentType });
  }

  private resolveExtension(contentType: string): string {
    switch (contentType) {
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/avif':
        return 'avif';
      default:
        return 'jpg';
    }
  }
}
