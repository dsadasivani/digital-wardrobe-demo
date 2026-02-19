import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'dw-theme';
const DARK_THEME = 'dark';
type AppTheme = 'dark' | 'light';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  private readonly darkModeState = signal(false);
  readonly darkMode = this.darkModeState.asReadonly();

  constructor() {
    this.darkModeState.set(this.document.body.getAttribute('data-theme') === DARK_THEME);
  }

  applySavedTheme(): void {
    const savedTheme = this.readStoredTheme();

    if (savedTheme === 'light') {
      this.applyTheme(false);
      return;
    }

    // Default theme is dark unless user explicitly chose light.
    this.applyTheme(true);
  }

  isDarkMode(): boolean {
    return this.darkModeState();
  }

  setDarkMode(isDarkMode: boolean): void {
    this.applyTheme(isDarkMode);
    this.storeTheme(isDarkMode ? DARK_THEME : 'light');
  }

  private readStoredTheme(): AppTheme | null {
    try {
      const local = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (local === DARK_THEME || local === 'light') {
        return local;
      }
    } catch {
      // Continue to session storage fallback.
    }

    try {
      const session = window.sessionStorage.getItem(THEME_STORAGE_KEY);
      if (session === DARK_THEME || session === 'light') {
        // Migrate legacy session-only theme preference to local storage.
        this.storeTheme(session);
        return session;
      }
    } catch {
      // Storage unavailable.
    }

    return null;
  }

  private storeTheme(theme: AppTheme): void {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      try {
        window.sessionStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // No-op if storage is blocked.
      }
    }
  }

  private applyTheme(isDarkMode: boolean): void {
    if (isDarkMode) {
      this.document.body.setAttribute('data-theme', DARK_THEME);
    } else {
      this.document.body.removeAttribute('data-theme');
    }
    this.darkModeState.set(isDarkMode);
  }
}
