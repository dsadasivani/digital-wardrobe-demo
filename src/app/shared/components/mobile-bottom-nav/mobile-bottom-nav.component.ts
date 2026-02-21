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
          <button
            class="mobile-nav-item create-item"
            type="button"
            [class.open]="createMenuOpen()"
            [attr.aria-label]="createMenuOpen() ? 'Close create menu' : 'Open create menu'"
            (click)="onCreateToggle($event)"
          >
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
        --dw-mobile-nav-create-gradient: linear-gradient(
          145deg,
          color-mix(in srgb, var(--dw-primary-dark) 82%, #ffffff 18%) 0%,
          var(--dw-primary) 44%,
          color-mix(in srgb, var(--dw-accent) 64%, var(--dw-primary) 36%) 100%
        );
        --dw-mobile-nav-create-border: color-mix(in srgb, var(--dw-on-primary) 56%, transparent);
        --dw-mobile-nav-create-shadow:
          0 16px 32px color-mix(in srgb, var(--dw-primary-dark) 30%, transparent),
          0 8px 16px color-mix(in srgb, var(--dw-accent) 18%, transparent);
        --dw-mobile-nav-create-halo: color-mix(in srgb, var(--dw-accent) 56%, transparent);
        --dw-mobile-nav-create-focus: color-mix(in srgb, var(--dw-primary) 34%, transparent);
      }

      :host-context(body[data-theme='dark']) {
        --dw-mobile-nav-fg: var(--dw-text-secondary);
        --dw-mobile-nav-active-fg: var(--dw-primary-light);
        --dw-mobile-nav-active-icon: var(--dw-primary-light);
        --dw-mobile-nav-active-dot: var(--dw-accent-light);
        --dw-mobile-nav-create-fg: var(--dw-on-primary);
        --dw-mobile-nav-create-gradient: linear-gradient(
          145deg,
          color-mix(in srgb, var(--dw-primary-dark) 58%, #f4d8b7 42%) 0%,
          color-mix(in srgb, var(--dw-primary) 72%, #ffe5c7 28%) 50%,
          color-mix(in srgb, var(--dw-accent) 68%, #ffe5c8 32%) 100%
        );
        --dw-mobile-nav-create-border: color-mix(in srgb, #fff0de 36%, transparent);
        --dw-mobile-nav-create-shadow:
          0 18px 34px color-mix(in srgb, #000 58%, transparent),
          0 10px 24px color-mix(in srgb, var(--dw-accent) 24%, transparent);
        --dw-mobile-nav-create-halo: color-mix(in srgb, var(--dw-accent-light) 62%, transparent);
        --dw-mobile-nav-create-focus: color-mix(in srgb, var(--dw-primary-light) 34%, transparent);
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
        position: relative;
        isolation: isolate;
        overflow: visible;
        background: var(--dw-mobile-nav-create-gradient);
        border: 1px solid var(--dw-mobile-nav-create-border);
        color: var(--dw-mobile-nav-create-fg);
        box-shadow: var(--dw-mobile-nav-create-shadow);
        transition:
          transform 180ms var(--dw-ease-emphasis),
          box-shadow 180ms var(--dw-ease-emphasis);
      }

      .mobile-nav-item.create-item::before {
        content: '';
        position: absolute;
        inset: -5px;
        border-radius: inherit;
        z-index: -2;
        background:
          radial-gradient(
            circle at 50% 45%,
            color-mix(in srgb, white 28%, transparent) 0%,
            transparent 56%
          ),
          radial-gradient(
            circle at 50% 50%,
            var(--dw-mobile-nav-create-halo) 0%,
            transparent 72%
          );
        opacity: 0.9;
        pointer-events: none;
      }

      .mobile-nav-item.create-item::after {
        content: '';
        position: absolute;
        inset: 3px;
        border-radius: inherit;
        z-index: -1;
        background: linear-gradient(
          158deg,
          color-mix(in srgb, white 24%, transparent) 0%,
          color-mix(in srgb, white 4%, transparent) 40%,
          transparent 78%
        );
        opacity: 0.8;
        pointer-events: none;
      }

      .mobile-nav-item.create-item mat-icon {
        font-size: 31px;
        width: 31px;
        height: 31px;
        color: var(--dw-mobile-nav-create-fg);
        filter: drop-shadow(0 1px 0 color-mix(in srgb, #000 16%, transparent));
        transition: transform 220ms var(--dw-ease-emphasis);
      }

      .mobile-nav-item.create-item.open mat-icon {
        transform: rotate(135deg);
      }

      .mobile-nav-item.create-item.open {
        transform: translateY(-1px) scale(1.02);
        box-shadow:
          0 18px 34px color-mix(in srgb, var(--dw-primary-dark) 35%, transparent),
          0 0 0 6px color-mix(in srgb, var(--dw-mobile-nav-create-halo) 24%, transparent);
      }

      .mobile-nav-item.create-item.open::before {
        animation: createHaloPulse 1.4s ease-in-out infinite;
      }

      .mobile-nav-item.create-item span {
        display: none;
      }

      .mobile-nav-item.create-item:active {
        transform: translateY(1px) scale(0.95);
      }

      .mobile-nav-item.create-item:focus-visible {
        outline: 2px solid var(--dw-mobile-nav-create-focus);
        outline-offset: 3px;
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

      @keyframes createHaloPulse {
        0% {
          transform: scale(0.98);
          opacity: 0.7;
        }
        50% {
          transform: scale(1.04);
          opacity: 1;
        }
        100% {
          transform: scale(0.98);
          opacity: 0.7;
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
