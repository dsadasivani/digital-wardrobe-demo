import { CommonModule, DOCUMENT } from '@angular/common';
import {
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  Renderer2,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { User } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-header',
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatButtonToggleModule,
  ],
  template: `
    <header class="header glass">
      <div class="header-left">
        @if (!isMobileView()) {
          <button
            class="menu-toggle icon-btn"
            (click)="toggleSidebar.emit()"
            matTooltip="Toggle sidebar"
          >
            <mat-icon>menu</mat-icon>
          </button>
        }

        <a routerLink="/" class="logo">
          <div class="logo-icon">
            <mat-icon>checkroom</mat-icon>
          </div>
          <span class="logo-text">Digital Wardrobe</span>
        </a>
      </div>

      <div class="header-center">
        <div class="search-box">
          <mat-icon class="search-icon">search</mat-icon>
          <input
            type="text"
            placeholder="Search your wardrobe..."
            class="search-input"
            (input)="onSearch($event)"
          />
        </div>
      </div>

      <div class="header-right">
        <button class="icon-btn notification-btn" matTooltip="Notifications">
          <mat-icon matBadge="3" matBadgeColor="accent" matBadgeSize="small"
            >notifications</mat-icon
          >
        </button>

        <button class="icon-btn add-item-btn" matTooltip="Add item" routerLink="/wardrobe/add">
          <mat-icon>add</mat-icon>
        </button>

        @if (isMobileView()) {
          <button class="user-avatar" (click)="openMobileProfileMenu.emit()" matTooltip="Account">
            @if (user()?.avatar) {
              <img [src]="user()!.avatar" [alt]="user()!.name" class="avatar-img" />
            } @else {
              <mat-icon>account_circle</mat-icon>
            }
          </button>
        } @else {
          <button class="user-avatar" [matMenuTriggerFor]="userMenu" matTooltip="Account">
            @if (user()?.avatar) {
              <img [src]="user()!.avatar" [alt]="user()!.name" class="avatar-img" />
            } @else {
              <mat-icon>account_circle</mat-icon>
            }
          </button>

          <mat-menu #userMenu="matMenu" xPosition="before" class="user-menu-custom">
            <div class="menu-user-info" (click)="$event.stopPropagation()">
              <div class="info-avatar">
                @if (user()?.avatar) {
                  <img [src]="user()!.avatar" [alt]="user()!.name" />
                } @else {
                  <mat-icon>account_circle</mat-icon>
                }
              </div>
              <div class="info-content">
                <span class="user-name">{{ user()?.name }}</span>
                <span class="user-email">{{ user()?.email }}</span>
                <span class="user-plan badge badge-accent">Premium</span>
              </div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person_outline</mat-icon>
              <span>My Profile</span>
            </button>

            <div class="theme-element" (click)="$event.stopPropagation()">
              <div class="theme-label">
                <mat-icon>{{ isDarkMode() ? 'dark_mode' : 'light_mode' }}</mat-icon>
                <span>Appearance</span>
              </div>
              <mat-button-toggle-group
                [value]="isDarkMode() ? 'dark' : 'light'"
                hideSingleSelectionIndicator="true"
                (change)="onThemeChange($event)"
                class="theme-toggles"
              >
                <mat-button-toggle value="light" matTooltip="Light Mode">
                  <mat-icon>wb_sunny</mat-icon>
                </mat-button-toggle>
                <mat-button-toggle value="dark" matTooltip="Dark Mode">
                  <mat-icon>dark_mode</mat-icon>
                </mat-button-toggle>
              </mat-button-toggle-group>
            </div>

            <button mat-menu-item>
              <mat-icon>settings</mat-icon>
              <span>Settings</span>
            </button>
            <button mat-menu-item>
              <mat-icon>help_outline</mat-icon>
              <span>Help & Support</span>
            </button>
            <mat-divider></mat-divider>
            <button mat-menu-item (click)="logout()" class="logout-item">
              <mat-icon>logout</mat-icon>
              <span>Sign Out</span>
            </button>
          </mat-menu>
        }
      </div>
    </header>
  `,
  styles: [
    `
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: var(--dw-header-height);
        padding: 0 var(--dw-spacing-lg);
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        border-bottom: 1px solid var(--dw-border-subtle);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--dw-spacing-md);
      }

      .logo {
        display: flex;
        align-items: center;
        gap: var(--dw-spacing-sm);
        text-decoration: none;
        color: var(--dw-text-primary);
      }

      .logo-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--dw-gradient-primary);
        border-radius: var(--dw-radius-md);

        mat-icon {
          color: white;
          font-size: 22px;
          width: 22px;
          height: 22px;
        }
      }

      .logo-text {
        font-family: 'Outfit', sans-serif;
        font-size: 1.25rem;
        font-weight: 600;
        background: var(--dw-gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .header-center {
        flex: 1;
        max-width: 500px;
        margin: 0 var(--dw-spacing-xl);
      }

      .search-box {
        display: flex;
        align-items: center;
        background: var(--dw-surface-card);
        border-radius: var(--dw-radius-full);
        padding: var(--dw-spacing-sm) var(--dw-spacing-md);
        border: 1px solid transparent;
        transition: all var(--dw-transition-fast);

        &:focus-within {
          border-color: var(--dw-primary);
          box-shadow: 0 0 0 3px var(--dw-primary-glow);
        }
      }

      .search-icon {
        color: var(--dw-text-muted);
        font-size: 20px;
        margin-right: var(--dw-spacing-sm);
      }

      .search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        color: var(--dw-text-primary);
        font-size: 14px;

        &::placeholder {
          color: var(--dw-text-muted);
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: var(--dw-spacing-sm);
      }

      .user-avatar {
        width: 42px;
        height: 42px;
        padding: 0;
        border: none;
        background: var(--dw-surface-card);
        border-radius: 50%;
        box-shadow: 0 0 0 2px var(--dw-surface-card);
        cursor: pointer;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--dw-transition-fast);

        &:hover {
          box-shadow:
            0 0 0 2px var(--dw-surface-card),
            0 0 0 4px var(--dw-primary);
        }

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      }

      .avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .theme-element {
        padding: 0 16px;
        min-height: 48px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;

        .theme-label {
          display: flex;
          align-items: center;
          gap: 16px;
          color: var(--dw-text-primary);
          font-family: 'Outfit', sans-serif;
          font-weight: 500;

          mat-icon {
            color: var(--dw-text-muted);
            margin-right: 0;
          }
        }

        mat-button-toggle-group {
          height: 36px;
          align-items: center;
          border: 1px solid var(--dw-border-subtle);
          border-radius: 20px;
          background: var(--dw-surface-hover);
          padding: 2px;

          mat-button-toggle {
            width: 40px;
            height: 32px;
            border-radius: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: none;

            ::ng-deep .mat-button-toggle-label-content {
              padding: 0 !important;
              display: flex;
              align-items: center;
              justify-content: center;
              line-height: 1;
            }

            mat-icon {
              font-size: 20px;
              width: 20px;
              height: 20px;
              margin: 0;
              color: var(--dw-text-muted);
              transition: color 0.2s;
            }

            &.mat-button-toggle-checked {
              background-color: var(--dw-surface-elevated);
              box-shadow: var(--dw-shadow-sm);

              mat-icon {
                color: var(--dw-accent);
                transform: scale(1.1);
              }
            }
          }
        }
      }

      @media (max-width: 768px) {
        .header {
          padding: 0 10px;
        }

        .icon-btn,
        .user-avatar {
          width: 42px;
          height: 42px;
        }

        .header-right {
          gap: 4px;
        }

        .logo-text {
          display: inline-block;
          font-size: 0.9rem;
          line-height: 1.05;
          white-space: normal;
          max-width: 86px;
        }

        .notification-btn {
          display: none;
        }

        .add-item-btn {
          display: none;
        }

        .header-center {
          display: none;
        }
      }
    `,
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private static readonly THEME_STORAGE_KEY = 'dw-theme';
  private authService = inject(AuthService);
  private router = inject(Router);
  private renderer = inject(Renderer2);
  private document = inject(DOCUMENT);
  private readonly resizeHandler = () => this.syncMobileState();

  toggleSidebar = output<void>();
  openMobileProfileMenu = output<void>();
  user = input.required<User | null>();
  isDarkMode = signal(false);
  isMobileView = signal(false);

  ngOnInit(): void {
    this.syncMobileState();
    window.addEventListener('resize', this.resizeHandler);
    const savedTheme = this.readStoredTheme();
    if (savedTheme === 'dark') {
      this.setTheme(true);
      return;
    }
    if (savedTheme === 'light') {
      this.setTheme(false);
      return;
    }
    this.isDarkMode.set(this.document.body.getAttribute('data-theme') === 'dark');
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  onSearch(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
  }

  onThemeChange(event: MatButtonToggleChange): void {
    const isDark = event.value === 'dark';
    this.setTheme(isDark);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private setTheme(isDark: boolean): void {
    this.isDarkMode.set(isDark);
    if (isDark) {
      this.renderer.setAttribute(this.document.body, 'data-theme', 'dark');
    } else {
      this.renderer.removeAttribute(this.document.body, 'data-theme');
    }
    this.storeTheme(isDark ? 'dark' : 'light');
  }

  private readStoredTheme(): 'dark' | 'light' | null {
    try {
      const saved = window.sessionStorage.getItem(HeaderComponent.THEME_STORAGE_KEY);
      return saved === 'dark' || saved === 'light' ? saved : null;
    } catch {
      return null;
    }
  }

  private storeTheme(theme: 'dark' | 'light'): void {
    try {
      window.sessionStorage.setItem(HeaderComponent.THEME_STORAGE_KEY, theme);
    } catch {
      // No-op if storage is blocked.
    }
  }

  private syncMobileState(): void {
    this.isMobileView.set(window.innerWidth <= 768);
  }
}
