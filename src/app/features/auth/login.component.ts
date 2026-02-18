import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { AppUiStateService } from '../../core/services/app-ui-state.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-login',
  imports: [
    CommonModule, NgOptimizedImage, FormsModule, RouterLink, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-page">
      <div class="auth-bg"></div>
      <div class="auth-container animate-slide-up">
        <div class="auth-header">
          <div class="logo">
            <mat-icon>checkroom</mat-icon>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your Digital Wardrobe</p>
        </div>

        <form class="auth-form" #loginForm="ngForm" (ngSubmit)="onSubmit(loginForm)" novalidate>
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
              #emailModel="ngModel">
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
              #passwordModel="ngModel">
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

          @if (formError()) {
            <p class="form-error">{{ formError() }}</p>
          }

          <div class="form-options">
            <mat-checkbox color="primary">Remember me</mat-checkbox>
            <a href="#" class="forgot-link">Forgot password?</a>
          </div>

          <button
            mat-raised-button
            color="primary"
            class="submit-btn"
            type="submit"
            [disabled]="loading() || loginForm.invalid">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="divider"><span>or continue with</span></div>

        <div class="social-buttons">
          <button class="social-btn" (click)="loginWithGoogle()">
            <img
              ngSrc="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              width="20"
              height="20"
              alt="Google">
            Google
          </button>
          <button class="social-btn" (click)="loginWithApple()">
            <mat-icon>apple</mat-icon>
            Apple
          </button>
        </div>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/signup">Sign up</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
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
    .form-error { margin: 0; }
    .form-options { display: flex; justify-content: space-between; align-items: center; }
    .forgot-link { color: var(--dw-primary); text-decoration: none; font-size: 14px; }
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
    .submit-btn:disabled {
      opacity: 0.7;
    }
    .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; color: var(--dw-text-muted); font-size: 14px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--dw-border-subtle); }
    .social-buttons { display: flex; gap: 12px; }
    .social-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: var(--dw-surface-card); border: 1px solid var(--dw-border-subtle); border-radius: var(--dw-radius-md); color: var(--dw-text-primary); cursor: pointer; transition: all 0.15s; }
    .social-btn:hover { border-color: var(--dw-primary); }
    .social-btn img { width: 20px; height: 20px; }
    .auth-footer { text-align: center; margin-top: 24px; color: var(--dw-text-secondary); }
    .auth-footer a { color: var(--dw-primary); text-decoration: none; font-weight: 500; }

    @media (max-width: 768px) {
      .auth-page {
        align-items: flex-start;
        padding: 12px;
      }

      .auth-container {
        margin-top: 8px;
        padding: 20px 16px;
        border-radius: var(--dw-radius-lg);
      }

      .auth-header {
        margin-bottom: 20px;
      }

      .logo {
        width: 54px;
        height: 54px;
        margin-bottom: 10px;
      }

      .logo mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .auth-header h1 {
        font-size: 1.4rem;
      }

      .auth-header p {
        font-size: 13px;
      }

      .auth-form {
        gap: 12px;
      }

      .form-options {
        flex-wrap: wrap;
        gap: 6px 10px;
      }

      .forgot-link {
        font-size: 13px;
      }

      .submit-btn {
        height: 44px;
        font-size: 15px;
        margin-top: 4px;
      }

      .divider {
        margin: 16px 0;
        font-size: 12px;
      }

      .social-buttons {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .social-btn {
        min-height: 42px;
        font-size: 13px;
      }

      .auth-footer {
        margin-top: 16px;
        font-size: 13px;
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private appUiState = inject(AppUiStateService);

  email = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);
  submitted = signal(false);
  formError = signal('');
  serverFieldErrors = signal<Record<string, string>>({});

  async onSubmit(form: NgForm): Promise<void> {
    this.submitted.set(true);
    this.clearServerErrors();
    const email = this.email().trim();
    this.email.set(email);

    if (form.invalid) {
      return;
    }

    this.loading.set(true);
    const result = await this.authService.login(email, this.password());
    this.loading.set(false);

    if (result.success) {
      this.appUiState.suppressNextRouteLoader();
      await this.router.navigate(['/']);
      return;
    }

    this.serverFieldErrors.set(result.fieldErrors);
    this.formError.set(
      result.message === 'Request validation failed'
        ? 'Please correct the highlighted fields.'
        : result.message
    );
  }

  async loginWithGoogle(): Promise<void> {
    this.loading.set(true);
    const success = await this.authService.loginWithGoogle();
    this.loading.set(false);
    if (success) {
      this.appUiState.suppressNextRouteLoader();
      await this.router.navigate(['/']);
    }
  }

  async loginWithApple(): Promise<void> {
    this.loading.set(true);
    const success = await this.authService.loginWithApple();
    this.loading.set(false);
    if (success) {
      this.appUiState.suppressNextRouteLoader();
      await this.router.navigate(['/']);
    }
  }

  onEmailChange(value: string): void {
    this.email.set(value ?? '');
    this.clearServerFieldError('email');
  }

  onPasswordChange(value: string): void {
    this.password.set(value ?? '');
    this.clearServerFieldError('password');
  }

  fieldError(field: string): string {
    return this.serverFieldErrors()[field] ?? '';
  }

  private clearServerErrors(): void {
    this.formError.set('');
    this.serverFieldErrors.set({});
  }

  private clearServerFieldError(field: string): void {
    const current = this.serverFieldErrors();
    if (!current[field] && !this.formError()) {
      return;
    }

    const { [field]: _, ...rest } = current;
    this.serverFieldErrors.set(rest);
    this.formError.set('');
  }
}
