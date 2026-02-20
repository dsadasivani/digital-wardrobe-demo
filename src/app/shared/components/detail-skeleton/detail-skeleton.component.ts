import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-detail-skeleton',
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="dw-detail-skeleton animate-fade-in" role="status" aria-live="polite">
      <div class="dw-detail-skeleton-header">
        <span class="dw-detail-skeleton-back"></span>
        <span class="dw-detail-skeleton-title"></span>
        <span class="dw-detail-skeleton-action"></span>
      </div>

      <div class="dw-detail-skeleton-body">
        <div class="dw-detail-skeleton-media">
          <mat-icon>{{ icon() }}</mat-icon>
        </div>

        <div class="dw-detail-skeleton-panel">
          <span class="dw-detail-skeleton-line"></span>
          <span class="dw-detail-skeleton-line medium"></span>
          <span class="dw-detail-skeleton-line short"></span>
          <div class="dw-detail-skeleton-grid">
            @for (placeholder of placeholders; track placeholder) {
              <span class="dw-detail-skeleton-chip"></span>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .dw-detail-skeleton {
        padding: var(--dw-spacing-xl);
        max-width: 1200px;
        margin: 0 auto;
      }

      .dw-detail-skeleton-header {
        display: grid;
        grid-template-columns: 44px minmax(220px, 38%) 140px;
        gap: 10px;
        margin-bottom: var(--dw-spacing-lg);
      }

      .dw-detail-skeleton-back,
      .dw-detail-skeleton-title,
      .dw-detail-skeleton-action,
      .dw-detail-skeleton-line,
      .dw-detail-skeleton-chip {
        background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--dw-surface-card) 78%, transparent) 0%,
          color-mix(in srgb, var(--dw-surface-elevated) 62%, transparent) 50%,
          color-mix(in srgb, var(--dw-surface-card) 78%, transparent) 100%
        );
        background-size: 220% 100%;
        animation: shimmer 1.25s linear infinite;
      }

      .dw-detail-skeleton-back {
        height: 44px;
        border-radius: 999px;
      }

      .dw-detail-skeleton-title {
        height: 34px;
        border-radius: var(--dw-radius-full);
        align-self: center;
      }

      .dw-detail-skeleton-action {
        height: 34px;
        border-radius: var(--dw-radius-full);
        justify-self: end;
        width: 120px;
        align-self: center;
      }

      .dw-detail-skeleton-body {
        display: grid;
        grid-template-columns: minmax(280px, 420px) 1fr;
        gap: var(--dw-spacing-xl);
      }

      .dw-detail-skeleton-media {
        min-height: 420px;
        border-radius: var(--dw-radius-xl);
        border: 1px solid var(--dw-border-subtle);
        background:
          radial-gradient(
            circle at 78% 12%,
            color-mix(in srgb, var(--dw-primary) 12%, transparent),
            transparent 52%
          ),
          linear-gradient(
            160deg,
            color-mix(in srgb, var(--dw-surface-elevated) 86%, var(--dw-primary) 14%),
            var(--dw-surface-card)
          );
        display: grid;
        place-items: center;
      }

      .dw-detail-skeleton-media mat-icon {
        font-size: 44px;
        width: 44px;
        height: 44px;
        color: color-mix(in srgb, var(--dw-primary) 44%, var(--dw-text-secondary) 56%);
        opacity: 0.7;
        animation: dw-loader-bob 1.4s ease-in-out infinite;
      }

      .dw-detail-skeleton-panel {
        border: 1px solid var(--dw-border-subtle);
        border-radius: var(--dw-radius-xl);
        background: var(--dw-surface-card);
        padding: var(--dw-spacing-lg);
        display: grid;
        gap: 10px;
        align-content: start;
      }

      .dw-detail-skeleton-line {
        display: block;
        width: 100%;
        height: 14px;
        border-radius: var(--dw-radius-full);
      }

      .dw-detail-skeleton-line.medium {
        width: 72%;
      }

      .dw-detail-skeleton-line.short {
        width: 46%;
      }

      .dw-detail-skeleton-grid {
        margin-top: 4px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .dw-detail-skeleton-chip {
        width: 88px;
        height: 22px;
        border-radius: var(--dw-radius-full);
      }

      @media (max-width: 900px) {
        .dw-detail-skeleton {
          padding: var(--dw-spacing-md);
        }

        .dw-detail-skeleton-header {
          grid-template-columns: 40px 1fr;
        }

        .dw-detail-skeleton-action {
          display: none;
        }

        .dw-detail-skeleton-body {
          grid-template-columns: 1fr;
        }

        .dw-detail-skeleton-media {
          min-height: 280px;
        }
      }
    `,
  ],
})
export class DetailSkeletonComponent {
  icon = input('checkroom');
  readonly placeholders = [0, 1, 2, 3, 4, 5];
}

