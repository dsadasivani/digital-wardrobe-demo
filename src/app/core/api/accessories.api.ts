import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type { AccessoryDto, CreateAccessoryRequestDto, UpdateAccessoryRequestDto } from '../dto/accessories.dto';
import type { PageDto } from '../dto/page.dto';
import { SKIP_GLOBAL_LOADING } from '../interceptors/loading-context';

@Injectable({ providedIn: 'root' })
export class AccessoriesApi {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = inject(API_BASE_URL);
    private readonly skipLoadingContext = new HttpContext().set(SKIP_GLOBAL_LOADING, true);

    private get url(): string {
        return `${this.baseUrl}/accessories`;
    }

    list(): Observable<AccessoryDto[]> {
        return this.http.get<AccessoryDto[]>(this.url, { context: this.skipLoadingContext });
    }

    listPage(page = 0, size = 50): Observable<PageDto<AccessoryDto>> {
        return this.http.get<PageDto<AccessoryDto>>(`${this.url}/page`, {
            params: { page, size },
            context: this.skipLoadingContext,
        });
    }

    getById(id: string): Observable<AccessoryDto> {
        return this.http.get<AccessoryDto>(`${this.url}/${id}`);
    }

    create(body: CreateAccessoryRequestDto): Observable<AccessoryDto> {
        return this.http.post<AccessoryDto>(this.url, body);
    }

    update(id: string, body: UpdateAccessoryRequestDto): Observable<AccessoryDto> {
        return this.http.patch<AccessoryDto>(`${this.url}/${id}`, body);
    }

    markAsWorn(id: string): Observable<AccessoryDto> {
        return this.http.post<AccessoryDto>(`${this.url}/${id}/mark-worn`, {});
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.url}/${id}`);
    }
}
