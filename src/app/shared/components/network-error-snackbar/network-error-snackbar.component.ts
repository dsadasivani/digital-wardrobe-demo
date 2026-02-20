import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export interface NetworkErrorSnackBarData {
  title?: string;
  message?: string;
  details?: string;
  retryLabel?: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-network-error-snackbar',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <section class="network-error-snack" role="alert" aria-live="assertive">
      <span class="status-icon" aria-hidden="true">
        <mat-icon>wifi_off</mat-icon>
      </span>

      <div class="copy">
        <strong>{{ title() }}</strong>
        <p>{{ message() }}</p>
        @if (details()) {
          <p class="details">{{ details() }}</p>
        }
      </div>

      <div class="actions">
        <button mat-stroked-button type="button" (click)="dismiss()">Dismiss</button>
        <button mat-flat-button class="retry-btn" type="button" (click)="retry()">
          {{ retryLabel() }}
        </button>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .network-error-snack {
        width: min(520px, calc(100vw - 32px));
        border-radius: var(--dw-radius-md);
        border: 1px solid color-mix(in srgb, var(--dw-error) 48%, transparent);
        background:
          radial-gradient(
            circle at 14% 12%,
            color-mix(in srgb, var(--dw-error) 20%, transparent),
            transparent 52%
          ),
          linear-gradient(
            140deg,
            color-mix(in srgb, var(--dw-surface-elevated) 86%, var(--dw-error) 14%),
            var(--dw-surface-card)
          );
        box-shadow: var(--dw-shadow-md);
        color: var(--dw-text-primary);
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 10px 12px;
        padding: 14px;
      }

      .status-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: color-mix(in srgb, var(--dw-error) 86%, var(--dw-text-primary) 14%);
        border: 1px solid color-mix(in srgb, var(--dw-error) 40%, transparent);
        background: color-mix(in srgb, var(--dw-error) 14%, transparent);
      }

      .status-icon mat-icon {
        width: 18px;
        height: 18px;
        font-size: 18px;
      }

      .copy {
        display: grid;
        gap: 2px;
        min-width: 0;
      }

      .copy strong {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.01em;
      }

      .copy p {
        margin: 0;
        color: var(--dw-text-secondary);
        font-size: 12.5px;
        line-height: 1.4;
      }

      .copy .details {
        color: color-mix(in srgb, var(--dw-text-primary) 78%, var(--dw-text-secondary) 22%);
      }

      .actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .actions .mat-mdc-stroked-button {
        border-color: color-mix(in srgb, var(--dw-error) 30%, transparent);
        color: var(--dw-text-primary);
        background: color-mix(in srgb, var(--dw-surface-elevated) 70%, transparent);
      }

      .actions .retry-btn {
        --mdc-filled-button-container-color: var(--dw-primary-dark);
        --mdc-filled-button-label-text-color: #fff;
        border: 1px solid color-mix(in srgb, var(--dw-primary-dark) 46%, transparent);
      }

      [data-theme='dark'] .actions .retry-btn {
        --mdc-filled-button-container-color: var(--dw-primary-light);
        --mdc-filled-button-label-text-color: var(--dw-primary-dark);
        border: 1px solid color-mix(in srgb, var(--dw-primary-light) 52%, transparent);
      }

      @media (max-width: 640px) {
        .network-error-snack {
          width: calc(100vw - 18px);
          padding: 12px;
          border-radius: 14px;
        }

        .actions {
          justify-content: stretch;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
})
export class NetworkErrorSnackbarComponent {
  private snackBarRef = inject(MatSnackBarRef<NetworkErrorSnackbarComponent>);
  private snackData = signal<NetworkErrorSnackBarData>(inject(MAT_SNACK_BAR_DATA));

  title = computed(() => this.snackData().title ?? 'Connection issue');
  message = computed(
    () =>
      this.snackData().message ??
      "We couldn't complete that right now. Please try again."
  );
  details = computed(() => this.snackData().details ?? 'Nothing was changed.');
  retryLabel = computed(() => this.snackData().retryLabel ?? 'Try again');

  retry(): void {
    this.snackBarRef.dismissWithAction();
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
