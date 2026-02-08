import {Component, inject, signal, ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { WardrobeService } from '../../core/services';
import { WardrobeItem } from '../../core/models';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
    selector: 'dw-outfit-canvas',
    imports: [CommonModule, FormsModule, DragDropModule, CdkDrag, MatIconModule, MatButtonModule, MatTooltipModule, MatFormFieldModule, MatInputModule],
    template: `
    <div class="outfit-canvas-page">
      <aside class="items-panel glass">
        <h3>My Items</h3>
        <div class="items-list">
          @for (item of availableItems(); track item.id) {
            <div class="panel-item" (click)="addToCanvas(item)" matTooltip="Click to add">
              <img [src]="item.imageUrl" [alt]="item.name">
              <span>{{ item.name }}</span>
            </div>
          }
        </div>
      </aside>

      <main class="canvas-area">
        <header class="canvas-header">
          <mat-form-field appearance="outline" class="outfit-name-field">
            <mat-label>Outfit Name</mat-label>
            <input matInput [(ngModel)]="outfitName" placeholder="My New Outfit">
          </mat-form-field>
          <div class="canvas-actions">
            <button mat-stroked-button (click)="clearCanvas()"><mat-icon>delete_sweep</mat-icon>Clear</button>
            <button mat-raised-button color="primary" (click)="saveOutfit()"><mat-icon>save</mat-icon>Save Outfit</button>
          </div>
        </header>

        <div class="canvas" #canvas>
          <div class="canvas-bg">
            <span>Drag items here to create your outfit</span>
          </div>
          @for (item of canvasItems(); track item.id; let i = $index) {
            <div 
              class="canvas-item" 
              cdkDrag
              [style.left.px]="item.x"
              [style.top.px]="item.y"
              [style.z-index]="item.zIndex"
              (cdkDragEnded)="onDragEnd($event, i)">
              <img [src]="item.imageUrl" [alt]="item.name" [style.transform]="'scale(' + item.scale + ')'">
              <div class="item-controls">
                <button (click)="bringToFront(i)" matTooltip="Bring to front"><mat-icon>flip_to_front</mat-icon></button>
                <button (click)="removeFromCanvas(i)" matTooltip="Remove"><mat-icon>close</mat-icon></button>
              </div>
            </div>
          }
        </div>
      </main>
    </div>
  `,
    styles: [`
    .outfit-canvas-page { display: flex; height: calc(100vh - var(--dw-header-height)); }
    .items-panel { width: 280px; padding: var(--dw-spacing-md); border-right: 1px solid rgba(255,255,255,0.06); overflow-y: auto; flex-shrink: 0; }
    .items-panel h3 { margin: 0 0 var(--dw-spacing-md); }
    .items-list { display: flex; flex-direction: column; gap: 8px; }
    .panel-item { display: flex; align-items: center; gap: 12px; padding: 8px; background: var(--dw-surface-card); border-radius: var(--dw-radius-md); cursor: pointer; transition: all 0.15s; }
    .panel-item:hover { background: var(--dw-surface-elevated); transform: translateX(4px); }
    .panel-item img { width: 48px; height: 48px; object-fit: cover; border-radius: var(--dw-radius-sm); }
    .panel-item span { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .canvas-area { flex: 1; display: flex; flex-direction: column; padding: var(--dw-spacing-md); }
    .canvas-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: var(--dw-spacing-md); flex-wrap: wrap; }
    .outfit-name-field { flex: 1; min-width: 200px; max-width: 400px; }
    .canvas-actions { display: flex; gap: 8px; }
    .canvas { flex: 1; position: relative; background: var(--dw-surface-elevated); border-radius: var(--dw-radius-xl); border: 1px solid rgba(255,255,255,0.06); overflow: hidden; }
    .canvas-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--dw-text-muted); pointer-events: none; }
    .canvas-item { position: absolute; cursor: move; border-radius: var(--dw-radius-md); transition: box-shadow 0.15s; }
    .canvas-item:hover { box-shadow: 0 0 0 2px var(--dw-primary); }
    .canvas-item img { width: 150px; height: auto; border-radius: var(--dw-radius-md); pointer-events: none; }
    .item-controls { position: absolute; top: -8px; right: -8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
    .canvas-item:hover .item-controls { opacity: 1; }
    .item-controls button { width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--dw-surface-card); color: var(--dw-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .item-controls button:hover { background: var(--dw-primary); color: white; }
    .item-controls mat-icon { font-size: 16px; width: 16px; height: 16px; }
    @media (max-width: 768px) { .items-panel { display: none; } }
  `]
})
export class OutfitCanvasComponent {
    private wardrobeService = inject(WardrobeService);
    private router = inject(Router);

    availableItems = this.wardrobeService.items;
    canvasItems = signal<{ id: string; name: string; imageUrl: string; x: number; y: number; scale: number; zIndex: number }[]>([]);
    outfitName = '';
    private maxZ = 1;

    addToCanvas(item: WardrobeItem) {
        this.canvasItems.update(items => [...items, {
            id: item.id,
            name: item.name,
            imageUrl: item.imageUrl,
            x: 100 + Math.random() * 200,
            y: 50 + Math.random() * 100,
            scale: 1,
            zIndex: this.maxZ++
        }]);
    }

    onDragEnd(event: CdkDragEnd, index: number) {
        const element = event.source.element.nativeElement;
        const rect = element.getBoundingClientRect();
        const parentRect = element.parentElement!.getBoundingClientRect();
        this.canvasItems.update(items => {
            const newItems = [...items];
            newItems[index] = { ...newItems[index], x: rect.left - parentRect.left, y: rect.top - parentRect.top };
            return newItems;
        });
    }

    removeFromCanvas(index: number) {
        this.canvasItems.update(items => items.filter((_, i) => i !== index));
    }

    bringToFront(index: number) {
        this.canvasItems.update(items => {
            const newItems = [...items];
            newItems[index] = { ...newItems[index], zIndex: this.maxZ++ };
            return newItems;
        });
    }

    clearCanvas() {
        this.canvasItems.set([]);
    }

    saveOutfit() {
        if (this.outfitName && this.canvasItems().length > 0) {
            this.wardrobeService.addOutfit({
                name: this.outfitName,
                items: this.canvasItems().map(item => ({
                    itemId: item.id,
                    type: 'wardrobe' as const,
                    positionX: item.x,
                    positionY: item.y,
                    scale: item.scale,
                    rotation: 0,
                    zIndex: item.zIndex
                })),
                favorite: false
            });
            this.router.navigate(['/outfits']);
        }
    }
}
