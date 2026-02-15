import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AuthTokenService } from '../services/auth-token.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const authTokenService = inject(AuthTokenService);
    const router = inject(Router);

    if (authService.authenticated() || !!authTokenService.token()) {
        return true;
    }

    return router.createUrlTree(['/login']);
};
