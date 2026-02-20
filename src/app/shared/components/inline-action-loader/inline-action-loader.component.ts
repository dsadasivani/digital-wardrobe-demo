import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-inline-action-loader',
  imports: [CommonModule, MatIconModule],
  template: `
    <div
      class="dw-inline-action-loader"
      [class.destructive]="tone() === 'destructive'"
      [class.positive]="tone() === 'positive'"
      role="status"
      aria-live="polite"
    >
      <span class="dw-inline-action-loader-emblem" aria-hidden="true">
        <span class="emblem-ring"></span>
        <mat-icon>{{ icon() }}</mat-icon>
      </span>
      <span class="dw-inline-action-loader-label">{{ label() }}</span>
      <span class="dw-inline-action-loader-progress" aria-hidden="true"></span>
    </div>
  `,
  styles: [
    `
      .dw-inline-action-loader {
        position: relative;
        overflow: hidden;
        display: inline-flex;
        align-items: center;
        gap: 9px;
        border-radius: var(--dw-radius-full);
        border: 1px solid color-mix(in srgb, var(--dw-primary) 34%, transparent);
        background:
          radial-gradient(
            circle at 12% 22%,
            color-mix(in srgb, var(--dw-primary) 18%, transparent),
            transparent 56%
          ),
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--dw-surface-elevated) 84%, var(--dw-primary) 16%),
            var(--dw-surface-card)
          );
        color: var(--dw-text-primary);
        padding: 6px 12px 6px 9px;
        font-size: 11.5px;
        font-weight: 600;
        letter-spacing: 0.01em;
        min-height: 30px;
      }

      .dw-inline-action-loader::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          110deg,
          transparent 0%,
          color-mix(in srgb, var(--dw-on-primary) 8%, transparent) 45%,
          transparent 72%
        );
        transform: translateX(-120%);
        animation: dwInlineLoaderSheen 1.8s ease-in-out infinite;
        pointer-events: none;
      }

      .dw-inline-action-loader-emblem {
        position: relative;
        width: 16px;
        height: 16px;
        display: inline-grid;
        place-items: center;
      }

      .emblem-ring {
        position: absolute;
        inset: -1px;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--dw-primary) 58%, transparent);
        animation: dwInlineLoaderSpin 1400ms linear infinite;
      }

      .dw-inline-action-loader-emblem mat-icon {
        font-size: 11px;
        width: 11px;
        height: 11px;
        color: color-mix(in srgb, var(--dw-primary) 72%, var(--dw-text-primary) 28%);
      }

      .dw-inline-action-loader-label {
        position: relative;
        z-index: 1;
      }

      .dw-inline-action-loader-progress {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 4px;
        height: 2px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--dw-text-muted) 20%, transparent);
      }

      .dw-inline-action-loader-progress::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 32%;
        height: 100%;
        border-radius: inherit;
        background: color-mix(in srgb, var(--dw-primary) 84%, var(--dw-accent) 16%);
        animation: dwInlineLoaderProgress 950ms ease-in-out infinite;
      }

      .dw-inline-action-loader.destructive {
        border-color: color-mix(in srgb, var(--dw-error) 48%, transparent);
        background:
          radial-gradient(
            circle at 12% 22%,
            color-mix(in srgb, var(--dw-error) 17%, transparent),
            transparent 58%
          ),
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--dw-surface-elevated) 86%, var(--dw-error) 14%),
            var(--dw-surface-card)
          );
      }

      .dw-inline-action-loader.destructive .emblem-ring {
        border-color: color-mix(in srgb, var(--dw-error) 60%, transparent);
      }

      .dw-inline-action-loader.destructive .dw-inline-action-loader-emblem mat-icon,
      .dw-inline-action-loader.destructive .dw-inline-action-loader-label {
        color: color-mix(in srgb, var(--dw-error) 72%, var(--dw-text-primary) 28%);
      }

      .dw-inline-action-loader.destructive .dw-inline-action-loader-progress::before {
        background: color-mix(in srgb, var(--dw-error) 84%, var(--dw-warning) 16%);
      }

      .dw-inline-action-loader.positive {
        border-color: color-mix(in srgb, var(--dw-success) 46%, transparent);
        background:
          radial-gradient(
            circle at 12% 22%,
            color-mix(in srgb, var(--dw-success) 16%, transparent),
            transparent 58%
          ),
          linear-gradient(
            135deg,
            color-mix(in srgb, var(--dw-surface-elevated) 86%, var(--dw-success) 14%),
            var(--dw-surface-card)
          );
      }

      .dw-inline-action-loader.positive .emblem-ring {
        border-color: color-mix(in srgb, var(--dw-success) 58%, transparent);
      }

      .dw-inline-action-loader.positive .dw-inline-action-loader-emblem mat-icon,
      .dw-inline-action-loader.positive .dw-inline-action-loader-label {
        color: color-mix(in srgb, var(--dw-success) 72%, var(--dw-text-primary) 28%);
      }

      .dw-inline-action-loader.positive .dw-inline-action-loader-progress::before {
        background: color-mix(in srgb, var(--dw-success) 82%, var(--dw-primary) 18%);
      }

      @keyframes dwInlineLoaderSpin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes dwInlineLoaderProgress {
        0% {
          transform: translateX(0);
        }
        50% {
          transform: translateX(145%);
        }
        100% {
          transform: translateX(0);
        }
      }

      @keyframes dwInlineLoaderSheen {
        0% {
          transform: translateX(-120%);
        }
        55% {
          transform: translateX(140%);
        }
        100% {
          transform: translateX(140%);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .emblem-ring,
        .dw-inline-action-loader-progress::before,
        .dw-inline-action-loader::after {
          animation: none;
        }
      }
    `,
  ],
})
export class InlineActionLoaderComponent {
  label = input('Updating...');
  tone = input<'neutral' | 'destructive' | 'positive'>('neutral');
  icon = input('hourglass_top');
}
