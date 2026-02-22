import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type {
  CatalogCategoryOptionDto,
  CatalogOptionsDto,
  OccasionOptionDto,
  SizeOptionDto,
} from '../dto/catalog-options.dto';
import { SKIP_GLOBAL_LOADING } from '../interceptors/loading-context';

@Injectable({ providedIn: 'root' })
export class CatalogOptionsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly skipLoadingContext = new HttpContext().set(SKIP_GLOBAL_LOADING, true);

  private get url(): string {
    return `${this.baseUrl}/catalog-options`;
  }

  wardrobeOptions(): Observable<CatalogOptionsDto> {
    return this.http.get<CatalogOptionsDto>(`${this.url}/wardrobe`, { context: this.skipLoadingContext });
  }

  accessoryOptions(): Observable<CatalogOptionsDto> {
    return this.http.get<CatalogOptionsDto>(`${this.url}/accessories`, { context: this.skipLoadingContext });
  }

  outfitOptions(): Observable<CatalogOptionsDto> {
    return this.http.get<CatalogOptionsDto>(`${this.url}/outfits`, { context: this.skipLoadingContext });
  }

  addWardrobeCategory(label: string): Observable<CatalogCategoryOptionDto> {
    return this.http.post<CatalogCategoryOptionDto>(`${this.url}/wardrobe/categories`, { label });
  }

  addAccessoryCategory(label: string): Observable<CatalogCategoryOptionDto> {
    return this.http.post<CatalogCategoryOptionDto>(`${this.url}/accessories/categories`, { label });
  }

  addOutfitCategory(label: string): Observable<CatalogCategoryOptionDto> {
    return this.http.post<CatalogCategoryOptionDto>(`${this.url}/outfits/categories`, { label });
  }

  addOccasion(value: string): Observable<OccasionOptionDto> {
    return this.http.post<OccasionOptionDto>(`${this.url}/occasions`, { value });
  }

  addSize(value: string): Observable<SizeOptionDto> {
    return this.http.post<SizeOptionDto>(`${this.url}/sizes`, { value });
  }
}
