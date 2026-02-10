import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-profile',
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="profile-page animate-fade-in">
      <header class="page-header">
        <h1>Profile Settings</h1>
      </header>

      <div class="profile-card glass">
        <div class="avatar-section">
          <div class="avatar">
            @if (user()?.avatar) {
              <img [src]="user()!.avatar" [alt]="user()!.name">
            } @else {
              <mat-icon>person</mat-icon>
            }
          </div>
          <button mat-stroked-button><mat-icon>photo_camera</mat-icon>Change Photo</button>
        </div>

        <form class="profile-form">
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <input matInput [(ngModel)]="name" name="name">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput [(ngModel)]="email" name="email" type="email">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Location</mat-label>
            <input matInput [(ngModel)]="location" name="location" placeholder="City, Country">
          </mat-form-field>
        </form>
      </div>

      <div class="settings-card glass">
        <h3>Preferences</h3>
        <div class="setting-item">
          <div><strong>Dark Mode</strong><p>Use dark theme throughout the app</p></div>
          <mat-slide-toggle [(ngModel)]="darkMode" color="primary"></mat-slide-toggle>
        </div>
        <div class="setting-item">
          <div><strong>Notifications</strong><p>Receive outfit suggestions and reminders</p></div>
          <mat-slide-toggle [(ngModel)]="notificationsEnabled" color="primary"></mat-slide-toggle>
        </div>
      </div>

      <div class="actions-card">
        <button mat-raised-button color="primary" (click)="saveChanges()"><mat-icon>save</mat-icon>Save Changes</button>
        <button mat-stroked-button color="warn" (click)="logout()"><mat-icon>logout</mat-icon>Logout</button>
      </div>
    </div>
  `,
    styles: [`
    .profile-page { padding: var(--dw-spacing-xl); max-width: 800px; margin: 0 auto; }
    .page-header { margin-bottom: var(--dw-spacing-xl); }
    .profile-card, .settings-card { padding: var(--dw-spacing-xl); border-radius: var(--dw-radius-xl); margin-bottom: var(--dw-spacing-lg); }
    .avatar-section { display: flex; align-items: center; gap: var(--dw-spacing-lg); margin-bottom: var(--dw-spacing-xl); }
    .avatar { width: 100px; height: 100px; border-radius: 50%; background: var(--dw-surface-card); display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; }
    .avatar mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--dw-text-muted); }
    .profile-form { display: flex; flex-direction: column; gap: 16px; }
    mat-form-field { width: 100%; }
    .settings-card h3 { margin: 0 0 var(--dw-spacing-lg); }
    .setting-item { display: flex; justify-content: space-between; align-items: center; padding: var(--dw-spacing-md) 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .setting-item:last-child { border-bottom: none; }
    .setting-item p { margin: 4px 0 0; color: var(--dw-text-secondary); font-size: 13px; }
    .actions-card { display: flex; gap: 12px; justify-content: flex-end; }

    @media (max-width: 768px) {
      .profile-page {
        padding: 12px;
      }

      .page-header {
        margin-bottom: 12px;
      }

      .page-header h1 {
        font-size: 1.25rem;
      }

      .profile-card,
      .settings-card {
        padding: 12px;
        border-radius: var(--dw-radius-lg);
        margin-bottom: 12px;
      }

      .avatar-section {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
        margin-bottom: 12px;
      }

      .avatar {
        width: 76px;
        height: 76px;
      }

      .avatar mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }

      .profile-form {
        gap: 10px;
      }

      .setting-item {
        align-items: flex-start;
        gap: 8px;
      }

      .setting-item p {
        font-size: 12px;
      }

      .actions-card {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .actions-card button {
        width: 100%;
      }
    }
  `]
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  user = this.authService.user;

  name = this.user()?.name ?? '';
  email = this.user()?.email ?? '';
  location = this.user()?.preferences?.location ?? '';
  darkMode = this.user()?.preferences?.darkMode ?? false;
  notificationsEnabled = this.user()?.preferences?.notificationsEnabled ?? true;

  saveChanges(): void {
    this.authService.updateProfile({
      name: this.name.trim() || this.user()?.name,
      email: this.email.trim() || this.user()?.email,
      preferences: {
        ...(this.user()?.preferences ?? {
          favoriteColors: [],
          stylePreferences: [],
          location: '',
          notificationsEnabled: true,
          darkMode: false,
        }),
        location: this.location.trim(),
        darkMode: this.darkMode,
        notificationsEnabled: this.notificationsEnabled,
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
