import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import { AuthService, LoadingService } from './core/services';
import { AppUiStateService } from './core/services/app-ui-state.service';
import { ThemeService } from './core/services/theme.service';
import { MobileBottomNavComponent } from './shared/components/mobile-bottom-nav/mobile-bottom-nav.component';
import {
  MobileProfileSheetComponent,
  MobileProfileSheetData,
} from './shared/components/mobile-profile-sheet/mobile-profile-sheet.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatIconModule,
    MatBottomSheetModule,
    HeaderComponent,
    SidebarComponent,
    MobileBottomNavComponent,
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

      @if (isMobile()) {
        <dw-mobile-bottom-nav
          [createMenuOpen]="createMenuOpen()"
          [navItems]="mobileNavItems"
          (createMenuClosed)="closeCreateMenu()"
          (createMenuToggled)="toggleCreateMenu($event)"
          (createNavigate)="navigateFromCreateMenu($event)"
          (navTapped)="onMobileNavTap($event.route, $event.exact)"
        ></dw-mobile-bottom-nav>
      }
    } @else {
      <router-outlet></router-outlet>
    }

    @if (showLoader()) {
      <div class="route-loader-overlay" aria-live="polite" aria-label="Loading page">
        <div class="loader-cosmos" aria-hidden="true">
          <span class="cosmos-item c1"><mat-icon>checkroom</mat-icon></span>
          <span class="cosmos-item c2"><mat-icon>dry_cleaning</mat-icon></span>
          <span class="cosmos-item c3"><mat-icon>style</mat-icon></span>
          <span class="cosmos-item c4"><mat-icon>watch</mat-icon></span>
          <span class="cosmos-item c5"><mat-icon>hiking</mat-icon></span>
          <span class="cosmos-item c6"><mat-icon>local_mall</mat-icon></span>
          <span class="cosmos-item c7"><mat-icon>checkroom</mat-icon></span>
          <span class="cosmos-item c8"><mat-icon>style</mat-icon></span>
          <span class="cosmos-item c9"><mat-icon>dry_cleaning</mat-icon></span>
          <span class="cosmos-item c10"><mat-icon>watch</mat-icon></span>
          <span class="cosmos-item c11"><mat-icon>hiking</mat-icon></span>
          <span class="cosmos-item c12"><mat-icon>local_mall</mat-icon></span>
          <span class="cosmos-item c13"><mat-icon>checkroom</mat-icon></span>
          <span class="cosmos-item c14"><mat-icon>style</mat-icon></span>
          <span class="cosmos-item c15"><mat-icon>watch</mat-icon></span>
          <span class="cosmos-item c16"><mat-icon>dry_cleaning</mat-icon></span>
          <span class="cosmos-item c17"><mat-icon>hiking</mat-icon></span>
          <span class="cosmos-item c18"><mat-icon>local_mall</mat-icon></span>
        </div>
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
        background: var(--dw-overlay-scrim);
        backdrop-filter: blur(2px);
        opacity: 0;
        pointer-events: none;
        transition: opacity var(--dw-transition-fast);

        &.visible {
          opacity: 1;
          pointer-events: auto;
        }
      }

      .route-loader-overlay {
        position: fixed;
        inset: 0;
        z-index: 1200;
        display: grid;
        place-items: center;
        background:
          radial-gradient(
            circle at 14% 18%,
            color-mix(in srgb, var(--dw-accent) 22%, transparent) 0%,
            transparent 36%
          ),
          radial-gradient(
            circle at 84% 22%,
            color-mix(in srgb, var(--dw-primary) 24%, transparent) 0%,
            transparent 40%
          ),
          radial-gradient(
            circle at 62% 78%,
            color-mix(in srgb, var(--dw-warning) 18%, transparent) 0%,
            transparent 42%
          ),
          radial-gradient(
            circle at 36% 58%,
            color-mix(in srgb, var(--dw-primary-light) 14%, transparent) 0%,
            transparent 46%
          ),
          linear-gradient(
            164deg,
            color-mix(in srgb, var(--dw-surface-base) 24%, #090705 76%) 0%,
            color-mix(in srgb, var(--dw-surface-base) 20%, #130d08 80%) 48%,
            color-mix(in srgb, var(--dw-surface-base) 16%, #1c130d 84%) 100%
          );
        backdrop-filter: blur(10px) saturate(120%);
        -webkit-backdrop-filter: blur(10px) saturate(120%);
        overflow: hidden;
        isolation: isolate;
        animation: fadeIn 180ms var(--dw-ease-emphasis);
      }

      .loader-cosmos {
        position: absolute;
        inset: -8%;
        pointer-events: none;
        z-index: 0;
      }

      .loader-cosmos::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 12% 30%, color-mix(in srgb, white 36%, transparent) 0 1px, transparent 2px),
          radial-gradient(circle at 36% 74%, color-mix(in srgb, white 30%, transparent) 0 1px, transparent 2px),
          radial-gradient(circle at 68% 20%, color-mix(in srgb, white 34%, transparent) 0 1px, transparent 2px),
          radial-gradient(circle at 88% 64%, color-mix(in srgb, white 28%, transparent) 0 1px, transparent 2px),
          radial-gradient(circle at 46% 46%, color-mix(in srgb, white 24%, transparent) 0 1px, transparent 2px),
          radial-gradient(circle at 72% 84%, color-mix(in srgb, white 20%, transparent) 0 1px, transparent 2px),
          radial-gradient(circle at 22% 62%, color-mix(in srgb, white 18%, transparent) 0 1px, transparent 2px);
        opacity: 0.76;
        animation: starlightPulse 6.8s ease-in-out infinite;
      }

      .loader-cosmos::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          118deg,
          transparent 0%,
          color-mix(in srgb, var(--dw-primary) 16%, transparent) 48%,
          transparent 74%
        );
        transform: translateX(-120%);
        animation: cosmosSweep 7.8s ease-in-out infinite;
        opacity: 0.42;
      }

      .cosmos-item {
        position: absolute;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: color-mix(in srgb, var(--dw-primary-light) 72%, var(--dw-on-primary) 28%);
        opacity: 0.64;
        filter: drop-shadow(0 6px 14px color-mix(in srgb, var(--dw-primary) 48%, transparent));
        animation: clothesDrift 22s ease-in-out infinite;
      }

      .cosmos-item mat-icon {
        font-size: 26px;
        width: 26px;
        height: 26px;
      }

      .cosmos-item:nth-child(odd) mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .c1 {
        top: 9%;
        left: 6%;
        animation-delay: -0.4s;
      }
      .c2 {
        top: 18%;
        right: 10%;
        animation-delay: -1.2s;
      }
      .c3 {
        top: 34%;
        left: 18%;
        animation-delay: -2.2s;
      }
      .c4 {
        top: 42%;
        right: 22%;
        animation-delay: -3.1s;
      }
      .c5 {
        top: 57%;
        left: 8%;
        animation-delay: -4s;
      }
      .c6 {
        top: 62%;
        right: 12%;
        animation-delay: -5.1s;
      }
      .c7 {
        top: 74%;
        left: 24%;
        animation-delay: -6.2s;
      }
      .c8 {
        top: 12%;
        left: 42%;
        animation-delay: -7.1s;
      }
      .c9 {
        top: 24%;
        right: 36%;
        animation-delay: -8.4s;
      }
      .c10 {
        top: 48%;
        left: 38%;
        animation-delay: -9.6s;
      }
      .c11 {
        top: 72%;
        right: 34%;
        animation-delay: -10.3s;
      }
      .c12 {
        top: 82%;
        right: 6%;
        animation-delay: -11.4s;
      }
      .c13 {
        top: 6%;
        left: 28%;
        animation-delay: -12.3s;
      }
      .c14 {
        top: 16%;
        right: 48%;
        animation-delay: -13.1s;
      }
      .c15 {
        top: 38%;
        left: 58%;
        animation-delay: -14.2s;
      }
      .c16 {
        top: 52%;
        right: 4%;
        animation-delay: -15.3s;
      }
      .c17 {
        top: 66%;
        left: 46%;
        animation-delay: -16.2s;
      }
      .c18 {
        top: 88%;
        left: 14%;
        animation-delay: -17.4s;
      }

      .wardrobe-loader {
        position: relative;
        z-index: 2;
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
        color: var(--dw-on-primary);
        background: var(--dw-gradient-primary);
        box-shadow: var(--dw-shadow-md);
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
        box-shadow: 0 2px 10px -6px color-mix(in srgb, var(--dw-primary) 55%, transparent);
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

      @keyframes clothesDrift {
        0%,
        100% {
          transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
        }
        30% {
          transform: translate3d(12px, -14px, 0) rotate(8deg) scale(1.05);
        }
        60% {
          transform: translate3d(-10px, 12px, 0) rotate(-7deg) scale(0.96);
        }
      }

      @keyframes starlightPulse {
        0%,
        100% {
          opacity: 0.62;
        }
        50% {
          opacity: 0.9;
        }
      }

      @keyframes cosmosSweep {
        0% {
          transform: translateX(-120%);
        }
        100% {
          transform: translateX(120%);
        }
      }

      @media (max-width: 768px) {
        .loader-cosmos {
          inset: -14%;
        }

        .cosmos-item {
          opacity: 0.56;
        }

        .cosmos-item mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }

        .cosmos-item:nth-child(odd) mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }

        .main-content {
          margin-left: 0;

          &.mobile-nav-spaced {
            padding-bottom: calc(var(--dw-mobile-nav-height) + var(--dw-safe-bottom) + 12px);
          }
        }
      }
    `,
  ],
})
export class App implements OnInit, OnDestroy {
  loadingService = inject(LoadingService);
  private authService = inject(AuthService);
  private uiState = inject(AppUiStateService);
  private themeService = inject(ThemeService);
  private bottomSheet = inject(MatBottomSheet);

  user = this.authService.user;
  authenticated = this.authService.authenticated;
  sidebarCollapsed = this.uiState.sidebarCollapsed;
  mobileMenuOpen = this.uiState.mobileMenuOpen;
  isMobile = this.uiState.isMobile;
  initialRouteLoading = this.uiState.initialRouteLoading;
  showLoader = computed(() => this.loadingService.isLoading() || this.initialRouteLoading());
  showLayout = this.uiState.showLayout;
  createMenuOpen = this.uiState.createMenuOpen;
  mobileNavItems = this.uiState.mobileNavItems;

  ngOnInit(): void {
    this.themeService.applySavedTheme();
    this.uiState.init();
  }

  ngOnDestroy(): void {
    this.uiState.destroy();
  }

  onToggleSidebar(): void {
    this.uiState.toggleSidebar();
  }

  closeMobileMenu(): void {
    this.uiState.closeMobileMenu();
  }

  openMobileProfileSheet(): void {
    this.bottomSheet.open(MobileProfileSheetComponent, {
      data: {
        user: this.user(),
      } as MobileProfileSheetData,
      panelClass: 'dw-mobile-profile-sheet',
      backdropClass: 'dw-mobile-sheet-backdrop',
    });
  }

  openMobileCreateSheet(): void {
    this.uiState.openCreateMenu();
  }

  closeCreateMenu(): void {
    this.uiState.closeCreateMenu();
  }

  toggleCreateMenu(event: Event): void {
    this.uiState.toggleCreateMenu(event);
  }

  async navigateFromCreateMenu(route: '/wardrobe/add' | '/accessories/add'): Promise<void> {
    await this.uiState.navigateFromCreateMenu(route);
  }

  onMobileNavTap(route: string, exact: boolean): void {
    this.uiState.onMobileNavTap(route, exact);
  }
}
