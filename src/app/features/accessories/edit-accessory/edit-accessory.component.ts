import { CommonModule, Location } from '@angular/common';
import {Component, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ACCESSORY_CATEGORIES, Accessory, AccessoryCategory } from '../../../core/models';
import { WardrobeService } from '../../../core/services/wardrobe.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-edit-accessory',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    @if (accessoryId()) {
      <div class="edit-accessory-page animate-fade-in">
        <header class="page-header">
          <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1>Edit Accessory</h1>
            <p>Update accessory details</p>
          </div>
        </header>

        <form class="edit-form glass" (ngSubmit)="save()">
          <div class="image-preview">
            <img [src]="imageUrl" alt="Accessory image preview">
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput [(ngModel)]="name" name="name" required>
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="category" name="category" required>
                @for (entry of categories; track entry.id) {
                  <mat-option [value]="entry.id">{{ entry.label }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Color</mat-label>
              <input matInput [(ngModel)]="color" name="color" required>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Color Hex</mat-label>
            <input matInput [(ngModel)]="colorHex" name="colorHex" required>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Brand</mat-label>
            <input matInput [(ngModel)]="brand" name="brand">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Image URL</mat-label>
            <input matInput [(ngModel)]="imageUrl" name="imageUrl">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tags (comma separated)</mat-label>
            <input matInput [(ngModel)]="tags" name="tags">
          </mat-form-field>

          <div class="actions">
            <button mat-stroked-button type="button" (click)="goBack()">Cancel</button>
            <button mat-flat-button color="primary" type="submit" class="save-btn">Save Changes</button>
          </div>
        </form>
      </div>
    } @else {
      <div class="not-found animate-fade-in">
        <mat-icon>search_off</mat-icon>
        <h2>Accessory not found</h2>
        <button mat-flat-button color="primary" routerLink="/accessories">Back to accessories</button>
      </div>
    }
  `,
  styles: [`
    .edit-accessory-page { padding: var(--dw-spacing-xl); max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: var(--dw-spacing-lg); }
    .page-header h1 { margin: 0; }
    .page-header p { margin: 4px 0 0; color: var(--dw-text-secondary); }
    .edit-form { border-radius: var(--dw-radius-xl); padding: var(--dw-spacing-lg); display: flex; flex-direction: column; gap: 14px; }
    .image-preview { width: 180px; height: 220px; border-radius: var(--dw-radius-md); overflow: hidden; border: 1px solid var(--dw-surface-card); }
    .image-preview img { width: 100%; height: 100%; object-fit: cover; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    mat-form-field { width: 100%; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
    .save-btn {
      --mdc-filled-button-container-color: transparent !important;
      --mdc-filled-button-label-text-color: var(--dw-primary) !important;
      background: transparent !important;
      color: var(--dw-primary) !important;
      border: none !important;
      box-shadow: none !important;
      min-width: 140px;
      font-weight: 600;
    }
    .save-btn:hover {
      background: color-mix(in srgb, var(--dw-primary) 10%, transparent) !important;
    }
    .not-found { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 12px; }
    .not-found mat-icon { font-size: 56px; width: 56px; height: 56px; color: var(--dw-text-muted); }
    @media (max-width: 768px) {
      .edit-accessory-page { padding: 12px; }
      .page-header { align-items: flex-start; gap: 10px; margin-bottom: 12px; }
      .page-header h1 { font-size: 1.25rem; line-height: 1.25; }
      .page-header p { font-size: 13px; margin-top: 2px; }
      .edit-form { border-radius: var(--dw-radius-lg); padding: 12px; gap: 10px; }
      .image-preview { width: 100%; height: auto; aspect-ratio: 4 / 3; border-radius: var(--dw-radius-lg); }
      .row { grid-template-columns: 1fr; gap: 10px; }
      .actions { margin-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .actions button { width: 100%; min-height: 40px; }
      .save-btn { min-width: 0; }
    }
  `]
})
export class EditAccessoryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private wardrobeService = inject(WardrobeService);

  accessoryId = signal<string | null>(null);
  categories = ACCESSORY_CATEGORIES;

  name = '';
  category: AccessoryCategory = 'bags';
  color = '';
  colorHex = '#8b4513';
  brand = '';
  imageUrl = '';
  tags = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.accessoryId.set(id);
      const item = id ? this.wardrobeService.getAccessoryById(id) : undefined;
      if (item) {
        this.patchForm(item);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  save(): void {
    const id = this.accessoryId();
    if (!id || !this.name || !this.category || !this.color) {
      return;
    }
    const normalizedHex = this.colorHex.trim().startsWith('#')
      ? this.colorHex.trim()
      : `#${this.colorHex.trim()}`;

    this.wardrobeService.updateAccessory(id, {
      name: this.name.trim(),
      category: this.category,
      color: this.color.trim(),
      colorHex: normalizedHex,
      brand: this.brand.trim() || undefined,
      imageUrl: this.imageUrl.trim(),
      tags: this.tags.split(',').map(tag => tag.trim()).filter(Boolean),
    });

    this.router.navigate(['/accessories', id]);
  }

  private patchForm(item: Accessory): void {
    this.name = item.name;
    this.category = item.category;
    this.color = item.color;
    this.colorHex = item.colorHex;
    this.brand = item.brand ?? '';
    this.imageUrl = item.imageUrl;
    this.tags = item.tags.join(', ');
  }
}
