import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { OutfitDto, CreateOutfitRequestDto, UpdateOutfitRequestDto } from '../dto/outfits.dto';
import type { PageDto } from '../dto/page.dto';

@Injectable({ providedIn: 'root' })
export class OutfitsApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);

    private get url(): string {
        return `${this.baseUrl}/outfits`;
    }

    list(): Observable<OutfitDto[]> {
        return this.http.get<OutfitDto[]>(this.url);
    }

    listPage(page = 0, size = 50): Observable<PageDto<OutfitDto>> {
        return this.http.get<PageDto<OutfitDto>>(`${this.url}/page`, { params: { page, size } });
    }

    getById(id: string): Observable<OutfitDto> {
        return this.http.get<OutfitDto>(`${this.url}/${id}`);
    }

    create(body: CreateOutfitRequestDto): Observable<OutfitDto> {
        return this.http.post<OutfitDto>(this.url, body);
    }

    update(id: string, body: UpdateOutfitRequestDto): Observable<OutfitDto> {
        return this.http.patch<OutfitDto>(`${this.url}/${id}`, body);
    }

    markAsWorn(id: string): Observable<OutfitDto> {
        return this.http.post<OutfitDto>(`${this.url}/${id}/mark-worn`, {});
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
