import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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

        <form class="auth-form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <input
              matInput
              [ngModel]="name()"
              (ngModelChange)="name.set($event)"
              name="name"
              required
              maxlength="120"
            />
            <mat-icon matPrefix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input
              matInput
              type="email"
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              name="email"
              required
            />
            <mat-icon matPrefix>email</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input
              matInput
              [type]="showPassword() ? 'text' : 'password'"
              [ngModel]="password()"
              (ngModelChange)="password.set($event)"
              name="password"
              required
              minlength="8"
            />
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Confirm Password</mat-label>
            <input
              matInput
              [type]="showConfirmPassword() ? 'text' : 'password'"
              [ngModel]="confirmPassword()"
              (ngModelChange)="confirmPassword.set($event)"
              name="confirmPassword"
              required
              minlength="8"
            />
            <mat-icon matPrefix>verified_user</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showConfirmPassword.set(!showConfirmPassword())">
              <mat-icon>{{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (errorMessage()) {
            <p class="form-error">{{ errorMessage() }}</p>
          }

          <button mat-raised-button color="primary" class="submit-btn" type="submit" [disabled]="loading()">
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
      .form-error { margin: 0; color: var(--dw-error); font-size: 13px; }
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
  errorMessage = signal('');

  async onSubmit(): Promise<void> {
    this.errorMessage.set('');
    const name = this.name().trim();
    const email = this.email().trim();
    const password = this.password();
    const confirmPassword = this.confirmPassword();

    if (!name || !email || !password || !confirmPassword) {
      this.errorMessage.set('Please fill all required fields.');
      return;
    }
    if (password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    const success = await this.authService.signup(name, email, password);
    this.loading.set(false);

    if (success) {
      await this.router.navigate(['/']);
      return;
    }
    this.errorMessage.set('Unable to create account. Email may already be in use.');
  }
}
