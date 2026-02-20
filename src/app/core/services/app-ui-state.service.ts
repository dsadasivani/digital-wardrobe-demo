import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';

export interface MobileNavItem {
  icon: string;
  label: string;
  kind: 'route' | 'create';
  route?: string;
  exact?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AppUiStateService {
  private router = inject(Router);
  private document = inject(DOCUMENT);

  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly isMobile = signal(false);
  readonly isRouteLoading = signal(false);
  readonly hasCompletedInitialNavigation = signal(false);
  readonly initialRouteLoading = computed(
    () => this.isRouteLoading() && !this.hasCompletedInitialNavigation(),
  );
  readonly showLayout = signal(true);
  readonly currentUrl = signal('/');
  readonly createMenuOpen = signal(false);
  readonly mobileNavItems: MobileNavItem[] = [
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
  private skipNextRouteLoading = false;
  private nextScrollBehavior: ScrollBehavior = 'auto';
  private readonly resizeHandler = () => this.syncViewportState();
  private routerEventsSubscription: Subscription | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.syncViewportState();
    this.currentUrl.set(this.router.url);
    window.addEventListener('resize', this.resizeHandler);

    this.routerEventsSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.skipNextRouteLoading) {
          this.skipNextRouteLoading = false;
          this.setRouteLoading(false);
          return;
        }
        this.loadingStartedAt = Date.now();
        this.setRouteLoading(true);
        return;
      }

      if (event instanceof NavigationEnd) {
        this.hasCompletedInitialNavigation.set(true);
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
        this.hasCompletedInitialNavigation.set(true);
        this.finishLoading();
      }
    });
  }

  destroy(): void {
    if (!this.initialized) {
      return;
    }
    window.removeEventListener('resize', this.resizeHandler);
    this.routerEventsSubscription?.unsubscribe();
    this.routerEventsSubscription = null;
    if (this.loaderTimer) {
      clearTimeout(this.loaderTimer);
      this.loaderTimer = null;
    }
    this.initialized = false;
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.mobileMenuOpen.set(!this.mobileMenuOpen());
      return;
    }
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  openCreateMenu(): void {
    this.createMenuOpen.set(true);
  }

  closeCreateMenu(): void {
    this.createMenuOpen.set(false);
  }

  toggleCreateMenu(event: Event): void {
    event.stopPropagation();
    this.createMenuOpen.set(!this.createMenuOpen());
  }

  async navigateFromCreateMenu(route: '/wardrobe/add' | '/accessories/add'): Promise<void> {
    this.createMenuOpen.set(false);
    await this.router.navigate([route]);
  }

  suppressNextRouteLoader(): void {
    this.skipNextRouteLoading = true;
  }

  onMobileNavTap(route: string, exact: boolean): void {
    this.createMenuOpen.set(false);
    this.scrollToTopOnNavTap(route, exact);
  }

  private scrollToTopOnNavTap(route: string, exact: boolean): void {
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
}
