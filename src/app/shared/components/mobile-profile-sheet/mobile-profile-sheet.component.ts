import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { User } from '../../../core/models';
import { AuthService } from '../../../core/services';
import { ThemeService } from '../../../core/services/theme.service';

export interface MobileProfileSheetData {
  user: User | null;
  isDarkMode: boolean;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-mobile-profile-sheet',
  imports: [CommonModule, MatButtonModule, MatButtonToggleModule, MatDividerModule, MatIconModule],
  template: `
    <div class="sheet-root">
      <div class="sheet-handle"></div>

      <div class="menu-user-info">
        <div class="info-avatar">
          @if (data.user?.avatar) {
            <img [src]="data.user!.avatar" [alt]="data.user!.name || 'User'" />
          } @else {
            <mat-icon>account_circle</mat-icon>
          }
        </div>
        <div class="info-content">
          <span class="user-name">{{ data.user?.name || 'Guest' }}</span>
          <span class="user-email">{{ data.user?.email || '' }}</span>
        </div>
      </div>

      <div class="mobile-menu-shortcuts">
        <button mat-flat-button (click)="goToProfile()">
          <mat-icon>person_outline</mat-icon>
          Profile
        </button>
        <button mat-stroked-button (click)="closeSheet()">
          <mat-icon>settings</mat-icon>
          Settings
        </button>
      </div>

      <div class="theme-element">
        <div class="theme-label">
          <mat-icon>{{ isDarkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
          <span>Theme</span>
        </div>
        <mat-button-toggle-group
          [value]="isDarkMode() ? 'dark' : 'light'"
          hideSingleSelectionIndicator="true"
          (change)="onThemeChange($event)"
          class="theme-toggles"
        >
          <mat-button-toggle value="light">
            <mat-icon class="icon-sun">wb_sunny</mat-icon>
          </mat-button-toggle>
          <mat-button-toggle value="dark">
            <mat-icon class="icon-moon">dark_mode</mat-icon>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <button class="sheet-action" (click)="closeSheet()">
        <mat-icon>help_outline</mat-icon>
        <span>Help & Support</span>
      </button>

      <mat-divider></mat-divider>

      <button class="sheet-action logout" (click)="logout()">
        <mat-icon>logout</mat-icon>
        <span>Sign Out</span>
      </button>
    </div>
  `,
  styles: [
    `
      .sheet-root {
        padding: 10px 12px calc(14px + var(--dw-safe-bottom));
      }

      .sheet-handle {
        width: 40px;
        height: 4px;
        border-radius: 999px;
        background: var(--dw-text-muted);
        opacity: 0.5;
        margin: 0 auto 12px;
      }

      .menu-user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 4px 12px;
      }

      .info-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--dw-surface-card);
      }

      .info-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .info-avatar mat-icon {
        font-size: 30px;
        width: 30px;
        height: 30px;
        color: var(--dw-text-muted);
      }

      .info-content {
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-weight: 600;
        color: var(--dw-text-primary);
      }

      .user-email {
        font-size: 12px;
        color: var(--dw-text-secondary);
      }

      .mobile-menu-shortcuts {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 10px;
      }

      .mobile-menu-shortcuts button {
        min-height: 44px;
        border-radius: 12px;
      }

      .theme-element {
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 8px 6px 10px;
      }

      .theme-label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        color: var(--dw-text-primary);
      }

      .theme-label mat-icon {
        color: var(--dw-text-secondary);
      }

      .theme-toggles {
        height: 40px;
        border: 1px solid var(--dw-border-strong);
        border-radius: 999px;
        background: var(--dw-surface-card);
        padding: 2px;
        display: inline-flex;
        align-items: center;
      }

      .theme-toggles mat-button-toggle {
        width: 44px;
        height: 34px;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
        transition:
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      .theme-toggles mat-button-toggle ::ng-deep .mat-button-toggle-label-content {
        padding: 0 !important;
        line-height: 0 !important;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .theme-toggles mat-icon {
        margin: 0;
        width: 18px;
        height: 18px;
        font-size: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--dw-text-muted);
        transition: color 180ms ease;
      }

      .theme-toggles .icon-sun {
        color: var(--dw-warning);
      }

      .theme-toggles .icon-moon {
        color: var(--dw-info);
      }

      .theme-toggles mat-button-toggle.mat-button-toggle-checked {
        background: var(--dw-gradient-primary);
        box-shadow: var(--dw-shadow-sm);
      }

      .theme-toggles mat-button-toggle.mat-button-toggle-checked .icon-sun {
        color: var(--dw-on-primary);
      }

      .theme-toggles mat-button-toggle.mat-button-toggle-checked .icon-moon {
        color: var(--dw-on-primary);
      }

      .sheet-action {
        width: 100%;
        min-height: 50px;
        border: none;
        background: transparent;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 12px;
        font-size: 15px;
        color: var(--dw-text-primary);
        text-align: left;
      }

      .sheet-action:hover {
        background: var(--dw-surface-hover);
      }

      .sheet-action.logout {
        color: var(--dw-error);
      }
    `,
  ],
})
export class MobileProfileSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<MobileProfileSheetComponent>);
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeService = inject(ThemeService);

  data = inject<MobileProfileSheetData>(MAT_BOTTOM_SHEET_DATA);
  isDarkMode = signal(this.data.isDarkMode);

  goToProfile(): void {
    this.bottomSheetRef.dismiss();
    this.router.navigate(['/profile']);
  }

  closeSheet(): void {
    this.bottomSheetRef.dismiss();
  }

  onThemeChange(event: MatButtonToggleChange): void {
    const isDark = event.value === 'dark';
    this.isDarkMode.set(isDark);
    this.themeService.setDarkMode(isDark);
  }

  logout(): void {
    this.bottomSheetRef.dismiss();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
