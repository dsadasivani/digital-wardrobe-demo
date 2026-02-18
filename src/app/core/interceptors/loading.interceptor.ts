import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { SKIP_GLOBAL_LOADING } from './loading-context';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);

    // Skip loading for background syncs or specific polling if needed.
    if (req.context.get(SKIP_GLOBAL_LOADING)) {
        return next(req);
    }

    loadingService.show();

    return next(req).pipe(
        finalize(() => loadingService.hide())
    );
};
