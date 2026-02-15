import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { API_BASE_URL, resolveApiBaseUrl } from './core/config/api.config';
import { authInterceptor } from './core/http/auth.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    importProvidersFrom(MatSnackBarModule, MatDialogModule),
    provideHttpClient(withInterceptors([
      authInterceptor,
      loadingInterceptor,
      errorInterceptor
    ])),
    {
      provide: API_BASE_URL,
      useFactory: resolveApiBaseUrl,
    },
    provideRouter(routes, withComponentInputBinding())
  ]
};
