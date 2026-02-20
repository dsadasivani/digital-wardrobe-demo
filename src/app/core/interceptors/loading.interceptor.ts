import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { SHOW_GLOBAL_COSMOS_LOADING, SKIP_GLOBAL_LOADING } from './loading-context';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);

    // Only specific requests should trigger the global cosmos loader.
    if (!req.context.get(SHOW_GLOBAL_COSMOS_LOADING) || req.context.get(SKIP_GLOBAL_LOADING)) {
        return next(req);
    }

    loadingService.show();

    return next(req).pipe(
        finalize(() => loadingService.hide())
    );
};
