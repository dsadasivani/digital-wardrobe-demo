import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { HttpErrorResponse } from '@angular/common/http';
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
import { Accessory, Outfit, OutfitItem, WardrobeItem } from '../../core/models';
import { WardrobeService } from '../../core/services';
import { ImageReadyDirective } from '../../shared/directives/image-ready.directive';

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
    ImageReadyDirective,
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
              <img [src]="item.imageUrl" [dwImageReady]="item.imageUrl" [alt]="item.name" />
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
            <button mat-raised-button color="primary" class="save-btn" (click)="saveOutfit()" [disabled]="isSaving() || !!loadError()">
              <mat-icon>save</mat-icon>{{ editingOutfitId() ? 'Update Outfit' : 'Save Outfit' }}
            </button>
          </div>
        </header>

        @if (saveError()) {
          <p class="form-error">{{ saveError() }}</p>
        }
        @if (loadError()) {
          <p class="form-error">{{ loadError() }}</p>
        }

        <section class="canvas-toolbar glass">
          <div class="toolbar-group">
            <button mat-stroked-button type="button" (click)="autoArrange()">
              <mat-icon>auto_awesome</mat-icon>Auto Arrange
            </button>
            <button mat-stroked-button type="button" (click)="fitItemsToCanvas()">
              <mat-icon>fit_screen</mat-icon>Fit to Canvas
            </button>
            <button mat-stroked-button type="button" (click)="showGrid.set(!showGrid())">
              <mat-icon>{{ showGrid() ? 'grid_off' : 'grid_on' }}</mat-icon>
              Grid {{ showGrid() ? 'On' : 'Off' }}
            </button>
            <button mat-stroked-button type="button" (click)="snapToGrid.set(!snapToGrid())">
              <mat-icon>{{ snapToGrid() ? 'toggle_on' : 'toggle_off' }}</mat-icon>
              Snap {{ snapToGrid() ? 'On' : 'Off' }}
            </button>
          </div>
          <div class="toolbar-meta">
            <span>{{ canvasItems().length }} items</span>
            @if (selectedItem()) {
              <span>Selected: {{ selectedItem()!.name }}</span>
            }
          </div>
        </section>

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
                  <img [src]="item.imageUrl" [dwImageReady]="item.imageUrl" [alt]="item.name" />
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

        <div class="canvas" #canvasEl [class.grid-visible]="showGrid()" (click)="clearSelection()">
          <div class="canvas-bg">
            <span>Drag items here to create your outfit</span>
          </div>
          @for (item of canvasItems(); track item.type + '-' + item.id + '-' + $index; let i = $index) {
            <div
              class="canvas-item"
              [class.selected]="selectedCanvasIndex() === i"
              cdkDrag
              [cdkDragBoundary]="'.canvas'"
              [style.left.px]="item.x"
              [style.top.px]="item.y"
              [style.z-index]="item.zIndex"
              (click)="onCanvasItemClick(i, $event)"
              (cdkDragEnded)="onDragEnd($event, i)">
              <img [src]="item.imageUrl" [dwImageReady]="item.imageUrl" [alt]="item.name" [style.transform]="'scale(' + item.scale + ')'" />
              <div class="item-controls">
                <button (click)="scaleItem(i, -0.05, $event)" matTooltip="Scale down"><mat-icon>remove</mat-icon></button>
                <button (click)="scaleItem(i, 0.05, $event)" matTooltip="Scale up"><mat-icon>add</mat-icon></button>
                <button (click)="bringToFront(i, $event)" matTooltip="Bring to front"><mat-icon>flip_to_front</mat-icon></button>
                <button (click)="removeFromCanvas(i, $event)" matTooltip="Remove"><mat-icon>close</mat-icon></button>
              </div>
            </div>
          }
        </div>

        @if (selectedItem(); as currentItem) {
          <section class="item-editor glass">
            <div class="item-editor-header">
              <h4>Editing: {{ currentItem.name }}</h4>
              <button mat-stroked-button type="button" (click)="clearSelection()">
                <mat-icon>check</mat-icon>Done
              </button>
            </div>
            <div class="item-editor-grid">
              <div class="scale-controls">
                <span>Scale</span>
                <button type="button" (click)="scaleSelected(-0.05)">-</button>
                <input
                  type="range"
                  min="0.6"
                  max="1.8"
                  step="0.05"
                  [ngModel]="currentItem.scale"
                  (ngModelChange)="setSelectedScale($event)"
                />
                <button type="button" (click)="scaleSelected(0.05)">+</button>
              </div>
              <div class="nudge-controls">
                <span>Nudge</span>
                <div class="nudge-pad">
                  <button type="button" (click)="nudgeSelected(0, -12)">U</button>
                  <button type="button" (click)="nudgeSelected(-12, 0)">L</button>
                  <button type="button" (click)="nudgeSelected(12, 0)">R</button>
                  <button type="button" (click)="nudgeSelected(0, 12)">D</button>
                </div>
              </div>
              <div class="selected-actions">
                <button mat-stroked-button type="button" (click)="bringSelectedToFront()">
                  <mat-icon>flip_to_front</mat-icon>Bring Front
                </button>
                <button mat-stroked-button type="button" color="warn" (click)="removeSelected()">
                  <mat-icon>delete</mat-icon>Remove
                </button>
              </div>
            </div>
          </section>
        }
      </main>
    </div>
  `,
  styles: [`
    .outfit-canvas-page { display: flex; min-height: calc(100vh - var(--dw-header-height)); }
    .items-panel { width: 280px; padding: var(--dw-spacing-md); border-right: 1px solid var(--dw-border-subtle); overflow-y: auto; flex-shrink: 0; }
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
    .canvas-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .form-error { margin: 0; color: var(--dw-error); font-size: 13px; }
    .canvas-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: var(--dw-radius-lg);
      flex-wrap: wrap;
    }
    .toolbar-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .toolbar-meta { display: flex; gap: 8px; align-items: center; font-size: 12px; color: var(--dw-text-secondary); }
    .toolbar-meta span {
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(140,123,112,0.2);
      background: var(--dw-surface-card);
    }
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
    .canvas { flex: 1; position: relative; background: var(--dw-surface-elevated); border-radius: var(--dw-radius-xl); border: 1px solid var(--dw-border-subtle); overflow: hidden; min-height: 520px; isolation: isolate; }
    .canvas.grid-visible::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, color-mix(in srgb, var(--dw-text-muted) 15%, transparent) 1px, transparent 1px),
        linear-gradient(to bottom, color-mix(in srgb, var(--dw-text-muted) 15%, transparent) 1px, transparent 1px);
      background-size: 24px 24px;
      opacity: 0.45;
      pointer-events: none;
      z-index: 0;
    }
    .canvas-bg { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--dw-text-muted); pointer-events: none; }
    .canvas-item { position: absolute; cursor: move; border-radius: var(--dw-radius-md); transition: box-shadow 0.15s; }
    .canvas-item:hover { box-shadow: 0 0 0 2px var(--dw-primary); }
    .canvas-item.selected { box-shadow: 0 0 0 2px color-mix(in srgb, var(--dw-primary) 74%, white); }
    .canvas-item img { width: clamp(110px, 16vw, 150px); height: auto; border-radius: var(--dw-radius-md); pointer-events: none; }
    .item-controls { position: absolute; top: -8px; right: -8px; display: flex; gap: 4px; opacity: 0; transition: opacity 0.15s; }
    .canvas-item:hover .item-controls, .canvas-item.selected .item-controls { opacity: 1; }
    .item-controls button { width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--dw-surface-card); color: var(--dw-text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .item-controls button:hover { background: var(--dw-primary); color: white; }
    .item-controls mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .item-editor {
      padding: 10px 12px;
      border-radius: var(--dw-radius-lg);
      display: grid;
      gap: 10px;
    }
    .item-editor-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .item-editor-header h4 { margin: 0; font-size: 0.95rem; }
    .item-editor-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
      align-items: stretch;
    }
    .scale-controls,
    .nudge-controls,
    .selected-actions {
      border: 1px solid rgba(140,123,112,0.2);
      border-radius: var(--dw-radius-md);
      background: var(--dw-surface-card);
      padding: 8px;
      display: grid;
      gap: 8px;
    }
    .scale-controls span,
    .nudge-controls span {
      font-size: 11px;
      color: var(--dw-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .scale-controls { grid-template-columns: auto auto 1fr auto; align-items: center; }
    .scale-controls input[type="range"] { width: 100%; accent-color: var(--dw-primary); }
    .scale-controls button,
    .nudge-pad button {
      border: 1px solid rgba(140,123,112,0.2);
      border-radius: 8px;
      background: var(--dw-surface-elevated);
      color: var(--dw-text-primary);
      cursor: pointer;
      height: 30px;
      min-width: 30px;
    }
    .scale-controls button:hover,
    .nudge-pad button:hover {
      border-color: color-mix(in srgb, var(--dw-primary) 50%, transparent);
      color: var(--dw-primary);
    }
    .nudge-pad {
      display: grid;
      grid-template-columns: repeat(3, 30px);
      grid-template-rows: repeat(2, 30px);
      gap: 4px;
      justify-content: start;
      grid-template-areas:
        ". up ."
        "left down right";
    }
    .nudge-pad button:nth-child(1) { grid-area: up; }
    .nudge-pad button:nth-child(2) { grid-area: left; }
    .nudge-pad button:nth-child(3) { grid-area: right; }
    .nudge-pad button:nth-child(4) { grid-area: down; }
    .selected-actions { align-content: center; }
    .selected-actions button { justify-content: flex-start; }
    @media (max-width: 768px) {
      .items-panel { display: none; }
      .outfit-canvas-page { display: block; }
      .canvas-area { padding: 10px; gap: 10px; }
      .canvas-toolbar { padding: 10px; }
      .toolbar-group { width: 100%; }
      .toolbar-group button { flex: 1 1 140px; }
      .toolbar-meta { width: 100%; }
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
      .item-editor-grid { grid-template-columns: 1fr; }
      .scale-controls { grid-template-columns: auto auto 1fr auto; }
    }
  `],
})
export class OutfitCanvasComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private canvasRef = viewChild<ElementRef<HTMLDivElement>>('canvasEl');
  private readonly itemWidth = 140;
  private readonly itemHeight = 170;
  private readonly boundaryPadding = 8;
  private readonly gridStep = 12;

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
  selectedCanvasIndex = signal<number | null>(null);
  showGrid = signal(true);
  snapToGrid = signal(false);
  saveError = signal<string | null>(null);
  loadError = signal<string | null>(null);
  isSaving = signal(false);
  private maxZ = signal(1);
  private lastCanvasBounds = signal<{ width: number; height: number } | null>(null);

  filteredAvailableItems = computed(() =>
    this.availableItems().filter(item => item.type === this.sourceFilter())
  );
  selectedItem = computed<CanvasPlacedItem | null>(() => {
    const index = this.selectedCanvasIndex();
    if (index === null) {
      return null;
    }
    return this.canvasItems()[index] ?? null;
  });

  ngOnInit(): void {
    const preselectedDate = this.normalizeDate(this.route.snapshot.queryParamMap.get('date') ?? '');
    if (preselectedDate) {
      this.addPlannedDate(preselectedDate);
    }
    void this.initializeCanvas();
  }

  private async initializeCanvas(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    this.loadError.set(null);

    try {
      await Promise.all([
        this.wardrobeService.ensureWardrobeLoaded(),
        this.wardrobeService.ensureAccessoriesLoaded(),
      ]);
    } catch {
      this.loadError.set('Unable to load wardrobe data. Please refresh and try again.');
      return;
    }

    if (!id) {
      this.requestCanvasReflow('clamp');
      return;
    }

    let outfit: Outfit | undefined;
    try {
      outfit = await this.wardrobeService.fetchOutfitById(id);
      if (outfit) {
        await this.wardrobeService.ensureOutfitDependenciesLoaded(outfit);
      }
    } catch {
      this.loadError.set('Unable to load outfit details. Please refresh and try again.');
      return;
    }

    if (!outfit) {
      this.loadError.set('Unable to find the requested outfit.');
      return;
    }

    this.editingOutfitId.set(id);
    this.outfitName.set(outfit.name);
    this.plannedDates.set([...(outfit.plannedDates ?? [])].sort());

    const sourceById = new Map(this.availableItems().map(item => [item.id, item]));
    const bounds = this.getCanvasBounds();
    this.lastCanvasBounds.set(bounds);
    const placed: CanvasPlacedItem[] = outfit.items
      .map(item => {
        const source = sourceById.get(item.itemId);
        if (!source) {
          return null;
        }
        return {
          ...source,
          x: this.decodeStoredPosition(item.positionX, bounds.width),
          y: this.decodeStoredPosition(item.positionY, bounds.height),
          scale: this.clampScale(item.scale),
          zIndex: item.zIndex,
        };
      })
      .filter((item): item is CanvasPlacedItem => item !== null);
    this.canvasItems.set(placed.map(item => ({ ...item, ...this.clampPosition(item.x, item.y, false) })));
    this.maxZ.set(Math.max(1, ...placed.map(item => item.zIndex + 1)));
    this.requestCanvasReflow('proportional');
  }

  addToCanvas(item: CanvasSourceItem): void {
    const { width, height } = this.getCanvasBounds();
    const safeX = Math.max(0, width - this.itemWidth - this.boundaryPadding * 2);
    const safeY = Math.max(0, height - this.itemHeight - this.boundaryPadding * 2);
    const nextPosition = this.clampPosition(
      this.boundaryPadding + Math.random() * safeX,
      this.boundaryPadding + Math.random() * safeY,
      this.snapToGrid(),
    );
    const zIndex = this.nextZIndex();
    let nextIndex = 0;
    this.canvasItems.update(items => {
      nextIndex = items.length;
      return [
        ...items,
        {
          ...item,
          x: nextPosition.x,
          y: nextPosition.y,
          scale: 1,
          zIndex,
        },
      ];
    });
    this.selectedCanvasIndex.set(nextIndex);
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

  onCanvasItemClick(index: number, event: Event): void {
    event.stopPropagation();
    this.selectedCanvasIndex.set(index);
  }

  onDragEnd(event: CdkDragEnd, index: number): void {
    const delta = event.source.getFreeDragPosition();
    this.selectedCanvasIndex.set(index);
    this.canvasItems.update(items => {
      const next = [...items];
      const current = next[index];
      const clamped = this.clampPosition(current.x + delta.x, current.y + delta.y);
      next[index] = { ...current, x: clamped.x, y: clamped.y };
      return next;
    });
    event.source.reset();
  }

  removeFromCanvas(index: number, event?: Event): void {
    event?.stopPropagation();
    this.canvasItems.update(items => items.filter((_, i) => i !== index));
    this.selectedCanvasIndex.update(selected => {
      if (selected === null) {
        return null;
      }
      if (selected === index) {
        return null;
      }
      return selected > index ? selected - 1 : selected;
    });
  }

  bringToFront(index: number, event?: Event): void {
    event?.stopPropagation();
    this.canvasItems.update(items => {
      const next = [...items];
      next[index] = { ...next[index], zIndex: this.nextZIndex() };
      return next;
    });
    this.selectedCanvasIndex.set(index);
  }

  scaleItem(index: number, delta: number, event?: Event): void {
    event?.stopPropagation();
    this.canvasItems.update(items => {
      const next = [...items];
      const current = next[index];
      next[index] = { ...current, scale: this.clampScale(current.scale + delta) };
      return next;
    });
    this.selectedCanvasIndex.set(index);
  }

  clearCanvas(): void {
    this.canvasItems.set([]);
    this.selectedCanvasIndex.set(null);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.requestCanvasReflow('proportional');
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (this.selectedCanvasIndex() === null) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return;
    }

    const step = event.shiftKey ? this.gridStep * 2 : this.gridStep;
    switch (event.key) {
      case 'ArrowUp':
        this.nudgeSelected(0, -step);
        event.preventDefault();
        break;
      case 'ArrowDown':
        this.nudgeSelected(0, step);
        event.preventDefault();
        break;
      case 'ArrowLeft':
        this.nudgeSelected(-step, 0);
        event.preventDefault();
        break;
      case 'ArrowRight':
        this.nudgeSelected(step, 0);
        event.preventDefault();
        break;
      case 'Delete':
      case 'Backspace':
        this.removeSelected();
        event.preventDefault();
        break;
      case '[':
        this.scaleSelected(-0.05);
        event.preventDefault();
        break;
      case ']':
        this.scaleSelected(0.05);
        event.preventDefault();
        break;
      default:
        break;
    }
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

  async saveOutfit(): Promise<void> {
    const outfitName = this.outfitName().trim();
    if (!outfitName || this.canvasItems().length === 0) {
      this.saveError.set('Outfit name and at least one item are required.');
      return;
    }
    this.saveError.set(null);
    this.isSaving.set(true);
    const { width, height } = this.getCanvasBounds();

    const items: OutfitItem[] = this.canvasItems().map(item => ({
      itemId: item.id,
      type: item.type,
      positionX: this.encodePosition(item.x, width),
      positionY: this.encodePosition(item.y, height),
      scale: item.scale,
      rotation: 0,
      zIndex: item.zIndex,
    }));

    const imageUrl = [...this.canvasItems()].sort((left, right) => right.zIndex - left.zIndex)[0]?.imageUrl;
    const plannedDates = [...this.plannedDates()].sort();
    const editId = this.editingOutfitId();

    try {
      if (editId) {
        await this.wardrobeService.updateOutfit(editId, {
          name: outfitName,
          items,
          imageUrl,
          plannedDates,
        });
      } else {
        await this.wardrobeService.addOutfit({
          name: outfitName,
          items,
          favorite: false,
          imageUrl,
          plannedDates,
        });
      }

      await this.router.navigate(['/outfits']);
    } catch (error) {
      this.saveError.set(this.extractErrorMessage(error));
    } finally {
      this.isSaving.set(false);
    }
  }

  cancelEdit(): void {
    const editId = this.editingOutfitId();
    if (editId) {
      this.router.navigate(['/outfits', editId]);
      return;
    }
    this.router.navigate(['/outfits']);
  }

  clearSelection(): void {
    this.selectedCanvasIndex.set(null);
  }

  fitItemsToCanvas(): void {
    this.reflowCanvasItems('clamp');
  }

  autoArrange(): void {
    const { width } = this.getCanvasBounds();
    const usableWidth = Math.max(1, width - this.boundaryPadding * 2);
    const slotWidth = this.itemWidth + this.gridStep * 2;
    const columns = Math.max(1, Math.floor((usableWidth + this.gridStep) / slotWidth));

    this.canvasItems.update(items =>
      items.map((item, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const targetX = this.boundaryPadding + column * slotWidth;
        const targetY = this.boundaryPadding + row * (this.itemHeight + this.gridStep * 2);
        const clamped = this.clampPosition(targetX, targetY, true);
        return {
          ...item,
          x: clamped.x,
          y: clamped.y,
          zIndex: index + 1,
        };
      })
    );
    this.maxZ.set(Math.max(1, this.canvasItems().length + 1));
  }

  bringSelectedToFront(): void {
    const index = this.selectedCanvasIndex();
    if (index === null) {
      return;
    }
    this.bringToFront(index);
  }

  removeSelected(): void {
    const index = this.selectedCanvasIndex();
    if (index === null) {
      return;
    }
    this.removeFromCanvas(index);
  }

  scaleSelected(delta: number): void {
    const index = this.selectedCanvasIndex();
    if (index === null) {
      return;
    }
    this.scaleItem(index, delta);
  }

  setSelectedScale(value: number | string): void {
    const index = this.selectedCanvasIndex();
    if (index === null) {
      return;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    this.canvasItems.update(items => {
      const next = [...items];
      next[index] = { ...next[index], scale: this.clampScale(parsed) };
      return next;
    });
  }

  nudgeSelected(deltaX: number, deltaY: number): void {
    const index = this.selectedCanvasIndex();
    if (index === null) {
      return;
    }
    this.canvasItems.update(items => {
      const next = [...items];
      const current = next[index];
      const clamped = this.clampPosition(current.x + deltaX, current.y + deltaY);
      next[index] = { ...current, x: clamped.x, y: clamped.y };
      return next;
    });
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

  private clampPosition(x: number, y: number, snap = this.snapToGrid()): { x: number; y: number } {
    const { width, height } = this.getCanvasBounds();
    const min = this.boundaryPadding;
    const maxX = Math.max(min, width - this.itemWidth - min);
    const maxY = Math.max(min, height - this.itemHeight - min);
    const snappedX = snap ? this.snapValue(x) : x;
    const snappedY = snap ? this.snapValue(y) : y;
    return {
      x: Math.min(Math.max(snappedX, min), maxX),
      y: Math.min(Math.max(snappedY, min), maxY),
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

  private snapValue(value: number): number {
    return Math.round(value / this.gridStep) * this.gridStep;
  }

  private clampScale(scale: number): number {
    return Math.min(Math.max(scale, 0.6), 1.8);
  }

  private encodePosition(value: number, bound: number): number {
    if (bound <= 0 || !Number.isFinite(value)) {
      return 0;
    }
    return Number((value / bound).toFixed(6));
  }

  private decodeStoredPosition(value: number, bound: number): number {
    if (!Number.isFinite(value)) {
      return this.boundaryPadding;
    }
    if (value >= 0 && value <= 1) {
      return value * bound;
    }
    return value;
  }

  private requestCanvasReflow(mode: 'proportional' | 'clamp'): void {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.reflowCanvasItems(mode));
    });
  }

  private reflowCanvasItems(mode: 'proportional' | 'clamp'): void {
    const currentBounds = this.getCanvasBounds();
    const previousBounds = this.lastCanvasBounds();

    if (this.canvasItems().length > 0) {
      const canScale = mode === 'proportional' && previousBounds !== null;
      const widthScale = canScale ? currentBounds.width / Math.max(previousBounds.width, 1) : 1;
      const heightScale = canScale ? currentBounds.height / Math.max(previousBounds.height, 1) : 1;
      this.canvasItems.update(items =>
        items.map(item => {
          const scaledX = canScale ? item.x * widthScale : item.x;
          const scaledY = canScale ? item.y * heightScale : item.y;
          const clamped = this.clampPosition(scaledX, scaledY);
          return { ...item, x: clamped.x, y: clamped.y };
        }),
      );
    }

    this.lastCanvasBounds.set(currentBounds);
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const fieldError = error.error?.fieldErrors?.[0];
      if (fieldError?.field && fieldError?.message) {
        return `${fieldError.field}: ${fieldError.message}`;
      }
      if (typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'Unable to save outfit. Please review your inputs and try again.';
  }
}
