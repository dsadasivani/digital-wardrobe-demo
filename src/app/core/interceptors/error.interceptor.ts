import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import {
    NetworkErrorSnackBarData,
    NetworkErrorSnackbarComponent,
} from '../../shared/components/network-error-snackbar/network-error-snackbar.component';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const snackBar = inject(MatSnackBar);
    const isAuthFormRequest = req.url.includes('/auth/login') || req.url.includes('/auth/signup');

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            let message = 'An unexpected error occurred';
            let isConnectionError = false;

            if (error.error instanceof ErrorEvent) {
                // Client-side error
                message = error.error.message;
            } else {
                // Server-side error
                if (error.status === 0) {
                    message = 'Unable to connect to server';
                    isConnectionError = true;
                } else if (error.status === 401) {
                    // Handled by auth interceptor (redirect to login), but we can still show a message or suppress it
                    message = 'Session expired. Please login again.';
                } else if (error.status === 403) {
                    message = 'You do not have permission to perform this action';
                } else if (error.status === 404) {
                    message = 'Resource not found';
                } else if (error.error && error.error.message) {
                    // Backend ApiError structure
                    message = error.error.message;
                } else {
                    message = `Error ${error.status}: ${error.statusText}`;
                }
            }

            if (!isAuthFormRequest) {
                // Auth pages render errors inline for better field-level guidance.
                if (isConnectionError) {
                    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
                    const data: NetworkErrorSnackBarData = {
                        title: 'Connection issue',
                        message: offline
                            ? "You're offline right now. Please reconnect and try again."
                            : "We couldn't reach Digital Wardrobe. Please try again in a moment.",
                        details: 'Nothing was changed.',
                        retryLabel: 'Retry',
                    };

                    snackBar.dismiss();
                    const ref = snackBar.openFromComponent(NetworkErrorSnackbarComponent, {
                        data,
                        duration: 12000,
                        horizontalPosition: 'end',
                        verticalPosition: 'bottom',
                        panelClass: ['network-error-snackbar'],
                    });
                    ref.onAction().subscribe(() => {
                        if (typeof window !== 'undefined') {
                            window.location.reload();
                        }
                    });
                } else {
                    snackBar.open(message, 'Close', {
                        duration: 5000,
                        horizontalPosition: 'end',
                        verticalPosition: 'bottom',
                        panelClass: ['error-snackbar'],
                    });
                }
            }

            return throwError(() => error);
        })
    );
};
