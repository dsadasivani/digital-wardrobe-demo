import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { UploadedImageDto } from '../dto/media.dto';

@Injectable({ providedIn: 'root' })
export class MediaApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  uploadImages(files: File[], scope: string): Observable<UploadedImageDto[]> {
    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file, file.name);
    }

    return this.http.post<UploadedImageDto[]>(`${this.baseUrl}/media/images`, formData, {
      params: { scope },
    });
  }
}
