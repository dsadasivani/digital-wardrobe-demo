import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject, Renderer2, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { User } from './core/models';
import { AuthService } from './core/services';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

interface MobileProfileSheetData {
  user: User | null;
  isDarkMode: boolean;
}

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
    this.router.navigate(['/accessories']);
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
            <mat-icon>wb_sunny</mat-icon>
          </mat-button-toggle>
          <mat-button-toggle value="dark">
            <mat-icon>dark_mode</mat-icon>
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
        padding: 6px 4px 8px;
      }

      .theme-label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
      }

      .theme-toggles {
        height: 36px;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 20px;
        background: rgba(0, 0, 0, 0.04);
        padding: 2px;
        display: inline-flex;
        align-items: center;
      }

      .theme-toggles mat-button-toggle {
        width: 40px;
        height: 32px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
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
        width: 20px;
        height: 20px;
        font-size: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
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
      <dw-header [user]="user()" (toggleSidebar)="onToggleSidebar()"></dw-header>

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
        <nav class="mobile-bottom-nav glass">
          @for (item of mobileNavItems; track item.label) {
            @if (item.kind === 'create') {
              <button class="mobile-nav-item create-item" (click)="openMobileCreateSheet()">
                <mat-icon>add</mat-icon>
              </button>
            } @else if (item.kind === 'profile') {
              <button
                class="mobile-nav-item avatar-item"
                [class.active]="isProfileRoute()"
                (click)="openMobileProfileSheet()"
              >
                @if (user()?.avatar) {
                  <img
                    class="mobile-nav-avatar"
                    [src]="user()!.avatar"
                    [alt]="user()!.name || 'Profile'"
                  />
                } @else {
                  <mat-icon>{{ item.icon }}</mat-icon>
                }
                <span>{{ item.label }}</span>
              </button>
            } @else {
              <a
                class="mobile-nav-item"
                [routerLink]="item.route!"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: !!item.exact }"
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
        background: linear-gradient(90deg, var(--dw-text-primary), var(--dw-primary), var(--dw-text-primary));
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
          border-radius: 22px;
          padding: 8px 6px;
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 2px;
        }

        .mobile-nav-item {
          border: none;
          background: transparent;
          min-height: 56px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          color: var(--dw-text-secondary);
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          transition: all var(--dw-transition-fast);

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }

          &.active {
            background: var(--dw-surface-card);
            color: var(--dw-primary);
          }
        }

        .mobile-nav-avatar {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          object-fit: cover;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
        }

        .mobile-nav-item.avatar-item.active .mobile-nav-avatar {
          box-shadow: 0 0 0 2px var(--dw-primary);
        }

        .mobile-nav-item.create-item {
          background: var(--dw-gradient-primary);
          color: #fff;
          border-radius: 999px;
          width: 54px;
          height: 54px;
          min-height: 54px;
          justify-self: center;
          align-self: center;
          // transform: translateY(-4px);
          box-shadow: var(--dw-shadow-glow);
        }

        .mobile-nav-item.create-item span {
          display: none;
        }

        .mobile-nav-item.create-item mat-icon {
          font-size: 26px;
          width: 26px;
          height: 26px;
        }
      }
    `,
  ],
})
export class App {
  private authService = inject(AuthService);
  private router = inject(Router);
  private bottomSheet = inject(MatBottomSheet);

  user = this.authService.user;
  sidebarCollapsed = signal(false);
  mobileMenuOpen = signal(false);
  isMobile = signal(false);
  isRouteLoading = signal(false);
  showLayout = signal(true);
  currentUrl = signal('/');
  mobileNavItems: Array<{
    icon: string;
    label: string;
    kind: 'route' | 'profile' | 'create';
    route?: string;
    exact?: boolean;
  }> = [
    { icon: 'dashboard', label: 'Home', kind: 'route', route: '/', exact: true },
    { icon: 'checkroom', label: 'Wardrobe', kind: 'route', route: '/wardrobe', exact: false },
    { icon: 'add', label: 'Create', kind: 'create' },
    { icon: 'style', label: 'Outfits', kind: 'route', route: '/outfits', exact: false },
    { icon: 'person', label: 'Me', kind: 'profile', route: '/profile', exact: false },
  ];

  private noLayoutRoutes = ['/login', '/signup'];
  private loaderTimer: ReturnType<typeof setTimeout> | null = null;
  private loadingStartedAt = 0;
  private readonly minLoaderMs = 240;

  constructor() {
    this.syncViewportState();
    window.addEventListener('resize', () => this.syncViewportState());

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loadingStartedAt = Date.now();
        this.setRouteLoading(true);
        return;
      }

      if (event instanceof NavigationEnd) {
        this.showLayout.set(!this.noLayoutRoutes.includes(event.urlAfterRedirects));
        this.mobileMenuOpen.set(false);
        this.currentUrl.set(event.urlAfterRedirects);
        this.finishLoading();
        return;
      }

      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.finishLoading();
      }
    });
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

  isProfileRoute(): boolean {
    return this.currentUrl().startsWith('/profile');
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
    this.bottomSheet.open(MobileCreateSheetComponent, {
      panelClass: 'dw-mobile-profile-sheet',
      backdropClass: 'dw-mobile-sheet-backdrop',
    });
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
}
