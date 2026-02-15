import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

const THEME_STORAGE_KEY = 'dw-theme';
const DARK_THEME = 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);

  applySavedTheme(): void {
    try {
      const savedTheme = window.sessionStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === DARK_THEME) {
        this.document.body.setAttribute('data-theme', DARK_THEME);
        return;
      }
      if (savedTheme === 'light') {
        this.document.body.removeAttribute('data-theme');
      }
    } catch {
      // No-op if storage is blocked.
    }
  }

  isDarkMode(): boolean {
    return this.document.body.getAttribute('data-theme') === DARK_THEME;
  }

  setDarkMode(isDarkMode: boolean): void {
    if (isDarkMode) {
      this.document.body.setAttribute('data-theme', DARK_THEME);
    } else {
      this.document.body.removeAttribute('data-theme');
    }
    try {
      window.sessionStorage.setItem(THEME_STORAGE_KEY, isDarkMode ? DARK_THEME : 'light');
    } catch {
      // No-op if storage is blocked.
    }
  }
}
