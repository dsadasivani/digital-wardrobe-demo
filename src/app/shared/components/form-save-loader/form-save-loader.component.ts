import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-form-save-loader',
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      class="dw-form-save-loader"
      [class.create]="variant() === 'create'"
      [class.update]="variant() === 'update'"
      role="status"
      aria-live="polite"
    >
      <span class="dw-form-save-loader-progress" aria-hidden="true"></span>
      <div class="dw-form-save-loader-main">
        <div class="dw-form-save-loader-orbit" aria-hidden="true">
          <span class="ring ring-a"></span>
          <span class="ring ring-b"></span>
          <span class="core"><mat-icon>{{ icon() }}</mat-icon></span>
        </div>
        <div class="dw-form-save-loader-copy">
          <strong>{{ title() }}</strong>
          <span>{{ message() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dw-form-save-loader {
        position: relative;
        overflow: hidden;
        display: inline-flex;
        width: min(100%, 560px);
        border-radius: var(--dw-radius-lg);
        border: 1px solid color-mix(in srgb, var(--dw-primary) 34%, transparent);
        padding: 12px 14px;
        background:
          radial-gradient(
            circle at 84% 18%,
            color-mix(in srgb, var(--dw-accent) 15%, transparent),
            transparent 54%
          ),
          linear-gradient(
            150deg,
            color-mix(in srgb, var(--dw-surface-elevated) 84%, var(--dw-primary) 16%),
            var(--dw-surface-card)
          );
        box-shadow:
          0 2px 10px -7px color-mix(in srgb, var(--dw-primary) 64%, transparent),
          inset 0 1px 0 color-mix(in srgb, var(--dw-on-primary) 16%, transparent);
      }

      .dw-form-save-loader::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          110deg,
          transparent 0%,
          color-mix(in srgb, var(--dw-on-primary) 10%, transparent) 44%,
          transparent 70%
        );
        transform: translateX(-120%);
        animation: dwFormLoaderSheen 2.2s ease-in-out infinite;
        pointer-events: none;
      }

      .dw-form-save-loader-main {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }

      .dw-form-save-loader-orbit {
        position: relative;
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .ring {
        position: absolute;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--dw-primary) 54%, transparent);
      }

      .ring-a {
        inset: 1px;
        animation: dwFormLoaderSpin 1500ms linear infinite;
      }

      .ring-b {
        inset: 10px;
        opacity: 0.76;
        animation: dwFormLoaderSpinReverse 1100ms linear infinite;
      }

      .core {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        color: var(--dw-primary);
        background: color-mix(in srgb, var(--dw-surface-elevated) 82%, var(--dw-primary) 18%);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dw-primary) 24%, transparent);
      }

      .core mat-icon {
        font-size: 13px;
        width: 13px;
        height: 13px;
      }

      .dw-form-save-loader-copy {
        display: grid;
        gap: 3px;
      }

      .dw-form-save-loader-copy strong {
        font-size: 13.5px;
        color: var(--dw-text-primary);
        line-height: 1.15;
      }

      .dw-form-save-loader-copy span {
        font-size: 12.5px;
        color: var(--dw-text-secondary);
        line-height: 1.3;
      }

      .dw-form-save-loader-progress {
        position: absolute;
        left: 14px;
        right: 14px;
        top: 8px;
        height: 3px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--dw-text-muted) 20%, transparent);
      }

      .dw-form-save-loader-progress::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 34%;
        height: 100%;
        border-radius: inherit;
        background: color-mix(in srgb, var(--dw-primary) 80%, var(--dw-accent) 20%);
        animation: dwFormLoaderProgress 1200ms ease-in-out infinite;
      }

      .dw-form-save-loader.create {
        border-color: color-mix(in srgb, var(--dw-success) 40%, transparent);
        background:
          radial-gradient(
            circle at 82% 16%,
            color-mix(in srgb, var(--dw-success) 18%, transparent),
            transparent 56%
          ),
          linear-gradient(
            150deg,
            color-mix(in srgb, var(--dw-surface-elevated) 82%, var(--dw-success) 18%),
            var(--dw-surface-card)
          );
      }

      .dw-form-save-loader.create .ring {
        border-color: color-mix(in srgb, var(--dw-success) 58%, transparent);
      }

      .dw-form-save-loader.create .core {
        color: var(--dw-success);
        background: color-mix(in srgb, var(--dw-surface-elevated) 84%, var(--dw-success) 16%);
        box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--dw-success) 26%, transparent);
      }

      .dw-form-save-loader.create .dw-form-save-loader-progress::before {
        background: color-mix(in srgb, var(--dw-success) 82%, var(--dw-primary) 18%);
      }

      .dw-form-save-loader.update .dw-form-save-loader-progress::before {
        background: color-mix(in srgb, var(--dw-primary) 80%, var(--dw-accent) 20%);
      }

      @keyframes dwFormLoaderSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes dwFormLoaderSpinReverse {
        from {
          transform: rotate(360deg);
        }
        to {
          transform: rotate(0deg);
        }
      }

      @keyframes dwFormLoaderProgress {
        0% {
          transform: translateX(0);
        }
        50% {
          transform: translateX(185%);
        }
        100% {
          transform: translateX(0);
        }
      }

      @keyframes dwFormLoaderSheen {
        0% {
          transform: translateX(-120%);
        }
        56% {
          transform: translateX(140%);
        }
        100% {
          transform: translateX(140%);
        }
      }

      @media (max-width: 768px) {
        .dw-form-save-loader {
          width: 100%;
          padding: 11px 12px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .ring-a,
        .ring-b,
        .dw-form-save-loader-progress::before,
        .dw-form-save-loader::after {
          animation: none;
        }
      }
    `,
  ],
})
export class FormSaveLoaderComponent {
  title = input('Saving changes...');
  message = input('Updating your wardrobe details.');
  variant = input<'create' | 'update'>('update');
  icon = input('sync');
}
