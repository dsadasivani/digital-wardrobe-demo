import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { WardrobeItemDto, CreateWardrobeItemRequestDto, UpdateWardrobeItemRequestDto } from '../dto/wardrobe.dto';

@Injectable({ providedIn: 'root' })
export class WardrobeApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    private get url(): string {
        return `${this.baseUrl}/wardrobe-items`;
    }

    list(): Observable<WardrobeItemDto[]> {
        return this.http.get<WardrobeItemDto[]>(this.url);
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
