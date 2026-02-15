import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthTokenService {
  private static readonly TOKEN_KEY = 'dw-auth-token';

  private readonly currentToken = signal<string | null>(this.hydrateToken());
  readonly token = this.currentToken.asReadonly();

  setToken(token: string): void {
    this.currentToken.set(token);
    this.persistToken(token);
  }

  clearToken(): void {
    this.currentToken.set(null);
    this.clearPersistedToken();
  }

  private hydrateToken(): string | null {
    const local = this.readStorage(localStorage);
    if (local) {
      return local;
    }
    return this.readStorage(sessionStorage);
  }

  private readStorage(storage: Storage): string | null {
    try {
      return storage.getItem(AuthTokenService.TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private persistToken(token: string): void {
    try {
      window.localStorage.setItem(AuthTokenService.TOKEN_KEY, token);
    } catch {
      try {
        window.sessionStorage.setItem(AuthTokenService.TOKEN_KEY, token);
      } catch {
        // Ignore storage failures.
      }
    }
  }

  private clearPersistedToken(): void {
    try {
      window.localStorage.removeItem(AuthTokenService.TOKEN_KEY);
    } catch {
      // Ignore storage failures.
    }
    try {
      window.sessionStorage.removeItem(AuthTokenService.TOKEN_KEY);
    } catch {
      // Ignore storage failures.
    }
  }
}
