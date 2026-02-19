import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AuthApi } from '../api/auth.api';
import { ApiErrorDto } from '../dto/auth.dto';
import { mapUserDtoToModel, mapUserUpdatesToUpdateRequestDto } from '../mappers/auth.mapper';
import { User, UserPreferences } from '../models';
import { AuthTokenService } from './auth-token.service';
import { ThemeService } from './theme.service';
import { WardrobeService } from './wardrobe.service';

interface AuthSessionState {
  isAuthenticated: boolean;
  user: User | null;
}

export type AuthActionResult =
  | { success: true }
  | { success: false; message: string; fieldErrors: Record<string, string> };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private static readonly SESSION_KEY = 'dw-session-auth-state';

  private readonly authApi = inject(AuthApi);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly wardrobeService = inject(WardrobeService);
  private readonly themeService = inject(ThemeService);

  private readonly initialState = this.hydrateFromSession();
  private readonly isAuthenticated = signal(this.initialState.isAuthenticated);
  private readonly currentUser = signal<User | null>(this.initialState.user);

  readonly authenticated = computed(() => this.isAuthenticated() && !!this.authTokenService.token());
  readonly user = this.currentUser.asReadonly();

  constructor() {
    if (this.initialState.user?.preferences) {
      this.applyUserThemePreference(this.initialState.user);
    }
    if (this.authTokenService.token()) {
      this.isAuthenticated.set(true);
      void this.refreshCurrentUser();
    }
  }

  async login(email: string, password: string): Promise<AuthActionResult> {
    try {
      const response = await firstValueFrom(this.authApi.login({ email, password }));
      const mappedUser = mapUserDtoToModel(response.user);
      this.authTokenService.setToken(response.token);
      this.isAuthenticated.set(true);
      this.currentUser.set(mappedUser);
      this.applyUserThemePreference(mappedUser);
      this.persistSnapshot();
      return { success: true };
    } catch (error) {
      this.clearLocalSession();
      return this.buildAuthErrorResult(error, 'Unable to sign in with the provided credentials.');
    }
  }

  async loginWithGoogle(): Promise<boolean> {
    return false;
  }

  async loginWithApple(): Promise<boolean> {
    return false;
  }

  async signup(name: string, email: string, password: string): Promise<AuthActionResult> {
    try {
      const response = await firstValueFrom(this.authApi.signup({ name, email, password }));
      const mappedUser = mapUserDtoToModel(response.user);
      this.authTokenService.setToken(response.token);
      this.isAuthenticated.set(true);
      this.currentUser.set(mappedUser);
      this.applyUserThemePreference(mappedUser);
      this.persistSnapshot();
      return { success: true };
    } catch (error) {
      this.clearLocalSession();
      return this.buildAuthErrorResult(error, 'Unable to create account right now.');
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
    const darkModePreferenceChanged =
      updates.preferences?.darkMode !== undefined &&
      updates.preferences.darkMode !== previousUser.preferences.darkMode;

    const nextUser = this.mergeUser(previousUser, updates);
    this.currentUser.set(nextUser);
    if (darkModePreferenceChanged) {
      this.applyUserThemePreference(nextUser);
    }
    this.persistSnapshot();

    const request = mapUserUpdatesToUpdateRequestDto(updates);
    void firstValueFrom(this.authApi.updateMe(request))
      .then((updatedUserDto) => {
        const mappedUser = mapUserDtoToModel(updatedUserDto);
        this.currentUser.set(mappedUser);
        if (darkModePreferenceChanged) {
          this.applyUserThemePreference(mappedUser);
        }
        this.persistSnapshot();
      })
      .catch(() => {
        this.currentUser.set(previousUser);
        if (darkModePreferenceChanged) {
          this.applyUserThemePreference(previousUser);
        }
        this.persistSnapshot();
      });
  }

  private async refreshCurrentUser(): Promise<void> {
    try {
      const userDto = await firstValueFrom(this.authApi.me());
      const mappedUser = mapUserDtoToModel(userDto);
      this.isAuthenticated.set(true);
      this.currentUser.set(mappedUser);
      this.applyUserThemePreference(mappedUser);
      this.persistSnapshot();
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

  private applyUserThemePreference(user: User): void {
    this.themeService.setDarkMode(user.preferences.darkMode);
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

  private buildAuthErrorResult(error: unknown, fallbackMessage: string): AuthActionResult {
    if (!(error instanceof HttpErrorResponse)) {
      return { success: false, message: fallbackMessage, fieldErrors: {} };
    }

    if (error.status === 0) {
      return {
        success: false,
        message: 'Unable to connect to the server. Please try again.',
        fieldErrors: {},
      };
    }

    const apiError = this.parseApiError(error.error);
    if (!apiError) {
      return { success: false, message: fallbackMessage, fieldErrors: {} };
    }

    const fieldErrors = apiError.fieldErrors.reduce<Record<string, string>>((acc, fieldError) => {
      if (fieldError.field && !acc[fieldError.field]) {
        acc[fieldError.field] = fieldError.message;
      }
      return acc;
    }, {});

    return {
      success: false,
      message: apiError.message || fallbackMessage,
      fieldErrors,
    };
  }

  private parseApiError(payload: unknown): ApiErrorDto | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const candidate = payload as Partial<ApiErrorDto>;
    if (typeof candidate.message !== 'string') {
      return null;
    }

    const fieldErrors = Array.isArray(candidate.fieldErrors)
      ? candidate.fieldErrors.filter(
          (item): item is { field: string; message: string } =>
            !!item &&
            typeof item === 'object' &&
            typeof item.field === 'string' &&
            typeof item.message === 'string'
        )
      : [];

    return {
      timestamp: typeof candidate.timestamp === 'string' ? candidate.timestamp : '',
      status: typeof candidate.status === 'number' ? candidate.status : 0,
      code: typeof candidate.code === 'string' ? candidate.code : '',
      message: candidate.message,
      path: typeof candidate.path === 'string' ? candidate.path : '',
      fieldErrors,
    };
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
