import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

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

        <form class="auth-form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" [(ngModel)]="email" name="email" required>
            <mat-icon matPrefix>email</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" required>
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
              <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <div class="form-options">
            <mat-checkbox color="primary">Remember me</mat-checkbox>
            <a href="#" class="forgot-link">Forgot password?</a>
          </div>

          <button mat-raised-button color="primary" class="submit-btn" type="submit" [disabled]="loading()">
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
    .auth-bg { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(236,72,153,0.1) 100%); }
    .auth-container { position: relative; width: 100%; max-width: 420px; padding: 40px; background: var(--dw-surface-elevated); border-radius: var(--dw-radius-xl); border: 1px solid rgba(255,255,255,0.06); }
    .auth-header { text-align: center; margin-bottom: 32px; }
    .logo { width: 64px; height: 64px; margin: 0 auto 16px; background: var(--dw-gradient-primary); border-radius: var(--dw-radius-lg); display: flex; align-items: center; justify-content: center; }
    .logo mat-icon { font-size: 32px; width: 32px; height: 32px; color: white; }
    .auth-header h1 { margin: 0 0 8px; font-size: 1.75rem; }
    .auth-header p { color: var(--dw-text-secondary); margin: 0; }
    .auth-form { display: flex; flex-direction: column; gap: 16px; }
    mat-form-field { width: 100%; }
    .form-options { display: flex; justify-content: space-between; align-items: center; }
    .forgot-link { color: var(--dw-primary-light); text-decoration: none; font-size: 14px; }
    .submit-btn { width: 100%; height: 48px; font-size: 16px; margin-top: 8px; }
    .divider { display: flex; align-items: center; gap: 16px; margin: 24px 0; color: var(--dw-text-muted); font-size: 14px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.1); }
    .social-buttons { display: flex; gap: 12px; }
    .social-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; background: var(--dw-surface-card); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--dw-radius-md); color: var(--dw-text-primary); cursor: pointer; transition: all 0.15s; }
    .social-btn:hover { border-color: var(--dw-primary); }
    .social-btn img { width: 20px; height: 20px; }
    .auth-footer { text-align: center; margin-top: 24px; color: var(--dw-text-secondary); }
    .auth-footer a { color: var(--dw-primary-light); text-decoration: none; font-weight: 500; }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  showPassword = signal(false);
  loading = signal(false);

  async onSubmit() {
    this.loading.set(true);
    const success = await this.authService.login(this.email, this.password);
    this.loading.set(false);
    if (success) this.router.navigate(['/']);
  }

  async loginWithGoogle() {
    this.loading.set(true);
    await this.authService.loginWithGoogle();
    this.loading.set(false);
    this.router.navigate(['/']);
  }

  async loginWithApple() {
    this.loading.set(true);
    await this.authService.loginWithApple();
    this.loading.set(false);
    this.router.navigate(['/']);
  }
}
