import { CommonModule } from '@angular/common';
import {Component, input, output, ChangeDetectionStrategy} from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule, MatDividerModule],
  template: `
    <aside class="sidebar" [class.collapsed]="collapsed()" [class.mobile-open]="mobileOpen()">
      <nav class="nav-menu">
        <div class="nav-section">
          <span class="nav-section-title" [class.hidden]="collapsed()">Main</span>

          @for (item of mainNavItems; track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: item.route === '/' }"
              (click)="onNavItemClick()"
              [matTooltip]="collapsed() ? item.label : ''"
              matTooltipPosition="right">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label" [class.hidden]="collapsed()">{{ item.label }}</span>
              @if (item.badge) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            </a>
          }
        </div>

        <mat-divider></mat-divider>

        <div class="nav-section">
          <span class="nav-section-title" [class.hidden]="collapsed()">Create</span>

          @for (item of createNavItems; track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              (click)="onNavItemClick()"
              [matTooltip]="collapsed() ? item.label : ''"
              matTooltipPosition="right">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label" [class.hidden]="collapsed()">{{ item.label }}</span>
            </a>
          }
        </div>

        <mat-divider></mat-divider>

        <div class="nav-section">
          <span class="nav-section-title" [class.hidden]="collapsed()">Categories</span>

          @for (item of categoryItems; track item.route) {
            <a
              class="nav-item"
              [routerLink]="item.route"
              routerLinkActive="active"
              (click)="onNavItemClick()"
              [matTooltip]="collapsed() ? item.label : ''"
              matTooltipPosition="right">
              <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
              <span class="nav-label" [class.hidden]="collapsed()">{{ item.label }}</span>
            </a>
          }
        </div>
      </nav>

      <div class="sidebar-footer">
        <button
          class="collapse-btn"
          (click)="toggleCollapse.emit()"
          [matTooltip]="collapsed() ? 'Expand' : 'Collapse'"
          matTooltipPosition="right">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--dw-sidebar-width);
      height: calc(100vh - var(--dw-header-height));
      position: fixed;
      top: var(--dw-header-height);
      left: 0;
      background: var(--dw-surface-elevated);
      border-right: 1px solid var(--dw-border-subtle);
      display: flex;
      flex-direction: column;
      transition: width var(--dw-transition-normal), transform var(--dw-transition-normal);
      z-index: 900;
      overflow-x: hidden;

      &.collapsed {
        width: var(--dw-sidebar-collapsed);

        .nav-menu {
          overflow-y: scroll;
          padding: 8px 0;
          scrollbar-width: none;
          -ms-overflow-style: none;

          &::-webkit-scrollbar {
            display: none;
            width: 0;
            background: transparent;
          }
        }

        .nav-item {
          justify-content: center;
          padding: 12px 0;
          margin: 4px 6px;
        }

        .nav-badge {
          display: none;
        }
      }
    }

    .nav-menu {
      flex: 1;
      padding: var(--dw-spacing-md);
      overflow-y: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .nav-menu::-webkit-scrollbar {
      display: none;
      width: 0;
      background: transparent;
    }

    .nav-section {
      margin-bottom: var(--dw-spacing-md);
    }

    .nav-section-title {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--dw-text-muted);
      padding: var(--dw-spacing-sm) var(--dw-spacing-md);
      margin-bottom: var(--dw-spacing-xs);

      &.hidden {
        opacity: 0;
        height: 0;
        padding: 0;
        margin: 0;
      }
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: var(--dw-spacing-md);
      padding: var(--dw-spacing-sm) var(--dw-spacing-md);
      border-radius: var(--dw-radius-md);
      text-decoration: none;
      color: var(--dw-text-secondary);
      transition: all var(--dw-transition-fast);
      margin-bottom: 4px;
      min-height: 44px;

      &:hover {
        background: var(--dw-surface-card);
        color: var(--dw-text-primary);
      }

      &.active {
        background: color-mix(in srgb, var(--dw-primary) 15%, transparent);
        color: var(--dw-primary);

        .nav-icon {
          color: var(--dw-primary);
        }
      }
    }

    .nav-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      min-width: 24px;
      transition: color var(--dw-transition-fast);
    }

    .nav-label {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      transition: opacity var(--dw-transition-fast);

      &.hidden {
        opacity: 0;
        width: 0;
        overflow: hidden;
      }
    }

    .nav-badge {
      margin-left: auto;
      background: var(--dw-primary);
      color: white;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: var(--dw-radius-full);
    }

    mat-divider {
      margin: var(--dw-spacing-md) 0;
      border-color: var(--dw-border-subtle);
    }

    .sidebar-footer {
      padding: var(--dw-spacing-md);
      border-top: 1px solid var(--dw-border-subtle);
    }

    .collapse-btn {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--dw-surface-card);
      border: none;
      border-radius: var(--dw-radius-md);
      color: var(--dw-text-secondary);
      cursor: pointer;
      transition: all var(--dw-transition-fast);

      &:hover {
        background: var(--dw-primary);
        color: white;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        width: min(84vw, 320px);
        z-index: 1100;
        transform: translateX(-105%);
        box-shadow: var(--dw-shadow-lg);
        border-right: none;
        border-radius: 0 var(--dw-radius-lg) var(--dw-radius-lg) 0;

        &.mobile-open {
          transform: translateX(0);
        }

        &.collapsed {
          width: min(84vw, 320px);
        }
      }

      .sidebar-footer {
        display: none;
      }

      .sidebar .nav-label.hidden {
        opacity: 1;
        width: auto;
        overflow: visible;
      }

      .sidebar .nav-section-title.hidden {
        opacity: 1;
        height: auto;
        padding: var(--dw-spacing-sm) var(--dw-spacing-md);
        margin-bottom: var(--dw-spacing-xs);
      }

      .sidebar.collapsed .nav-item {
        justify-content: flex-start;
        padding: var(--dw-spacing-sm) var(--dw-spacing-md);
        margin: 0 0 4px;
      }

      .sidebar.collapsed .nav-badge {
        display: inline-flex;
      }

      .sidebar.collapsed .nav-menu {
        padding: var(--dw-spacing-md);
        overflow-y: auto;
      }
    }
  `]
})
export class SidebarComponent {
  collapsed = input(false);
  mobileOpen = input(false);
  toggleCollapse = output<void>();
  closeMobile = output<void>();

  mainNavItems: NavItem[] = [
    { icon: 'dashboard', label: 'Dashboard', route: '/' },
    { icon: 'checkroom', label: 'My Wardrobe', route: '/wardrobe' },
    { icon: 'watch', label: 'Accessories', route: '/accessories' },
    { icon: 'style', label: 'Outfits', route: '/outfits', badge: 5 },
    { icon: 'calendar_month', label: 'Calendar', route: '/calendar' },
    { icon: 'brush', label: 'Outfit Canvas', route: '/outfit-canvas' },
  ];

  createNavItems: NavItem[] = [
    { icon: 'add_photo_alternate', label: 'Add Item', route: '/wardrobe/add' },
    { icon: 'add_circle', label: 'New Outfit', route: '/outfit-canvas' },
  ];

  categoryItems: NavItem[] = [
    { icon: 'dry_cleaning', label: 'Tops', route: '/wardrobe/category/tops' },
    { icon: 'straighten', label: 'Bottoms', route: '/wardrobe/category/bottoms' },
    { icon: 'ac_unit', label: 'Outerwear', route: '/wardrobe/category/outerwear' },
    { icon: 'hiking', label: 'Shoes', route: '/wardrobe/category/shoes' },
  ];

  onNavItemClick(): void {
    if (this.mobileOpen()) {
      this.closeMobile.emit();
    }
  }
}
