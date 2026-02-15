import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MobileNavItem } from '../../../core/services/app-ui-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-mobile-bottom-nav',
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    @if (createMenuOpen()) {
      <button class="mobile-create-backdrop" aria-label="Close create menu" (click)="createMenuClosed.emit()"></button>
    }
    <nav class="mobile-bottom-nav glass" (click)="createMenuClosed.emit()">
      @if (createMenuOpen()) {
        <div class="mobile-create-popup glass" (click)="$event.stopPropagation()">
          <button class="create-popup-option" type="button" (click)="createNavigate.emit('/wardrobe/add')">
            <span class="option-icon"><mat-icon>checkroom</mat-icon></span>
            <span class="option-content">
              <span class="option-label">Item</span>
              <small>Add wardrobe piece</small>
            </span>
          </button>
          <button class="create-popup-option" type="button" (click)="createNavigate.emit('/accessories/add')">
            <span class="option-icon"><mat-icon>watch</mat-icon></span>
            <span class="option-content">
              <span class="option-label">Accessory</span>
              <small>Add bags, watches, jewelry</small>
            </span>
          </button>
        </div>
      }
      @for (item of navItems(); track item.label) {
        @if (item.kind === 'create') {
          <button class="mobile-nav-item create-item" [class.open]="createMenuOpen()" (click)="onCreateToggle($event)">
            <mat-icon>add</mat-icon>
          </button>
        } @else {
          <a
            class="mobile-nav-item"
            [routerLink]="item.route!"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: !!item.exact }"
            (click)="navTapped.emit({ route: item.route!, exact: !!item.exact })"
          >
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      }
    </nav>
  `,
  styles: [
    `
      :host {
        --dw-mobile-nav-fg: var(--dw-text-secondary);
        --dw-mobile-nav-active-fg: var(--dw-text-primary);
        --dw-mobile-nav-active-icon: var(--dw-primary);
        --dw-mobile-nav-active-dot: var(--dw-accent);
        --dw-mobile-nav-create-fg: var(--dw-on-primary);
      }

      :host-context(body[data-theme='dark']) {
        --dw-mobile-nav-fg: var(--dw-text-secondary);
        --dw-mobile-nav-active-fg: var(--dw-primary-light);
        --dw-mobile-nav-active-icon: var(--dw-primary-light);
        --dw-mobile-nav-active-dot: var(--dw-accent-light);
        --dw-mobile-nav-create-fg: var(--dw-on-primary);
      }

      .mobile-create-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1115;
        border: none;
        background: var(--dw-overlay-scrim);
        backdrop-filter: blur(3px);
      }

      .mobile-create-popup {
        position: fixed;
        left: 50%;
        bottom: calc(var(--dw-mobile-nav-height) + var(--dw-safe-bottom) + 12px);
        transform: translateX(-50%);
        width: min(340px, calc(100vw - 24px));
        z-index: 1135;
        border-radius: 20px;
        border: 1px solid var(--dw-border-strong);
        background: var(--dw-gradient-card);
        box-shadow: var(--dw-shadow-lg);
        padding: 12px;
        animation: createPopupIn 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      .create-popup-option {
        width: 100%;
        border: none;
        background: transparent;
        border-radius: 14px;
        min-height: 58px;
        display: flex;
        align-items: center;
        gap: 12px;
        text-align: left;
        padding: 10px;
        color: var(--dw-text-primary);
      }

      .create-popup-option + .create-popup-option {
        margin-top: 6px;
      }

      .create-popup-option:hover {
        background: var(--dw-surface-hover);
      }

      .option-icon {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--dw-surface-elevated);
        color: var(--dw-text-primary);
      }

      .option-content {
        display: flex;
        flex-direction: column;
      }

      .option-label {
        font-weight: 600;
      }

      .option-content small {
        color: var(--dw-text-secondary);
        font-size: 12px;
      }

      .mobile-bottom-nav {
        position: fixed;
        left: 14px;
        right: 14px;
        bottom: calc(var(--dw-safe-bottom) + 10px);
        height: var(--dw-mobile-nav-height);
        border-radius: 26px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        gap: 6px;
        padding: 10px 10px 8px;
        z-index: 1120;
        border: 1px solid var(--dw-border-subtle);
      }

      .mobile-bottom-nav::before {
        content: '';
        position: absolute;
        left: 22px;
        right: 22px;
        top: 0;
        height: 1px;
        border-radius: 999px;
        background: linear-gradient(
          90deg,
          transparent,
          color-mix(in srgb, var(--dw-primary) 36%, transparent),
          transparent
        );
        opacity: 0.68;
        pointer-events: none;
      }

      .mobile-nav-item {
        position: relative;
        border: none;
        background: transparent;
        text-decoration: none;
        flex: 1;
        max-width: 84px;
        min-height: 54px;
        border-radius: 16px;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        color: var(--dw-mobile-nav-fg);
      }

      .mobile-nav-item mat-icon {
        width: 23px;
        height: 23px;
        font-size: 23px;
      }

      .mobile-nav-item span {
        font-size: 11px;
        font-weight: 600;
      }

      .mobile-nav-item.active {
        color: var(--dw-mobile-nav-active-fg);
      }

      .mobile-nav-item.active mat-icon {
        color: var(--dw-mobile-nav-active-icon);
      }

      .mobile-nav-item.active::after {
        content: '';
        position: absolute;
        bottom: 5px;
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--dw-mobile-nav-active-dot);
      }

      .mobile-nav-item.create-item {
        width: 62px;
        height: 62px;
        max-width: 62px;
        border-radius: 50%;
        padding: 0;
        margin-top: -22px;
        background: var(--dw-gradient-primary);
        color: var(--dw-mobile-nav-create-fg);
        box-shadow: var(--dw-shadow-md);
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
    `,
  ],
})
export class MobileBottomNavComponent {
  createMenuOpen = input(false);
  navItems = input<MobileNavItem[]>([]);

  createMenuToggled = output<Event>();
  createMenuClosed = output();
  createNavigate = output<'/wardrobe/add' | '/accessories/add'>();
  navTapped = output<{ route: string; exact: boolean }>();

  onCreateToggle(event: Event): void {
    event.stopPropagation();
    this.createMenuToggled.emit(event);
  }
}
