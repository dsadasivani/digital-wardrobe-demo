import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';
import type {
  DashboardCategoryBreakdownResponseDto,
  DashboardCountersDto,
  DashboardRecentlyAddedDto,
  DashboardSummaryDto,
  DashboardWearInsightsDto,
} from '../dto/dashboard.dto';
import { SKIP_GLOBAL_LOADING } from '../interceptors/loading-context';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly skipLoadingContext = new HttpContext().set(SKIP_GLOBAL_LOADING, true);

  counters(): Observable<DashboardCountersDto> {
    return this.http.get<DashboardCountersDto>(
      `${this.baseUrl}/dashboard/counters`,
      { context: this.skipLoadingContext },
    );
  }

  wearInsights(): Observable<DashboardWearInsightsDto> {
    return this.http.get<DashboardWearInsightsDto>(
      `${this.baseUrl}/dashboard/wear-insights`,
      { context: this.skipLoadingContext },
    );
  }

  recentlyAdded(): Observable<DashboardRecentlyAddedDto> {
    return this.http.get<DashboardRecentlyAddedDto>(
      `${this.baseUrl}/dashboard/recently-added`,
      { context: this.skipLoadingContext },
    );
  }

  categoryBreakdown(): Observable<DashboardCategoryBreakdownResponseDto> {
    return this.http.get<DashboardCategoryBreakdownResponseDto>(
      `${this.baseUrl}/dashboard/category-breakdown`,
      { context: this.skipLoadingContext },
    );
  }

  summary(): Observable<DashboardSummaryDto> {
    return this.http.get<DashboardSummaryDto>(
      `${this.baseUrl}/dashboard/summary`,
      { context: this.skipLoadingContext },
    );
  }
}
