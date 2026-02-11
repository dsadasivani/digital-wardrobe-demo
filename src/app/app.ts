import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  Renderer2,
  signal,
} from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA,
} from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from './core/models';
import { AuthService } from './core/services';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

interface MobileProfileSheetData {
  user: User | null;
  isDarkMode: boolean;
}

const THEME_STORAGE_KEY = 'dw-theme';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-mobile-create-sheet',
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="create-sheet">
      <div class="sheet-handle"></div>
      <h3>Create</h3>

      <button class="create-option" (click)="goToItem()">
        <span class="option-icon"><mat-icon>checkroom</mat-icon></span>
        <span class="option-content">
          <strong>Item</strong>
          <small>Add a wardrobe item</small>
        </span>
      </button>

      <button class="create-option" (click)="goToAccessory()">
        <span class="option-icon"><mat-icon>watch</mat-icon></span>
        <span class="option-content">
          <strong>Accessory</strong>
          <small>Manage accessory collection</small>
        </span>
      </button>
    </div>
  `,
  styles: [
    `
      .create-sheet {
        padding: 10px 12px calc(14px + var(--dw-safe-bottom));
      }

      .sheet-handle {
        width: 40px;
        height: 4px;
        border-radius: 999px;
        background: var(--dw-text-muted);
        opacity: 0.5;
        margin: 0 auto 10px;
      }

      .create-sheet h3 {
        margin: 0 0 10px;
        font-size: 1rem;
        color: var(--dw-text-primary);
      }

      .create-option {
        width: 100%;
        border: 1px solid var(--dw-border-subtle, rgba(0, 0, 0, 0.08));
        background: var(--dw-surface-card);
        color: var(--dw-text-primary);
        border-radius: 14px;
        min-height: 58px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
      }

      .create-option + .create-option {
        margin-top: 8px;
      }

      .option-icon {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: var(--dw-surface-elevated);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .option-content {
        display: flex;
        flex-direction: column;
      }

      .option-content small {
        color: var(--dw-text-secondary);
        font-size: 12px;
      }
    `,
  ],
})
export class MobileCreateSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<MobileCreateSheetComponent>);
  private router = inject(Router);

  goToItem(): void {
    this.bottomSheetRef.dismiss();
    this.router.navigate(['/wardrobe/add']);
  }

  goToAccessory(): void {
    this.bottomSheetRef.dismiss();
    this.router.navigate(['/accessories/add']);
  }
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
        border: 1px solid rgba(140, 123, 112, 0.22);
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
        color: #b45309;
      }

      .theme-toggles .icon-moon {
        color: #334155;
      }

      .theme-toggles mat-button-toggle.mat-button-toggle-checked {
        background: var(--dw-gradient-primary);
        box-shadow: 0 3px 10px -6px rgba(140, 123, 112, 0.75);
      }

      .theme-toggles mat-button-toggle.mat-button-toggle-checked .icon-sun {
        color: #fff;
      }

      .theme-toggles mat-button-toggle.mat-button-toggle-checked .icon-moon {
        color: #fff;
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

      .sheet-action.logout {
        color: #dc2626;
      }
    `,
  ],
})
export class MobileProfileSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<MobileProfileSheetComponent>);
  private authService = inject(AuthService);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);

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
    if (isDark) {
      this.renderer.setAttribute(this.document.body, 'data-theme', 'dark');
    } else {
      this.renderer.removeAttribute(this.document.body, 'data-theme');
    }
    try {
      window.sessionStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // No-op if storage is blocked.
    }
  }

  logout(): void {
    this.bottomSheetRef.dismiss();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-root',
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatBottomSheetModule,
    HeaderComponent,
    SidebarComponent,
  ],
  template: `
    @if (showLayout()) {
      <dw-header
        [user]="user()"
        (toggleSidebar)="onToggleSidebar()"
        (openMobileProfileMenu)="openMobileProfileSheet()"
      ></dw-header>

      <dw-sidebar
        [collapsed]="sidebarCollapsed()"
        [mobileOpen]="mobileMenuOpen()"
        (toggleCollapse)="sidebarCollapsed.set(!sidebarCollapsed())"
        (closeMobile)="closeMobileMenu()"
      >
      </dw-sidebar>

      <button
        class="mobile-backdrop"
        [class.visible]="mobileMenuOpen()"
        (click)="closeMobileMenu()"
        aria-label="Close navigation menu"
      ></button>

      <main
        class="main-content"
        [class.sidebar-collapsed]="sidebarCollapsed()"
        [class.mobile-nav-spaced]="isMobile()"
      >
        <router-outlet></router-outlet>
      </main>

      @if (isRouteLoading()) {
        <div class="route-loader-overlay" aria-live="polite" aria-label="Loading page">
          <div class="wardrobe-loader">
            <div class="style-loader" aria-hidden="true">
              <div class="style-core">
                <mat-icon>checkroom</mat-icon>
              </div>
              <span class="style-orbit orbit-1"></span>
              <span class="style-orbit orbit-2"></span>
              <span class="style-orbit orbit-3"></span>
            </div>
            <div class="loader-copy">
              <strong>Curating your look</strong>
              <span>Loading your wardrobe</span>
            </div>
          </div>
        </div>
      }

      @if (isMobile()) {
        @if (createMenuOpen()) {
          <button
            class="mobile-create-backdrop"
            aria-label="Close create menu"
            (click)="closeCreateMenu()"
          ></button>
        }
        <nav class="mobile-bottom-nav glass" (click)="closeCreateMenu()">
          @if (createMenuOpen()) {
            <div class="mobile-create-popup glass" (click)="$event.stopPropagation()">
              <!-- <div class="create-popup-header">
                <strong>Quick Add</strong>
                <span>Choose what you want to add</span>
              </div> -->
              <button
                class="create-popup-option"
                type="button"
                (click)="navigateFromCreateMenu('/wardrobe/add')"
              >
                <span class="option-icon"><mat-icon>checkroom</mat-icon></span>
                <span class="option-content">
                  <span class="option-label">Item</span>
                  <small>Add wardrobe piece</small>
                </span>
              </button>
              <button
                class="create-popup-option"
                type="button"
                (click)="navigateFromCreateMenu('/accessories/add')"
              >
                <span class="option-icon"><mat-icon>watch</mat-icon></span>
                <span class="option-content">
                  <span class="option-label">Accessory</span>
                  <small>Add bags, watches, jewelry</small>
                </span>
              </button>
            </div>
          }
          @for (item of mobileNavItems; track item.label) {
            @if (item.kind === 'create') {
              <button
                class="mobile-nav-item create-item"
                [class.open]="createMenuOpen()"
                (click)="toggleCreateMenu($event)"
              >
                <mat-icon>add</mat-icon>
              </button>
            } @else {
              <a
                class="mobile-nav-item"
                [routerLink]="item.route!"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: !!item.exact }"
                (click)="onMobileNavTap(item.route!, !!item.exact)"
              >
                <mat-icon>{{ item.icon }}</mat-icon>
                <span>{{ item.label }}</span>
              </a>
            }
          }
        </nav>
      }
    } @else {
      <router-outlet></router-outlet>
    }
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--dw-surface-base);
        --dw-mobile-nav-fg: #5f5a52;
        --dw-mobile-nav-active-fg: #3f372f;
        --dw-mobile-nav-active-icon: #8b5e34;
        --dw-mobile-nav-active-dot: #9a6a3f;
        --dw-mobile-nav-create-fg: #ffffff;
      }

      :host-context(body[data-theme='dark']) {
        --dw-mobile-nav-fg: #e6efff;
        --dw-mobile-nav-active-fg: #0b1a33;
        --dw-mobile-nav-active-icon: color-mix(in srgb, var(--dw-primary) 78%, var(--dw-text-primary) 22%);
        --dw-mobile-nav-active-dot: color-mix(in srgb, var(--dw-primary) 72%, #ffffff 28%);
        --dw-mobile-nav-create-fg: #ffffff;
      }

      .main-content {
        margin-left: var(--dw-sidebar-width);
        margin-top: var(--dw-header-height);
        min-height: calc(100vh - var(--dw-header-height));
        transition: margin-left var(--dw-transition-normal);

        &.sidebar-collapsed {
          margin-left: var(--dw-sidebar-collapsed);
        }
      }

      .mobile-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1090;
        border: none;
        background: rgba(0, 0, 0, 0.35);
        backdrop-filter: blur(2px);
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--dw-transition-fast);

        &.visible {
          opacity: 1;
          pointer-events: auto;
        }
      }

      .mobile-bottom-nav {
        display: none;
      }

      .route-loader-overlay {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: grid;
        place-items: center;
        background: color-mix(in srgb, var(--dw-surface-base) 68%, transparent);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        animation: fadeIn 180ms var(--dw-ease-emphasis);
      }

      .wardrobe-loader {
        min-width: 230px;
        padding: 6px 8px;
        display: grid;
        justify-items: center;
        gap: 10px;
      }

      .style-loader {
        width: 94px;
        height: 94px;
        position: relative;
        display: grid;
        place-items: center;
      }

      .style-loader::before {
        content: '';
        position: absolute;
        inset: 8px;
        border-radius: 50%;
        border: 1px dashed color-mix(in srgb, var(--dw-primary) 42%, transparent);
        opacity: 0.55;
        animation: spinRing 2200ms linear infinite;
      }

      .style-loader::after {
        content: '';
        position: absolute;
        inset: 20px;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          color-mix(in srgb, var(--dw-primary) 22%, transparent) 0%,
          transparent 72%
        );
        animation: auraPulse 1200ms ease-in-out infinite;
      }

      .style-core {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: #fff;
        background: var(--dw-gradient-primary);
        box-shadow: 0 8px 20px -10px rgba(140, 123, 112, 0.6);
        animation: coreFloat 900ms ease-in-out infinite;
        z-index: 1;
      }

      .style-core mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .style-orbit {
        position: absolute;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--dw-primary) 50%, transparent);
        background: color-mix(in srgb, var(--dw-surface-elevated) 88%, var(--dw-primary) 12%);
        top: 50%;
        left: 50%;
        margin: -4.5px 0 0 -4.5px;
        box-shadow: 0 2px 8px -5px rgba(140, 123, 112, 0.55);
      }

      .orbit-1 {
        animation: orbitA 1200ms linear infinite;
        width: 8px;
        height: 8px;
        margin: -4px 0 0 -4px;
      }

      .orbit-2 {
        animation: orbitB 1400ms linear infinite;
        opacity: 0.9;
      }

      .orbit-3 {
        animation: orbitC 1600ms linear infinite;
        width: 11px;
        height: 11px;
        margin: -5.5px 0 0 -5.5px;
        opacity: 0.76;
      }

      .loader-copy {
        text-align: center;
        display: grid;
        gap: 2px;
      }

      .loader-copy strong {
        font-size: 14px;
        font-weight: 600;
        color: var(--dw-text-primary);
        letter-spacing: 0.01em;
        background: linear-gradient(
          90deg,
          var(--dw-text-primary),
          var(--dw-primary),
          var(--dw-text-primary)
        );
        background-size: 180% 100%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: loaderTitleGlow 2200ms ease-in-out infinite;
      }

      .loader-copy span {
        font-size: 12px;
        color: var(--dw-text-secondary);
      }

      .loader-copy span::after {
        content: '...';
        display: inline-block;
        width: 12px;
        overflow: hidden;
        vertical-align: bottom;
        animation: loadingDots 900ms steps(3, end) infinite;
      }

      @keyframes spinRing {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes coreFloat {
        0%,
        100% {
          transform: translateY(0) scale(1);
        }
        50% {
          transform: translateY(3px) scale(1.03);
        }
      }

      @keyframes auraPulse {
        0%,
        100% {
          transform: scale(0.92);
          opacity: 0.48;
        }
        50% {
          transform: scale(1.06);
          opacity: 0.75;
        }
      }

      @keyframes orbitA {
        from {
          transform: rotate(0deg) translateX(38px) rotate(0deg);
        }
        to {
          transform: rotate(360deg) translateX(38px) rotate(-360deg);
        }
      }

      @keyframes orbitB {
        from {
          transform: rotate(120deg) translateX(38px) rotate(-120deg);
        }
        to {
          transform: rotate(480deg) translateX(38px) rotate(-480deg);
        }
      }

      @keyframes orbitC {
        from {
          transform: rotate(240deg) translateX(38px) rotate(-240deg);
        }
        to {
          transform: rotate(600deg) translateX(38px) rotate(-600deg);
        }
      }

      @keyframes loaderTitleGlow {
        0%,
        100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }

      @keyframes loadingDots {
        0%,
        20% {
          width: 0;
        }
        40% {
          width: 4px;
        }
        70% {
          width: 8px;
        }
        100% {
          width: 12px;
        }
      }

      @media (max-width: 768px) {
        .main-content {
          margin-left: 0;

          &.mobile-nav-spaced {
            padding-bottom: calc(var(--dw-mobile-nav-height) + var(--dw-safe-bottom) + 12px);
          }
        }

        .mobile-bottom-nav {
          position: fixed;
          left: 12px;
          right: 12px;
          bottom: calc(var(--dw-safe-bottom) + 10px);
          z-index: 1080;
          border-radius: 26px;
          padding: 8px 10px 10px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 4px;
          border: 1px solid rgba(255, 255, 255, 0.26);
          background:
            linear-gradient(
              180deg,
              rgba(191, 219, 254, 0.28) 0%,
              rgba(147, 197, 253, 0.1) 48%,
              rgba(30, 41, 59, 0.14) 100%
            ),
            color-mix(in srgb, var(--dw-surface-card) 76%, #0f172a 14%, #93c5fd 10%);
          backdrop-filter: blur(22px) saturate(150%);
          -webkit-backdrop-filter: blur(22px) saturate(150%);
          box-shadow:
            0 22px 34px -24px rgba(2, 6, 23, 0.65),
            0 10px 18px -16px rgba(30, 64, 175, 0.38),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          overflow: visible;
        }

        .mobile-create-backdrop {
          position: fixed;
          inset: 0;
          z-index: 1075;
          border: none;
          background: color-mix(in srgb, var(--dw-surface-base) 22%, transparent);
          backdrop-filter: blur(8px) saturate(110%);
          -webkit-backdrop-filter: blur(8px) saturate(110%);
        }

        .mobile-create-popup {
          position: absolute;
          left: 50%;
          bottom: calc(100% + 14px);
          transform: translateX(-50%);
          min-width: 186px;
          padding: 10px;
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.24);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.08)),
            color-mix(in srgb, var(--dw-surface-card) 84%, #93c5fd 16%);
          backdrop-filter: blur(20px) saturate(140%);
          -webkit-backdrop-filter: blur(20px) saturate(140%);
          box-shadow:
            0 24px 30px -22px rgba(2, 6, 23, 0.82),
            inset 0 1px 0 rgba(255, 255, 255, 0.45);
          display: grid;
          gap: 8px;
          animation: createPopupIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
          z-index: 2;
        }

        .create-popup-header {
          display: grid;
          gap: 2px;
          padding: 2px 2px 4px;
        }

        .create-popup-header strong {
          font-size: 13px;
          color: var(--dw-text-primary);
          letter-spacing: 0.01em;
        }

        .create-popup-header span {
          font-size: 11px;
          color: var(--dw-text-secondary);
        }

        .create-popup-option {
          border: none;
          background: rgba(255, 255, 255, 0.14);
          color: var(--dw-text-primary);
          border-radius: 12px;
          min-height: 50px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          font-weight: 600;
          transition:
            background-color 160ms ease,
            transform 160ms ease,
            box-shadow 160ms ease;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
        }

        .create-popup-option:hover {
          background: rgba(255, 255, 255, 0.2);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.22),
            0 8px 14px -14px rgba(15, 23, 42, 0.5);
        }

        .create-popup-option:active {
          transform: scale(0.98);
        }

        .option-icon {
          width: 28px;
          height: 28px;
          border-radius: 9px;
          display: grid;
          place-items: center;
          background: color-mix(in srgb, var(--dw-primary) 18%, rgba(255, 255, 255, 0.24));
          border: 1px solid rgba(255, 255, 255, 0.26);
        }

        .option-icon mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
          color: var(--dw-primary);
        }

        .option-label {
          letter-spacing: 0.01em;
        }

        .option-content {
          display: grid;
          gap: 1px;
          text-align: left;
        }

        .option-content small {
          font-size: 11px;
          font-weight: 500;
          color: var(--dw-text-secondary);
        }

        .mobile-nav-item {
          position: relative;
          border: none;
          background: transparent;
          min-height: 54px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: var(--dw-mobile-nav-fg);
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          transition:
            background-color 180ms ease,
            color 180ms ease,
            transform 180ms ease,
            box-shadow 180ms ease;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
            color: inherit;
          }

          span {
            line-height: 1;
            opacity: 0.95;
            letter-spacing: 0.01em;
          }

          &.active {
            color: var(--dw-mobile-nav-active-fg);
            background: color-mix(in srgb, var(--dw-primary) 10%, transparent);
            box-shadow: 0 8px 16px -14px color-mix(in srgb, var(--dw-primary) 40%, rgba(15, 23, 42, 0.45));
          }

          &.active mat-icon {
            color: var(--dw-mobile-nav-active-icon);
            transform: translateY(-1px) scale(1.06);
          }

          &.active span {
            color: var(--dw-text-primary);
            opacity: 1;
          }

          &.active::after {
            content: '';
            position: absolute;
            left: 50%;
            bottom: 5px;
            transform: translateX(-50%);
            width: 5px;
            height: 5px;
            border-radius: 999px;
            background: var(--dw-mobile-nav-active-dot);
            box-shadow: 0 0 8px -2px color-mix(in srgb, var(--dw-primary) 62%, rgba(15, 23, 42, 0.4));
          }
        }

        .mobile-nav-item.create-item {
          border-radius: 999px;
          width: 58px;
          height: 58px;
          min-height: 58px;
          justify-self: center;
          align-self: center;
          transform: none;
          background:
            radial-gradient(circle at 28% 20%, rgba(255, 255, 255, 0.62), transparent 42%),
            radial-gradient(
              circle at 82% 86%,
              color-mix(in srgb, var(--dw-primary) 28%, rgba(15, 23, 42, 0.2)),
              transparent 48%
            ),
            linear-gradient(
              150deg,
              color-mix(in srgb, var(--dw-primary) 74%, #ffffff 26%),
              color-mix(in srgb, var(--dw-primary) 88%, #000000 12%)
            );
          color: var(--dw-mobile-nav-create-fg);
          box-shadow:
            0 18px 24px -20px rgba(2, 6, 23, 0.85),
            0 12px 18px -12px color-mix(in srgb, var(--dw-primary) 48%, rgba(15, 23, 42, 0.35)),
            0 0 0 1px rgba(255, 255, 255, 0.5) inset,
            inset 0 -8px 12px rgba(15, 23, 42, 0.2);
          display: grid;
          place-items: center;
          padding: 0;
        }

        .mobile-nav-item.create-item mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
          color: var(--dw-mobile-nav-create-fg);
          transition: transform 220ms ease;
        }

        .mobile-nav-item.create-item.open mat-icon {
          transform: rotate(135deg);
        }

        .mobile-nav-item.create-item span {
          display: none;
        }

        .mobile-nav-item.create-item:active {
          transform: scale(0.96);
        }

        .mobile-bottom-nav::before {
          content: '';
          position: absolute;
          left: 22px;
          right: 22px;
          top: 0;
          height: 1px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
          opacity: 0.68;
          pointer-events: none;
        }

        @keyframes createPopupIn {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      }
    `,
  ],
})
export class App implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private bottomSheet = inject(MatBottomSheet);
  private document = inject(DOCUMENT);

  user = this.authService.user;
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  isMobile = signal(false);
  isRouteLoading = signal(false);
  showLayout = signal(true);
  currentUrl = signal('/');
  createMenuOpen = signal(false);
  mobileNavItems: Array<{
    icon: string;
    label: string;
    kind: 'route' | 'create';
    route?: string;
    exact?: boolean;
  }> = [
    { icon: 'dashboard', label: 'Home', kind: 'route', route: '/', exact: true },
    { icon: 'checkroom', label: 'Wardrobe', kind: 'route', route: '/wardrobe', exact: false },
    { icon: 'add', label: 'Create', kind: 'create' },
    { icon: 'calendar_month', label: 'Calendar', kind: 'route', route: '/calendar', exact: false },
    { icon: 'style', label: 'Outfits', kind: 'route', route: '/outfits', exact: false },
  ];

  private noLayoutRoutes = ['/login', '/signup'];
  private loaderTimer: ReturnType<typeof setTimeout> | null = null;
  private loadingStartedAt = 0;
  private readonly minLoaderMs = 240;
  private nextScrollBehavior: ScrollBehavior = 'auto';
  private readonly resizeHandler = () => this.syncViewportState();
  private routerEventsSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.applySavedTheme();
    this.syncViewportState();
    window.addEventListener('resize', this.resizeHandler);

    this.routerEventsSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loadingStartedAt = Date.now();
        this.setRouteLoading(true);
        return;
      }

      if (event instanceof NavigationEnd) {
        this.showLayout.set(!this.noLayoutRoutes.includes(event.urlAfterRedirects));
        this.mobileMenuOpen.set(false);
        this.createMenuOpen.set(false);
        this.currentUrl.set(event.urlAfterRedirects);
        this.scrollToTop(this.nextScrollBehavior);
        this.nextScrollBehavior = 'auto';
        this.finishLoading();
        return;
      }

      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.finishLoading();
      }
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    this.routerEventsSubscription?.unsubscribe();
    if (this.loaderTimer) {
      clearTimeout(this.loaderTimer);
      this.loaderTimer = null;
    }
  }

  onToggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileMenuOpen.set(!this.mobileMenuOpen());
      return;
    }
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  openMobileProfileSheet(): void {
    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
    this.bottomSheet.open(MobileProfileSheetComponent, {
      data: {
        user: this.user(),
        isDarkMode,
      } as MobileProfileSheetData,
      panelClass: 'dw-mobile-profile-sheet',
      backdropClass: 'dw-mobile-sheet-backdrop',
    });
  }

  openMobileCreateSheet(): void {
    this.createMenuOpen.set(true);
  }

  closeCreateMenu(): void {
    this.createMenuOpen.set(false);
  }

  toggleCreateMenu(event: Event): void {
    event.stopPropagation();
    this.createMenuOpen.set(!this.createMenuOpen());
  }

  navigateFromCreateMenu(route: '/wardrobe/add' | '/accessories/add'): void {
    this.createMenuOpen.set(false);
    this.router.navigate([route]);
  }

  onMobileNavTap(route: string, exact: boolean): void {
    this.createMenuOpen.set(false);
    this.scrollToTopOnNavTap(route, exact);
  }

  scrollToTopOnNavTap(route: string, exact: boolean): void {
    const current = this.currentUrl();
    const isSameRoute = exact ? current === route : current.startsWith(route);
    if (isSameRoute) {
      this.scrollToTop('smooth');
      return;
    }
    this.nextScrollBehavior = 'smooth';
  }

  private syncViewportState(): void {
    this.isMobile.set(window.innerWidth <= 768);
  }

  private setRouteLoading(loading: boolean): void {
    if (this.loaderTimer) {
      clearTimeout(this.loaderTimer);
      this.loaderTimer = null;
    }
    this.isRouteLoading.set(loading);
  }

  private finishLoading(): void {
    const elapsed = Date.now() - this.loadingStartedAt;
    const remaining = Math.max(0, this.minLoaderMs - elapsed);
    if (remaining === 0) {
      this.setRouteLoading(false);
      return;
    }
    this.loaderTimer = setTimeout(() => {
      this.setRouteLoading(false);
    }, remaining);
  }

  private scrollToTop(behavior: ScrollBehavior = 'auto'): void {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior });
      const mainContent = this.document.querySelector<HTMLElement>('.main-content');
      if (behavior === 'smooth') {
        if (mainContent && typeof mainContent.scrollTo === 'function') {
          mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      this.document.documentElement.scrollTop = 0;
      this.document.body.scrollTop = 0;
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
    });
  }

  private applySavedTheme(): void {
    try {
      const savedTheme = window.sessionStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark') {
        this.document.body.setAttribute('data-theme', 'dark');
        return;
      }
      if (savedTheme === 'light') {
        this.document.body.removeAttribute('data-theme');
      }
    } catch {
      // No-op if storage is blocked.
    }
  }
}
