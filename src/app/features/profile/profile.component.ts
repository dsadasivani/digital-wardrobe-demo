import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { AuthService, ImageCropperService } from '../../core/services';
import { UserGender } from '../../core/models';
import { ImageReadyDirective } from '../../shared/directives/image-ready.directive';

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
    MatSelectModule,
    ImageReadyDirective,
  ],
  template: `
    <div class="profile-page animate-fade-in">
      <header class="page-header">
        <h1>Profile Settings</h1>
      </header>

      <div class="profile-card glass">
        <div class="avatar-section">
          <div class="avatar">
            @if (displayAvatar()) {
              <img [src]="displayAvatar()!" [dwImageReady]="displayAvatar()!" [alt]="user()?.name || 'Profile photo'" />
            } @else {
              <mat-icon>person</mat-icon>
            }
          </div>

          <div class="avatar-actions">
            <div class="avatar-top-row">
              <button
                mat-stroked-button
                type="button"
                [disabled]="isAvatarProcessing()"
                (click)="openAvatarPicker()"
              >
                <mat-icon>{{ isAvatarProcessing() ? 'hourglass_top' : 'photo_camera' }}</mat-icon>
                {{ isAvatarProcessing() ? 'Processing...' : 'Change Photo' }}
              </button>
              <div class="gender-signature" [ngClass]="genderThemeClass()" aria-live="polite">
                <span class="gender-motion" aria-hidden="true">
                  <span class="gender-halo"></span>
                  <span class="gender-particle-wrap">
                    <span class="gender-particle"></span>
                  </span>
                  <span class="gender-core">
                    <mat-icon>{{ genderIcon() }}</mat-icon>
                  </span>
                </span>
                <span class="gender-copy">
                  <span class="gender-kicker">Identity</span>
                  <strong>{{ genderLabel() }}</strong>
                </span>
              </div>
            </div>
            <button
              mat-button
              type="button"
              class="remove-avatar-btn"
              [disabled]="!displayAvatar()"
              (click)="removePhoto()"
            >
              Remove
            </button>
            <input
              #avatarInput
              type="file"
              hidden
              accept="image/png,image/jpeg,image/webp,image/gif"
              (change)="onAvatarSelected($event)"
            />
            <p class="avatar-hint">JPG, PNG, WEBP or GIF up to 10MB. Crop before saving.</p>
            @if (avatarError()) {
              <p class="avatar-error">{{ avatarError() }}</p>
            }
          </div>

        </div>

        <form class="profile-form">
          <mat-form-field appearance="outline">
            <mat-label>Full Name</mat-label>
            <input matInput [ngModel]="name()" (ngModelChange)="name.set($event)" name="name" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input
              matInput
              [ngModel]="email()"
              (ngModelChange)="email.set($event)"
              name="email"
              type="email"
            />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Gender</mat-label>
            <mat-select [ngModel]="gender()" (ngModelChange)="gender.set($event)" name="gender">
              @for (option of genderOptions; track option.value) {
                <mat-option [value]="option.value">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Location</mat-label>
            <input
              matInput
              [ngModel]="location()"
              (ngModelChange)="location.set($event)"
              name="location"
              placeholder="City, Country"
            />
          </mat-form-field>
        </form>
      </div>

      <div class="settings-card glass">
        <h3>Preferences</h3>
        <div class="setting-item">
          <div>
            <strong>Dark Mode</strong>
            <p>Use dark theme throughout the app</p>
          </div>
          <mat-slide-toggle
            [ngModel]="darkMode()"
            (ngModelChange)="darkMode.set($event)"
            color="primary"
          ></mat-slide-toggle>
        </div>
        <div class="setting-item">
          <div>
            <strong>Notifications</strong>
            <p>Receive outfit suggestions and reminders</p>
          </div>
          <mat-slide-toggle
            [ngModel]="notificationsEnabled()"
            (ngModelChange)="notificationsEnabled.set($event)"
            color="primary"
          ></mat-slide-toggle>
        </div>
      </div>

      <div class="actions-card">
        <button mat-raised-button color="primary" class="save-btn" (click)="saveChanges()">
          <mat-icon>save</mat-icon>
          Save Changes
        </button>
        <button mat-stroked-button color="warn" class="logout-btn" (click)="logout()">
          <mat-icon>logout</mat-icon>
          Logout
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-page {
        padding: var(--dw-spacing-xl);
        max-width: 800px;
        margin: 0 auto;
      }
      .page-header {
        margin-bottom: var(--dw-spacing-xl);
      }
      .profile-card,
      .settings-card {
        padding: var(--dw-spacing-xl);
        border-radius: var(--dw-radius-xl);
        margin-bottom: var(--dw-spacing-lg);
      }
      .avatar-section {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--dw-spacing-lg);
        margin-bottom: var(--dw-spacing-xl);
      }
      .avatar {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        background: var(--dw-surface-card);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .avatar mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--dw-text-muted);
      }
      .avatar-actions {
        display: grid;
        gap: 4px;
      }
      .avatar-top-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .remove-avatar-btn {
        justify-self: flex-start;
        padding-left: 2px;
        color: var(--dw-text-secondary);
      }
      .avatar-hint {
        margin: 0;
        font-size: 12px;
        color: var(--dw-text-muted);
      }
      .avatar-error {
        margin: 0;
        font-size: 12px;
        color: var(--dw-error);
      }
      .gender-signature {
        --gender-accent: var(--dw-primary);
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-height: 40px;
        padding: 5px 12px 5px 7px;
        border-radius: var(--dw-radius-full);
        border: 1px solid color-mix(in srgb, var(--dw-border-subtle) 68%, var(--gender-accent) 32%);
        background: linear-gradient(
          120deg,
          color-mix(in srgb, var(--dw-surface-card) 95%, var(--gender-accent) 5%) 0%,
          color-mix(in srgb, var(--dw-surface-card) 89%, var(--gender-accent) 11%) 100%
        );
        box-shadow: inset 0 1px 0 color-mix(in srgb, var(--dw-surface-elevated) 86%, transparent);
        color: var(--dw-text-secondary);
        flex-shrink: 0;
      }
      .gender-motion {
        position: relative;
        width: 26px;
        height: 26px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .gender-halo {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--gender-accent) 36%, transparent);
        animation: genderHaloBreath 2.8s ease-in-out infinite;
      }
      .gender-particle-wrap {
        position: absolute;
        inset: 0;
        animation: genderParticleOrbit 4.5s linear infinite;
      }
      .gender-particle {
        position: absolute;
        top: 0;
        left: 50%;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        transform: translateX(-50%);
        background: color-mix(in srgb, var(--gender-accent) 88%, var(--dw-surface-elevated));
        box-shadow: 0 0 8px color-mix(in srgb, var(--gender-accent) 50%, transparent);
      }
      .gender-core {
        position: relative;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: color-mix(in srgb, var(--gender-accent) 82%, var(--dw-surface-card));
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--gender-accent) 18%, transparent);
        animation: genderCorePulse 2.8s ease-in-out infinite;
      }
      .gender-core mat-icon {
        font-size: 11px;
        width: 11px;
        height: 11px;
        color: var(--dw-surface-card);
      }
      .gender-copy {
        display: grid;
        line-height: 1.05;
      }
      .gender-kicker {
        font-size: 10px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--dw-text-muted);
      }
      .gender-copy strong {
        font-size: 13px;
        font-weight: 600;
      }
      .gender-male {
        --gender-accent: #6b8fcc;
      }
      .gender-female {
        --gender-accent: #c889ad;
      }
      .gender-non-binary {
        --gender-accent: #5a9f8d;
      }
      .gender-neutral {
        --gender-accent: #8f95ab;
      }
      @keyframes genderHaloBreath {
        from {
          transform: scale(0.96);
          opacity: 0.55;
        }
        to {
          transform: scale(1.06);
          opacity: 1;
        }
      }
      @keyframes genderParticleOrbit {
        0%,
        100% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      @keyframes genderCorePulse {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.08);
        }
      }
      .profile-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      mat-form-field {
        width: 100%;
      }
      .settings-card h3 {
        margin: 0 0 var(--dw-spacing-lg);
      }
      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--dw-spacing-md) 0;
        border-bottom: 1px solid var(--dw-border-subtle);
      }
      .setting-item:last-child {
        border-bottom: none;
      }
      .setting-item p {
        margin: 4px 0 0;
        color: var(--dw-text-secondary);
        font-size: 13px;
      }
      .actions-card {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
      }
      .actions-card button {
        min-height: 44px;
        padding-inline: 18px;
        font-weight: 600;
        border-radius: var(--dw-radius-md);
      }
      .actions-card button mat-icon {
        margin-right: 6px;
      }
      .save-btn {
        background: var(--dw-gradient-primary) !important;
        color: var(--dw-on-primary) !important;
        border: 1px solid var(--dw-border-strong) !important;
        box-shadow: var(--dw-shadow-md);
      }
      .save-btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--dw-shadow-glow);
      }
      .logout-btn {
        border-color: color-mix(in srgb, var(--dw-error) 48%, transparent) !important;
        color: var(--dw-error) !important;
      }
      .logout-btn:hover {
        background: color-mix(in srgb, var(--dw-error) 10%, transparent) !important;
      }
      @media (prefers-reduced-motion: reduce) {
        .gender-halo,
        .gender-particle-wrap,
        .gender-core {
          animation: none;
        }
      }

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

        .avatar-actions {
          width: 100%;
        }
        .avatar-top-row {
          width: 100%;
          justify-content: flex-start;
          gap: 8px;
        }
        .gender-signature {
          min-height: 36px;
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
    `,
  ],
})
export class ProfileComponent {
  readonly genderOptions: ReadonlyArray<{ value: UserGender; label: string }> = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ];

  private authService = inject(AuthService);
  private imageCropper = inject(ImageCropperService);
  private router = inject(Router);
  private avatarInput = viewChild.required<ElementRef<HTMLInputElement>>('avatarInput');

  user = this.authService.user;
  name = linkedSignal(() => this.user()?.name ?? '');
  email = linkedSignal(() => this.user()?.email ?? '');
  gender = linkedSignal<UserGender>(() => this.user()?.gender ?? 'prefer-not-to-say');
  location = linkedSignal(() => this.user()?.preferences?.location ?? '');
  darkMode = linkedSignal(() => this.user()?.preferences?.darkMode ?? false);
  notificationsEnabled = linkedSignal(() => this.user()?.preferences?.notificationsEnabled ?? true);
  avatarDraft = linkedSignal<string | null>(() => this.user()?.avatar ?? null);
  avatarChanged = signal(false);
  avatarError = signal<string | null>(null);
  isAvatarProcessing = signal(false);
  displayAvatar = computed(() =>
    this.avatarChanged() ? this.avatarDraft() : this.avatarDraft() || this.user()?.avatar || null,
  );
  genderLabel = computed(() => {
    switch (this.gender()) {
      case 'female':
        return 'Female';
      case 'male':
        return 'Male';
      case 'non-binary':
        return 'Non-binary';
      default:
        return 'Prefer not to say';
    }
  });
  genderIcon = computed(() => {
    switch (this.gender()) {
      case 'female':
        return 'face_3';
      case 'male':
        return 'face_6';
      case 'non-binary':
        return 'diversity_3';
      default:
        return 'self_improvement';
    }
  });
  genderThemeClass = computed(() => {
    switch (this.gender()) {
      case 'female':
        return 'gender-female';
      case 'male':
        return 'gender-male';
      case 'non-binary':
        return 'gender-non-binary';
      default:
        return 'gender-neutral';
    }
  });

  saveChanges(): void {
    this.authService.updateProfile({
      name: this.name().trim() || this.user()?.name,
      email: this.email().trim() || this.user()?.email,
      gender: this.gender(),
      avatar: this.avatarChanged() ? (this.avatarDraft() ?? '') : undefined,
      preferences: {
        ...(this.user()?.preferences ?? {
          favoriteColors: [],
          stylePreferences: [],
          location: '',
          notificationsEnabled: true,
          darkMode: false,
        }),
        location: this.location().trim(),
        darkMode: this.darkMode(),
        notificationsEnabled: this.notificationsEnabled(),
      },
    });
    this.avatarChanged.set(false);
    this.avatarError.set(null);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openAvatarPicker(): void {
    this.avatarInput().nativeElement.click();
  }

  async onAvatarSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }
    this.isAvatarProcessing.set(true);
    this.avatarError.set(null);
    try {
      const cropped = await this.imageCropper.cropFile(file, {
        title: 'Crop Profile Photo',
        aspectRatio: 1,
        maxOutputWidth: 640,
        maxOutputHeight: 640,
        outputType: 'image/jpeg',
        quality: 0.9,
      });
      if (cropped) {
        this.avatarDraft.set(cropped);
        this.avatarChanged.set(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process selected image.';
      this.avatarError.set(message);
    } finally {
      this.isAvatarProcessing.set(false);
    }
  }

  removePhoto(): void {
    if (!this.displayAvatar()) {
      return;
    }
    this.avatarDraft.set(null);
    this.avatarChanged.set(true);
    this.avatarError.set(null);
  }
}
