import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Accessory, OutfitItem, WardrobeItem } from '../../core/models';
import { WardrobeService } from '../../core/services';

interface CanvasSourceItem {
  id: string;
  name: string;
  imageUrl: string;
  type: 'wardrobe' | 'accessory';
}

interface CanvasPlacedItem extends CanvasSourceItem {
  x: number;
  y: number;
  scale: number;
  zIndex: number;
}

type CanvasSourceFilter = 'wardrobe' | 'accessory';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-outfit-canvas',
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    CdkDrag,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="outfit-canvas-page">
      <aside class="items-panel glass">
        <h3>My Items</h3>
        <div class="source-filters">
          <button
            type="button"
            class="filter-chip"
            [class.active]="sourceFilter() === 'wardrobe'"
            (click)="sourceFilter.set('wardrobe')"
          >
            Items
          </button>
          <button
            type="button"
            class="filter-chip"
            [class.active]="sourceFilter() === 'accessory'"
            (click)="sourceFilter.set('accessory')"
          >
            Accessories
          </button>
        </div>
        <div class="items-list">
          @for (item of filteredAvailableItems(); track item.type + '-' + item.id) {
            <div class="panel-item" (click)="addToCanvas(item)" matTooltip="Add to Canva">
              <img [src]="item.imageUrl" [alt]="item.name" />
              <span>{{ item.name }}</span>
              <span class="add-overlay">Add to Canva</span>
            </div>
          }
        </div>
      </aside>

      <main class="canvas-area">
        <header class="canvas-header">
            <mat-form-field appearance="outline" class="outfit-name-field">
              <mat-label>Outfit Name</mat-label>
            <input
              matInput
              [ngModel]="outfitName()"
              (ngModelChange)="outfitName.set($event)"
              placeholder="My New Outfit"
            />
          </mat-form-field>
          <div class="canvas-actions">
            @if (editingOutfitId()) {
              <button mat-stroked-button type="button" (click)="cancelEdit()">
                <mat-icon>close</mat-icon>Cancel
              </button>
            }
            <button mat-stroked-button (click)="clearCanvas()"><mat-icon>delete_sweep</mat-icon>Clear</button>
            <button mat-raised-button color="primary" class="save-btn" (click)="saveOutfit()">
              <mat-icon>save</mat-icon>{{ editingOutfitId() ? 'Update Outfit' : 'Save Outfit' }}
            </button>
          </div>
        </header>

        <section class="schedule-panel glass">
          <div class="schedule-header">
            <h4>Schedule Dates</h4>
            <button mat-stroked-button type="button" (click)="addWorkWeek()">
              <mat-icon>work_history</mat-icon>Mon-Fri
            </button>
          </div>
          <div class="schedule-input-row">
            <input type="date" [ngModel]="dateInput()" (ngModelChange)="dateInput.set($event)" />
            <button mat-stroked-button type="button" (click)="addDate()">Add Date</button>
          </div>
          <div class="date-chips">
            @for (day of plannedDates(); track day) {
              <button class="date-chip" type="button" (click)="removeDate(day)">
                {{ day }}
                <mat-icon>close</mat-icon>
              </button>
            } @empty {
              <span class="empty-date-text">No dates selected yet.</span>
            }
          </div>
        </section>

        <section class="mobile-items-panel glass">
          <div class="mobile-items-header">
            <h4>Items & Accessories</h4>
            <button mat-stroked-button type="button" (click)="mobileCatalogOpen.set(!mobileCatalogOpen())">
              <mat-icon>{{ mobileCatalogOpen() ? 'expand_less' : 'expand_more' }}</mat-icon>
              {{ mobileCatalogOpen() ? 'Hide' : 'Show' }}
            </button>
          </div>
          <div class="source-filters mobile">
            <button
              type="button"
              class="filter-chip"
              [class.active]="sourceFilter() === 'wardrobe'"
              (click)="sourceFilter.set('wardrobe')"
            >
              Items
            </button>
            <button
              type="button"
              class="filter-chip"
              [class.active]="sourceFilter() === 'accessory'"
              (click)="sourceFilter.set('accessory')"
            >
              Accessories
            </button>
          </div>
          @if (mobileCatalogOpen()) {
            <div class="mobile-items-row">
              @for (item of filteredAvailableItems(); track item.type + '-' + item.id) {
                <div
                  class="mobile-item-chip"
                  [class.selected]="isMobileItemSelected(item)"
                  (click)="selectMobileItem(item)"
                  role="button"
                  tabindex="0"
                  (keydown.enter)="selectMobileItem(item)"
                >
                  <img [src]="item.imageUrl" [alt]="item.name" />
                  <span>{{ item.name }}</span>
                  @if (isMobileItemSelected(item)) {
                    <button class="add-overlay-mobile" type="button" (click)="addFromMobile(item, $event)">
                      Add to Canva
                    </button>
                  }
                </div>
              }
            </div>
          }
        </section>

        <div class="canvas" #canvasEl>
          <div class="canvas-bg">
            <span>Drag items here to create your outfit</span>
          </div>
          @for (item of canvasItems(); track item.type + '-' + item.id + '-' + $index; let i = $index) {
            <div
              class="canvas-item"
              cdkDrag
              [cdkDragBoundary]="'.canvas'"
              [style.left.px]="item.x"
              [style.top.px]="item.y"
              [style.z-index]="item.zIndex"
              (cdkDragEnded)="onDragEnd($event, i)">
              <img [src]="item.imageUrl" [alt]="item.name" [style.transform]="'scale(' + item.scale + ')'" />
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
    .outfit-canvas-page { display: flex; min-height: calc(100vh - var(--dw-header-height)); }
    .items-panel { width: 280px; padding: var(--dw-spacing-md); border-right: 1px solid rgba(255,255,255,0.06); overflow-y: auto; flex-shrink: 0; }
    .items-panel h3 { margin: 0 0 var(--dw-spacing-md); }
    .source-filters { display: flex; gap: 8px; margin-bottom: 10px; }
    .filter-chip {
      border: 1px solid rgba(140,123,112,0.2);
      background: var(--dw-surface-card);
      color: var(--dw-text-secondary);
      border-radius: 999px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--dw-transition-fast);
    }
    .filter-chip.active {
      background: color-mix(in srgb, var(--dw-primary) 18%, var(--dw-surface-card));
      border-color: color-mix(in srgb, var(--dw-primary) 46%, transparent);
      color: var(--dw-text-primary);
    }
    .items-list { display: flex; flex-direction: column; gap: 8px; }
    .panel-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px;
      background: var(--dw-surface-card);
      border-radius: var(--dw-radius-md);
      cursor: pointer;
      transition: all 0.15s;
      overflow: hidden;
    }
    .panel-item::after {
      content: '';
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--dw-surface-overlay) 34%, rgba(0, 0, 0, 0.28));
      backdrop-filter: blur(2px);
      -webkit-backdrop-filter: blur(2px);
      opacity: 0;
      transition: opacity var(--dw-transition-fast);
      pointer-events: none;
    }
    .panel-item:hover { background: var(--dw-surface-elevated); transform: translateX(4px); }
    .panel-item img { width: 48px; height: 48px; object-fit: cover; border-radius: var(--dw-radius-sm); }
    .panel-item span { font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .panel-item .add-overlay {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--dw-text-primary);
      background: transparent;
      border: 1.5px solid color-mix(in srgb, var(--dw-text-primary) 62%, transparent);
      border-radius: 999px;
      padding: 7px 14px;
      min-width: 108px;
      opacity: 0;
      pointer-events: none;
      transition: opacity var(--dw-transition-fast);
      z-index: 2;
    }
    .panel-item:hover::after { opacity: 1; }
    .panel-item:hover .add-overlay { opacity: 1; }
    .canvas-area { flex: 1; display: flex; flex-direction: column; padding: var(--dw-spacing-md); gap: var(--dw-spacing-md); }
    .canvas-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .outfit-name-field { flex: 1; min-width: 200px; max-width: 400px; }
    .canvas-actions { display: flex; gap: 8px; }
    .save-btn {
      --mdc-protected-button-container-color: transparent !important;
      --mdc-protected-button-label-text-color: var(--dw-primary) !important;
      --mdc-protected-button-container-elevation: 0 !important;
      background: transparent !important;
      color: var(--dw-primary) !important;
      border: none !important;
      box-shadow: none !important;
      font-weight: 600;
    }
    .save-btn:hover {
      background: color-mix(in srgb, var(--dw-primary) 10%, transparent) !important;
    }
    .schedule-panel { padding: var(--dw-spacing-md); border-radius: var(--dw-radius-lg); }
    .schedule-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
    .schedule-header h4 { margin: 0; font-size: 0.95rem; }
    .schedule-input-row { display: flex; gap: 8px; align-items: center; }
    .schedule-input-row input { height: 38px; border-radius: var(--dw-radius-md); border: 1px solid rgba(140,123,112,0.2); background: var(--dw-surface-elevated); color: var(--dw-text-primary); padding: 0 10px; }
    .date-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .date-chip { display: inline-flex; align-items: center; gap: 6px; border: 1px solid rgba(140,123,112,0.22); border-radius: 999px; background: var(--dw-surface-card); color: var(--dw-text-primary); padding: 4px 10px; font-size: 12px; }
    .date-chip mat-icon { font-size: 14px; width: 14px; height: 14px; }
    .empty-date-text { font-size: 12px; color: var(--dw-text-secondary); }
    .mobile-items-panel { display: none; }
    .canvas { flex: 1; position: relative; background: var(--dw-surface-elevated); border-radius: var(--dw-radius-xl); border: 1px solid rgba(255,255,255,0.06); overflow: hidden; min-height: 520px; }
    .canvas-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--dw-text-muted); pointer-events: none; }
    .canvas-item { position: absolute; cursor: move; border-radius: var(--dw-radius-md); transition: box-shadow 0.15s; }
    .canvas-item:hover { box-shadow: 0 0 0 2px var(--dw-primary); }
    .canvas-item img { width: clamp(110px, 16vw, 150px); height: auto; border-radius: var(--dw-radius-md); pointer-events: none; }
    .item-controls { position: absolute; top: -8px; right: -8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
    .canvas-item:hover .item-controls { opacity: 1; }
    .item-controls button { width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--dw-surface-card); color: var(--dw-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .item-controls button:hover { background: var(--dw-primary); color: white; }
    .item-controls mat-icon { font-size: 16px; width: 16px; height: 16px; }
    @media (max-width: 768px) {
      .items-panel { display: none; }
      .outfit-canvas-page { display: block; }
      .canvas-area { padding: 10px; gap: 10px; }
      .mobile-items-panel { display: block; padding: 10px; border-radius: var(--dw-radius-lg); }
      .mobile-items-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; }
      .mobile-items-header h4 { margin: 0; font-size: 0.92rem; }
      .source-filters.mobile { margin-bottom: 8px; }
      .mobile-items-row { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 2px; }
      .mobile-items-row::-webkit-scrollbar { display: none; }
      .mobile-item-chip { position: relative; overflow: hidden; min-width: 118px; border: 1px solid rgba(140,123,112,0.2); border-radius: 12px; background: var(--dw-surface-card); color: var(--dw-text-primary); padding: 6px; display: grid; gap: 6px; text-align: left; }
      .mobile-item-chip.selected { border-color: color-mix(in srgb, var(--dw-primary) 50%, transparent); box-shadow: 0 0 0 2px color-mix(in srgb, var(--dw-primary) 20%, transparent); }
      .mobile-item-chip.selected::after {
        content: '';
        position: absolute;
        inset: 0;
        background: color-mix(in srgb, var(--dw-surface-overlay) 34%, rgba(0, 0, 0, 0.28));
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        pointer-events: none;
      }
      .mobile-item-chip img { width: 100%; height: 70px; border-radius: 8px; object-fit: cover; display: block; }
      .mobile-item-chip span { font-size: 11px; line-height: 1.2; white-space: normal; }
      .mobile-item-chip .add-overlay-mobile {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
        color: var(--dw-text-primary);
        background: transparent;
        border: 1.5px solid color-mix(in srgb, var(--dw-text-primary) 62%, transparent);
        border-radius: 999px;
        min-width: 104px;
        padding: 6px 12px;
        opacity: 1;
        cursor: pointer;
        z-index: 2;
        transition: border-color var(--dw-transition-fast), color var(--dw-transition-fast);
      }
      .mobile-item-chip .add-overlay-mobile:active {
        border-color: color-mix(in srgb, var(--dw-primary) 60%, transparent);
        color: color-mix(in srgb, var(--dw-primary) 72%, var(--dw-text-primary) 28%);
      }
      .schedule-input-row { flex-direction: column; align-items: stretch; }
      .schedule-header { flex-direction: column; align-items: flex-start; }
      .canvas { min-height: 360px; }
      .item-controls { opacity: 1; }
    }
  `],
})
export class OutfitCanvasComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private canvasRef = viewChild<ElementRef<HTMLDivElement>>('canvasEl');

  wardrobeItems = this.wardrobeService.items;
  accessoryItems = this.wardrobeService.accessoryList;

  availableItems = computed<CanvasSourceItem[]>(() => {
    const wardrobe = this.wardrobeItems().map(item => this.toSource(item, 'wardrobe'));
    const accessories = this.accessoryItems().map(item => this.toSource(item, 'accessory'));
    return [...wardrobe, ...accessories];
  });

  canvasItems = signal<CanvasPlacedItem[]>([]);
  outfitName = signal('');
  dateInput = signal('');
  plannedDates = signal<string[]>([]);
  editingOutfitId = signal<string | null>(null);
  mobileCatalogOpen = signal(true);
  sourceFilter = signal<CanvasSourceFilter>('wardrobe');
  selectedMobileItemKey = signal<string | null>(null);
  private maxZ = signal(1);

  filteredAvailableItems = computed(() =>
    this.availableItems().filter(item => item.type === this.sourceFilter())
  );

  ngOnInit(): void {
    const preselectedDate = this.normalizeDate(this.route.snapshot.queryParamMap.get('date') ?? '');
    if (preselectedDate) {
      this.addPlannedDate(preselectedDate);
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    const outfit = this.wardrobeService.getOutfitById(id);
    if (!outfit) {
      return;
    }

    this.editingOutfitId.set(id);
    this.outfitName.set(outfit.name);
    this.plannedDates.set([...(outfit.plannedDates ?? [])].sort());

    const sourceById = new Map(this.availableItems().map(item => [item.id, item]));
    const placed: CanvasPlacedItem[] = outfit.items
      .map(item => {
        const source = sourceById.get(item.itemId);
        if (!source) {
          return null;
        }
        return {
          ...source,
          x: item.positionX,
          y: item.positionY,
          scale: item.scale,
          zIndex: item.zIndex,
        };
      })
      .filter((item): item is CanvasPlacedItem => item !== null);
    this.canvasItems.set(placed);
    this.maxZ.set(Math.max(1, ...placed.map(item => item.zIndex + 1)));
  }

  addToCanvas(item: CanvasSourceItem): void {
    const { width, height } = this.getCanvasBounds();
    const imageWidth = 140;
    const imageHeight = 170;
    const safeX = Math.max(12, width - imageWidth - 12);
    const safeY = Math.max(12, height - imageHeight - 12);
    this.canvasItems.update(items => [
      ...items,
      {
        ...item,
        x: 12 + Math.random() * safeX,
        y: 12 + Math.random() * safeY,
        scale: 1,
        zIndex: this.nextZIndex(),
      },
    ]);
  }

  selectMobileItem(item: CanvasSourceItem): void {
    const key = `${item.type}-${item.id}`;
    this.selectedMobileItemKey.update(current => (current === key ? null : key));
  }

  isMobileItemSelected(item: CanvasSourceItem): boolean {
    return this.selectedMobileItemKey() === `${item.type}-${item.id}`;
  }

  addFromMobile(item: CanvasSourceItem, event: Event): void {
    event.stopPropagation();
    this.addToCanvas(item);
    this.selectedMobileItemKey.set(null);
  }

  onDragEnd(event: CdkDragEnd, index: number): void {
    const delta = event.source.getFreeDragPosition();
    this.canvasItems.update(items => {
      const next = [...items];
      const current = next[index];
      const clamped = this.clampPosition(current.x + delta.x, current.y + delta.y);
      next[index] = { ...current, x: clamped.x, y: clamped.y };
      return next;
    });
    event.source.reset();
  }

  removeFromCanvas(index: number): void {
    this.canvasItems.update(items => items.filter((_, i) => i !== index));
  }

  bringToFront(index: number): void {
    this.canvasItems.update(items => {
      const next = [...items];
      next[index] = { ...next[index], zIndex: this.nextZIndex() };
      return next;
    });
  }

  clearCanvas(): void {
    this.canvasItems.set([]);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.canvasItems.update(items => items.map(item => ({ ...item, ...this.clampPosition(item.x, item.y) })));
  }

  addDate(): void {
    const normalized = this.normalizeDate(this.dateInput());
    if (!normalized) {
      return;
    }
    this.addPlannedDate(normalized);
    this.dateInput.set('');
  }

  removeDate(date: string): void {
    this.plannedDates.update(days => days.filter(day => day !== date));
  }

  addWorkWeek(): void {
    const today = new Date();
    const day = today.getDay() || 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - day + 1);
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      this.addPlannedDate(this.toISODate(date));
    }
  }

  saveOutfit(): void {
    const outfitName = this.outfitName().trim();
    if (!outfitName || this.canvasItems().length === 0) {
      return;
    }

    const items: OutfitItem[] = this.canvasItems().map(item => ({
      itemId: item.id,
      type: item.type,
      positionX: item.x,
      positionY: item.y,
      scale: item.scale,
      rotation: 0,
      zIndex: item.zIndex,
    }));

    const imageUrl = this.canvasItems()[0]?.imageUrl;
    const plannedDates = [...this.plannedDates()].sort();
    const editId = this.editingOutfitId();

    if (editId) {
      this.wardrobeService.updateOutfit(editId, {
        name: outfitName,
        items,
        imageUrl,
        plannedDates,
      });
    } else {
      this.wardrobeService.addOutfit({
        name: outfitName,
        items,
        favorite: false,
        imageUrl,
        plannedDates,
      });
    }

    this.router.navigate(['/outfits']);
  }

  cancelEdit(): void {
    const editId = this.editingOutfitId();
    if (editId) {
      this.router.navigate(['/outfits', editId]);
      return;
    }
    this.router.navigate(['/outfits']);
  }

  private toSource(item: WardrobeItem | Accessory, type: 'wardrobe' | 'accessory'): CanvasSourceItem {
    return {
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      type,
    };
  }

  private addPlannedDate(date: string): void {
    this.plannedDates.update(days => {
      if (days.includes(date)) {
        return days;
      }
      return [...days, date].sort();
    });
  }

  private normalizeDate(value: string): string | null {
    if (!value) {
      return null;
    }
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) {
      return null;
    }
    const [year, month, day] = parts;
    return `${year}-${`${month}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
  }

  private toISODate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private clampPosition(x: number, y: number): { x: number; y: number } {
    const { width, height } = this.getCanvasBounds();
    const imageWidth = 140;
    const imageHeight = 170;
    const min = 8;
    const maxX = Math.max(min, width - imageWidth - min);
    const maxY = Math.max(min, height - imageHeight - min);
    return {
      x: Math.min(Math.max(x, min), maxX),
      y: Math.min(Math.max(y, min), maxY),
    };
  }

  private getCanvasBounds(): { width: number; height: number } {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return { width: 640, height: 520 };
    }
    return {
      width: canvas.clientWidth || 640,
      height: canvas.clientHeight || 520,
    };
  }

  private nextZIndex(): number {
    const current = this.maxZ();
    this.maxZ.set(current + 1);
    return current;
  }
}
