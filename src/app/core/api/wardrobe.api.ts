import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { WardrobeItemDto, CreateWardrobeItemRequestDto, UpdateWardrobeItemRequestDto } from '../dto/wardrobe.dto';
import type { PageDto } from '../dto/page.dto';
import { SKIP_GLOBAL_LOADING } from '../interceptors/loading-context';

@Injectable({ providedIn: 'root' })
export class WardrobeApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);
    private readonly skipLoadingContext = new HttpContext().set(SKIP_GLOBAL_LOADING, true);

    private get url(): string {
        return `${this.baseUrl}/wardrobe-items`;
    }

    list(): Observable<WardrobeItemDto[]> {
        return this.http.get<WardrobeItemDto[]>(this.url, { context: this.skipLoadingContext });
    }

    listPage(page = 0, size = 50): Observable<PageDto<WardrobeItemDto>> {
        return this.http.get<PageDto<WardrobeItemDto>>(`${this.url}/page`, {
            params: { page, size },
            context: this.skipLoadingContext,
        });
    }

    getById(id: string): Observable<WardrobeItemDto> {
        return this.http.get<WardrobeItemDto>(`${this.url}/${id}`);
    }

    create(body: CreateWardrobeItemRequestDto): Observable<WardrobeItemDto> {
        return this.http.post<WardrobeItemDto>(this.url, body);
    }

    update(id: string, body: UpdateWardrobeItemRequestDto): Observable<WardrobeItemDto> {
        return this.http.patch<WardrobeItemDto>(`${this.url}/${id}`, body);
    }

    markAsWorn(id: string): Observable<WardrobeItemDto> {
        return this.http.post<WardrobeItemDto>(`${this.url}/${id}/mark-worn`, {});
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
