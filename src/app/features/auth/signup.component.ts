import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/services/auth.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-signup',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page">
      <div class="auth-bg"></div>
      <div class="auth-container animate-slide-up">
        <div class="auth-header">
          <div class="logo">
            <mat-icon>checkroom</mat-icon>
          </div>
          <h1>Create Account</h1>
          <p>Start building your Digital Wardrobe</p>
        </div>

        <form class="auth-form" #signupForm="ngForm" (ngSubmit)="onSubmit(signupForm)" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <input
              matInput
              name="name"
              required
              minlength="2"
              maxlength="120"
              [ngModel]="name()"
              (ngModelChange)="onNameChange($event)"
              #nameModel="ngModel"
            />
            <mat-icon matPrefix>person</mat-icon>
            @if ((nameModel.invalid && (nameModel.touched || submitted())) || fieldError('name')) {
              <mat-error>
                @if (fieldError('name')) {
                  {{ fieldError('name') }}
                } @else if (nameModel.hasError('required')) {
                  Name is required.
                } @else if (nameModel.hasError('minlength')) {
                  Name must be at least 2 characters.
                } @else if (nameModel.hasError('maxlength')) {
                  Name must be 120 characters or fewer.
                }
              </mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              name="email"
              required
              email
              maxlength="320"
              [ngModel]="email()"
              (ngModelChange)="onEmailChange($event)"
              #emailModel="ngModel"
            />
            <mat-icon matPrefix>email</mat-icon>
            @if ((emailModel.invalid && (emailModel.touched || submitted())) || fieldError('email')) {
              <mat-error>
                @if (fieldError('email')) {
                  {{ fieldError('email') }}
                } @else if (emailModel.hasError('required')) {
                  Email is required.
                } @else if (emailModel.hasError('email')) {
                  Enter a valid email address.
                } @else if (emailModel.hasError('maxlength')) {
                  Email must be 320 characters or fewer.
                }
              </mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input
              matInput
              [type]="showPassword() ? 'text' : 'password'"
              name="password"
              required
              minlength="8"
              maxlength="200"
              [ngModel]="password()"
              (ngModelChange)="onPasswordChange($event)"
              #passwordModel="ngModel"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if ((passwordModel.invalid && (passwordModel.touched || submitted())) || fieldError('password')) {
              <mat-error>
                @if (fieldError('password')) {
                  {{ fieldError('password') }}
                } @else if (passwordModel.hasError('required')) {
                  Password is required.
                } @else if (passwordModel.hasError('minlength')) {
                  Password must be at least 8 characters.
                } @else if (passwordModel.hasError('maxlength')) {
                  Password must be 200 characters or fewer.
                }
              </mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirm Password</mat-label>
            <input
              matInput
              [type]="showConfirmPassword() ? 'text' : 'password'"
              name="confirmPassword"
              required
              minlength="8"
              maxlength="200"
              [ngModel]="confirmPassword()"
              (ngModelChange)="onConfirmPasswordChange($event)"
              #confirmPasswordModel="ngModel"
            />
            <mat-icon matPrefix>verified_user</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showConfirmPassword.set(!showConfirmPassword())">
              <mat-icon>{{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (confirmPasswordModel.invalid && (confirmPasswordModel.touched || submitted())) {
              <mat-error>
                @if (confirmPasswordModel.hasError('required')) {
                  Confirm password is required.
                } @else if (confirmPasswordModel.hasError('minlength')) {
                  Confirm password must be at least 8 characters.
                } @else if (confirmPasswordModel.hasError('maxlength')) {
                  Confirm password must be 200 characters or fewer.
                }
              </mat-error>
            }
          </mat-form-field>
          @if (showPasswordMismatch() && (confirmPasswordModel.touched || submitted())) {
            <p class="field-error">Passwords do not match.</p>
          }

          @if (errorMessage()) {
            <p class="form-error">{{ errorMessage() }}</p>
          }

          <button
            mat-raised-button
            color="primary"
            class="submit-btn"
            type="submit"
            [disabled]="loading() || signupForm.invalid || passwordsMismatch()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Create Account
            }
          </button>
        </form>

        <p class="auth-footer">Already have an account? <a routerLink="/login">Sign in</a></p>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
      .auth-bg {
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 12% 18%, color-mix(in srgb, var(--dw-primary) 24%, transparent) 0%, transparent 52%),
          radial-gradient(circle at 88% 84%, color-mix(in srgb, var(--dw-accent) 24%, transparent) 0%, transparent 48%),
          linear-gradient(
            160deg,
            color-mix(in srgb, var(--dw-surface-base) 88%, var(--dw-primary) 12%) 0%,
            var(--dw-surface-base) 100%
          );
      }
      .auth-container {
        position: relative;
        width: 100%;
        max-width: 420px;
        padding: 40px;
        background: var(--dw-surface-elevated);
        border-radius: var(--dw-radius-xl);
        border: 1px solid var(--dw-border-subtle);
        box-shadow: var(--dw-shadow-lg);
      }
      .auth-header { text-align: center; margin-bottom: 32px; }
      .logo { width: 64px; height: 64px; margin: 0 auto 16px; background: var(--dw-gradient-primary); border-radius: var(--dw-radius-lg); display: flex; align-items: center; justify-content: center; }
      .logo mat-icon { font-size: 32px; width: 32px; height: 32px; color: white; }
      .auth-header h1 { margin: 0 0 8px; font-size: 1.75rem; }
      .auth-header p { color: var(--dw-text-secondary); margin: 0; }
      .auth-form { display: flex; flex-direction: column; gap: 16px; }
      mat-form-field { width: 100%; }
      .auth-form mat-error,
      .field-error,
      .form-error {
        color: var(--dw-error);
        font-size: 13px;
        font-weight: 500;
        line-height: 1.35;
      }
      .field-error { margin: -10px 0 0; }
      .form-error { margin: 0; }
      .submit-btn {
        width: 100%;
        height: 48px;
        font-size: 16px;
        margin-top: 8px;
        --mdc-protected-button-container-color: var(--dw-primary);
        --mdc-protected-button-label-text-color: var(--dw-on-primary);
        --mdc-protected-button-container-elevation: var(--dw-shadow-md);
        background: var(--dw-primary) !important;
        color: var(--dw-on-primary) !important;
        border: 1px solid var(--dw-border-strong);
      }
      .submit-btn:disabled { opacity: 0.7; }
      .auth-footer { text-align: center; margin-top: 24px; color: var(--dw-text-secondary); }
      .auth-footer a { color: var(--dw-primary); text-decoration: none; font-weight: 500; }

      @media (max-width: 768px) {
        .auth-page { align-items: flex-start; padding: 12px; }
        .auth-container { margin-top: 8px; padding: 20px 16px; border-radius: var(--dw-radius-lg); }
        .auth-header { margin-bottom: 20px; }
        .logo { width: 54px; height: 54px; margin-bottom: 10px; }
        .logo mat-icon { font-size: 28px; width: 28px; height: 28px; }
        .auth-header h1 { font-size: 1.4rem; }
        .auth-header p { font-size: 13px; }
        .auth-form { gap: 12px; }
        .submit-btn { height: 44px; font-size: 15px; margin-top: 4px; }
        .auth-footer { margin-top: 16px; font-size: 13px; }
      }
    `,
  ],
})
export class SignupComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  name = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  loading = signal(false);
  submitted = signal(false);
  errorMessage = signal('');
  serverFieldErrors = signal<Record<string, string>>({});
  passwordsMismatch = computed(
    () => this.confirmPassword().length > 0 && this.password() !== this.confirmPassword()
  );
  showPasswordMismatch = computed(
    () =>
      this.passwordsMismatch() &&
      this.password().length >= 8 &&
      this.password().length <= 200 &&
      this.confirmPassword().length >= 8 &&
      this.confirmPassword().length <= 200
  );

  async onSubmit(form: NgForm): Promise<void> {
    this.submitted.set(true);
    this.clearServerErrors();
    const name = this.name().trim();
    const email = this.email().trim();
    const password = this.password();
    const confirmPassword = this.confirmPassword();
    this.name.set(name);
    this.email.set(email);

    if (form.invalid) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    this.loading.set(true);
    const result = await this.authService.signup(name, email, password);
    this.loading.set(false);

    if (result.success) {
      await this.router.navigate(['/']);
      return;
    }

    this.serverFieldErrors.set(result.fieldErrors);
    this.errorMessage.set(
      result.message === 'Request validation failed'
        ? 'Please correct the highlighted fields.'
        : result.message
    );
  }

  onNameChange(value: string): void {
    this.name.set(value ?? '');
    this.clearServerFieldError('name');
  }

  onEmailChange(value: string): void {
    this.email.set(value ?? '');
    this.clearServerFieldError('email');
  }

  onPasswordChange(value: string): void {
    this.password.set(value ?? '');
    this.clearServerFieldError('password');
  }

  onConfirmPasswordChange(value: string): void {
    this.confirmPassword.set(value ?? '');
    this.errorMessage.set('');
  }

  fieldError(field: string): string {
    return this.serverFieldErrors()[field] ?? '';
  }

  private clearServerErrors(): void {
    this.errorMessage.set('');
    this.serverFieldErrors.set({});
  }

  private clearServerFieldError(field: string): void {
    const current = this.serverFieldErrors();
    if (!current[field] && !this.errorMessage()) {
      return;
    }

    const { [field]: _, ...rest } = current;
    this.serverFieldErrors.set(rest);
    this.errorMessage.set('');
  }
}
