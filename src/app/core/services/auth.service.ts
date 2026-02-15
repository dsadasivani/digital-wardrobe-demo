import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApi } from '../api/auth.api';
import { mapUserDtoToModel, mapUserUpdatesToUpdateRequestDto } from '../mappers/auth.mapper';
import { User, UserPreferences } from '../models';
import { AuthTokenService } from './auth-token.service';
import { WardrobeService } from './wardrobe.service';

interface AuthSessionState {
  isAuthenticated: boolean;
  user: User | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly SESSION_KEY = 'dw-session-auth-state';

  private readonly authApi = inject(AuthApi);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly wardrobeService = inject(WardrobeService);

  private readonly initialState = this.hydrateFromSession();
  private readonly isAuthenticated = signal(this.initialState.isAuthenticated);
  private readonly currentUser = signal<User | null>(this.initialState.user);

  readonly authenticated = computed(() => this.isAuthenticated() && !!this.authTokenService.token());
  readonly user = this.currentUser.asReadonly();

  constructor() {
    if (this.authTokenService.token()) {
      this.isAuthenticated.set(true);
      void this.refreshCurrentUser();
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.authApi.login({ email, password }));
      this.authTokenService.setToken(response.token);
      this.isAuthenticated.set(true);
      this.currentUser.set(mapUserDtoToModel(response.user));
      this.persistSnapshot();
      await this.loadWardrobeData();
      return true;
    } catch {
      this.clearLocalSession();
      return false;
    }
  }

  async loginWithGoogle(): Promise<boolean> {
    return false;
  }

  async loginWithApple(): Promise<boolean> {
    return false;
  }

  async signup(name: string, email: string, password: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(this.authApi.signup({ name, email, password }));
      this.authTokenService.setToken(response.token);
      this.isAuthenticated.set(true);
      this.currentUser.set(mapUserDtoToModel(response.user));
      this.persistSnapshot();
      await this.loadWardrobeData();
      return true;
    } catch {
      this.clearLocalSession();
      return false;
    }
  }

  logout(): void {
    this.clearLocalSession();
    this.wardrobeService.clearAll();
    void firstValueFrom(this.authApi.logout()).catch(() => undefined);
  }

  handleUnauthorized(): void {
    this.clearLocalSession();
    this.wardrobeService.clearAll();
  }

  updateProfile(updates: Partial<User>): void {
    const previousUser = this.currentUser();
    if (!previousUser) {
      return;
    }

    const nextUser = this.mergeUser(previousUser, updates);
    this.currentUser.set(nextUser);
    this.persistSnapshot();

    const request = mapUserUpdatesToUpdateRequestDto(updates);
    void firstValueFrom(this.authApi.updateMe(request))
      .then((updatedUserDto) => {
        this.currentUser.set(mapUserDtoToModel(updatedUserDto));
        this.persistSnapshot();
      })
      .catch(() => {
        this.currentUser.set(previousUser);
        this.persistSnapshot();
      });
  }

  private async refreshCurrentUser(): Promise<void> {
    try {
      const userDto = await firstValueFrom(this.authApi.me());
      this.isAuthenticated.set(true);
      this.currentUser.set(mapUserDtoToModel(userDto));
      this.persistSnapshot();
      await this.loadWardrobeData();
    } catch (error) {
      if (this.isUnauthorizedError(error)) {
        this.clearLocalSession();
      }
    }
  }

  private mergeUser(user: User, updates: Partial<User>): User {
    return {
      ...user,
      ...updates,
      preferences: this.mergePreferences(user.preferences, updates.preferences),
    };
  }

  private mergePreferences(
    currentPreferences: UserPreferences,
    updates: Partial<UserPreferences> | undefined
  ): UserPreferences {
    if (!updates) {
      return currentPreferences;
    }

    return {
      ...currentPreferences,
      ...updates,
    };
  }

  private hydrateFromSession(): AuthSessionState {
    const hasToken = !!this.authTokenService.token();
    const fallback: AuthSessionState = {
      isAuthenticated: hasToken,
      user: null,
    };

    try {
      const raw = this.readPersistedSnapshot();
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw) as Partial<AuthSessionState>;
      const isAuthenticated = hasToken || parsed.isAuthenticated === true;
      if (parsed.user) {
        return {
          isAuthenticated,
          user: this.hydrateUser(parsed.user),
        };
      }
      return {
        isAuthenticated,
        user: null,
      };
    } catch {
      return fallback;
    }
  }

  private persistSnapshot(): void {
    this.persistToSession({
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser(),
    });
  }

  private persistToSession(state: AuthSessionState): void {
    try {
      window.localStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(state));
    } catch {
      try {
        window.sessionStorage.setItem(AuthService.SESSION_KEY, JSON.stringify(state));
      } catch {
        // Ignore storage failures (private mode/quota).
      }
    }
  }

  private clearLocalSession(): void {
    this.authTokenService.clearToken();
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.persistSnapshot();
  }

  private async loadWardrobeData(): Promise<void> {
    try {
      await this.wardrobeService.loadAll();
    } catch {
      // Keep auth state; data can be retried by views.
    }
  }

  private hydrateUser(user: User): User {
    return {
      ...user,
      createdAt: this.toDate(user.createdAt) ?? new Date(),
    };
  }

  private toDate(value: Date | string | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private isUnauthorizedError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private readPersistedSnapshot(): string | null {
    try {
      const local = window.localStorage.getItem(AuthService.SESSION_KEY);
      if (local) {
        return local;
      }
    } catch {
      // Ignore storage failures.
    }
    try {
      return window.sessionStorage.getItem(AuthService.SESSION_KEY);
    } catch {
      return null;
    }
  }
}
