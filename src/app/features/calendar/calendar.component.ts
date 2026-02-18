import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { Outfit } from '../../core/models';
import { WardrobeService } from '../../core/services/wardrobe.service';

interface CalendarDay {
  isoDate: string;
  day: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  outfits: Outfit[];
}

interface DaySheetData {
  isoDate: string;
  dateLabel: string;
  outfitsForDate: Outfit[];
  allOutfits: Outfit[];
  fallbackImage: string;
}

interface DayPopoverState {
  isoDate: string;
  dateLabel: string;
  top: number;
  left: number;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-day-outfits-sheet',
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
  template: `
    <div class="day-sheet">
      <div class="sheet-handle"></div>
      <h3>{{ data.dateLabel }}</h3>
      @if (data.outfitsForDate.length > 0) {
        <div class="sheet-subtitle">Already Added</div>
        <div class="sheet-existing-list">
          @for (outfit of data.outfitsForDate; track outfit.id) {
            <button class="sheet-card existing" type="button" (click)="openOutfit(outfit.id)">
              <img [src]="outfit.imageUrl || data.fallbackImage" [alt]="outfit.name" />
              <div class="sheet-card-info">
                <strong>{{ outfit.name }}</strong>
                <span>{{ outfit.occasion || 'General' }}</span>
              </div>
              <span class="sheet-pill">Added</span>
            </button>
          }
        </div>
      }
      @if (!showExistingPicker()) {
        <div class="sheet-actions">
          <button class="add-outfit-btn" type="button" (click)="addOutfitForDay()">
            <mat-icon>add</mat-icon>
            Add New Outfit
          </button>
          <button
            class="add-outfit-btn"
            type="button"
            [disabled]="addableOutfitsCount() === 0"
            (click)="showExistingPicker.set(true)">
            <mat-icon>style</mat-icon>
            Add Existing Outfit
          </button>
        </div>
      } @else {
        <div class="sheet-picker-header">
          <button class="picker-back-btn" type="button" (click)="closeExistingPicker()">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>
        </div>
        <input
          class="sheet-search"
          type="text"
          placeholder="Search outfits..."
          [ngModel]="searchQuery()"
          (ngModelChange)="searchQuery.set($event)" />
        <div class="sheet-list">
          @for (outfit of filteredOutfits(); track outfit.id) {
            <button class="sheet-card" type="button" (click)="addExistingOutfit(outfit.id)">
              <img [src]="outfit.imageUrl || data.fallbackImage" [alt]="outfit.name" />
              <div class="sheet-card-info">
                <strong>{{ outfit.name }}</strong>
                <span>{{ outfit.occasion || 'General' }}</span>
              </div>
              @if (isScheduledForDay(outfit)) {
                <span class="sheet-pill">Added</span>
              } @else {
                <span class="sheet-pill add">Add</span>
              }
            </button>
          } @empty {
            <div class="empty-sheet-state">
              <mat-icon>event_busy</mat-icon>
              <span>No matching outfits found.</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .day-sheet { padding: 10px 12px calc(14px + var(--dw-safe-bottom)); }
    .sheet-handle { width: 40px; height: 4px; border-radius: 999px; background: var(--dw-text-muted); opacity: 0.5; margin: 0 auto 12px; }
    h3 { margin: 0 0 10px; font-size: 1rem; color: var(--dw-text-primary); }
    .add-outfit-btn {
      width: 100%;
      border: 1px solid rgba(140,123,112,0.22);
      border-radius: 14px;
      min-height: 42px;
      margin-bottom: 10px;
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: background-color var(--dw-transition-fast), color var(--dw-transition-fast), border-color var(--dw-transition-fast), opacity var(--dw-transition-fast);
    }
    .add-outfit-btn:disabled {
      background: color-mix(in srgb, var(--dw-surface-card) 82%, #888 18%);
      color: color-mix(in srgb, var(--dw-text-secondary) 78%, #666 22%);
      border-color: rgba(140,123,112,0.12);
      cursor: not-allowed;
      opacity: 0.7;
    }
    .sheet-actions { display: grid; gap: 10px; }
    .sheet-existing-list {
      display: grid;
      gap: 8px;
      max-height: 156px;
      overflow-y: auto;
      padding-right: 2px;
      margin-bottom: 10px;
    }
    .sheet-picker-header { margin-bottom: 8px; }
    .picker-back-btn {
      border: 1px solid rgba(140,123,112,0.2);
      border-radius: 10px;
      min-height: 34px;
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0 10px;
    }
    .sheet-search {
      width: 100%;
      height: 38px;
      border-radius: 10px;
      border: 1px solid rgba(140,123,112,0.2);
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      padding: 0 10px;
      margin-bottom: 8px;
      outline: none;
    }
    .sheet-list {
      display: grid;
      gap: 8px;
      max-height: 156px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .sheet-card { width: 100%; border: 1px solid rgba(140,123,112,0.18); border-radius: 14px; padding: 8px; background: var(--dw-surface-card); display: flex; align-items: center; gap: 10px; text-align: left; }
    .sheet-card.existing { cursor: pointer; }
    .sheet-card img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; }
    .sheet-card-info { display: grid; gap: 2px; }
    .sheet-card-info span { font-size: 12px; color: var(--dw-text-secondary); }
    .sheet-pill {
      margin-left: auto;
      font-size: 11px;
      border-radius: 999px;
      border: 1px solid rgba(140,123,112,0.25);
      padding: 2px 8px;
      color: var(--dw-text-secondary);
    }
    .sheet-pill.add {
      border-color: color-mix(in srgb, var(--dw-primary) 40%, transparent);
      color: var(--dw-primary);
    }
    .empty-sheet-state {
      min-height: 84px;
      border: 1px dashed rgba(140,123,112,0.2);
      border-radius: 12px;
      color: var(--dw-text-secondary);
      display: grid;
      place-items: center;
      gap: 4px;
      text-align: center;
      padding: 8px;
      font-size: 12px;
    }
    .empty-sheet-state mat-icon { font-size: 20px; width: 20px; height: 20px; }
  `],
})
export class DayOutfitsSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<DayOutfitsSheetComponent>);
  private router = inject(Router);
  private wardrobeService = inject(WardrobeService);
  data = inject<DaySheetData>(MAT_BOTTOM_SHEET_DATA);
  showExistingPicker = signal(false);
  searchQuery = signal('');
  filteredOutfits = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return this.data.allOutfits;
    }
    return this.data.allOutfits.filter(outfit =>
      outfit.name.toLowerCase().includes(query) ||
      (outfit.occasion ?? '').toLowerCase().includes(query) ||
      (outfit.season ?? '').toLowerCase().includes(query)
    );
  });
  addableOutfitsCount = computed(
    () => this.data.allOutfits.filter(outfit => !this.isScheduledForDay(outfit)).length
  );

  openOutfit(outfitId: string): void {
    this.bottomSheetRef.dismiss();
    this.router.navigate(['/outfits', outfitId]);
  }

  addOutfitForDay(): void {
    this.bottomSheetRef.dismiss();
    this.router.navigate(['/outfit-canvas'], {
      queryParams: { date: this.data.isoDate },
    });
  }

  closeExistingPicker(): void {
    this.showExistingPicker.set(false);
    this.searchQuery.set('');
  }

  isScheduledForDay(outfit: Outfit): boolean {
    return (outfit.plannedDates ?? []).includes(this.data.isoDate);
  }

  async addExistingOutfit(outfitId: string): Promise<void> {
    const outfit = this.wardrobeService.getOutfitById(outfitId);
    if (!outfit) {
      return;
    }
    if (this.isScheduledForDay(outfit)) {
      return;
    }
    const plannedDates = new Set(outfit.plannedDates ?? []);
    plannedDates.add(this.data.isoDate);
    await this.wardrobeService.updateOutfit(outfit.id, { plannedDates: [...plannedDates].sort() });
    this.bottomSheetRef.dismiss();
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-calendar',
  imports: [CommonModule, FormsModule, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, MatBottomSheetModule, DragDropModule],
  template: `
    <div class="calendar-page animate-fade-in">
      <header class="page-header">
        <div>
          <h1>Outfit Calendar</h1>
          <p class="subtitle">Plan looks by day and track scheduled outfits.</p>
        </div>
        <button class="action-btn primary" routerLink="/outfit-canvas">
          <mat-icon>add</mat-icon>
          Schedule Outfit
        </button>
      </header>
      @if (calendarLoadError()) {
        <p class="calendar-error">{{ calendarLoadError() }}</p>
      }

      <section class="calendar-shell glass">
        <div class="calendar-click-layer" [class.active]="!isMobile() && !!dayPopover()" (click)="closePopover()"></div>
        <div class="calendar-toolbar">
          <button mat-icon-button (click)="changeMonth(-1)" aria-label="Previous month">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <h2>{{ monthLabel() }}</h2>
          <button mat-icon-button (click)="changeMonth(1)" aria-label="Next month">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>

        <div class="weekday-row">
          @for (name of weekDays; track name) {
            <span>{{ name }}</span>
          }
        </div>

        <div class="calendar-grid" cdkDropListGroup>
          @for (day of days(); track day.isoDate) {
            <button
              class="day-cell"
              type="button"
              cdkDropList
              [cdkDropListData]="day.isoDate"
              [cdkDropListSortingDisabled]="true"
              (cdkDropListDropped)="onDrop($event)"
              [class.current-month]="day.inCurrentMonth"
              [class.today]="day.isToday"
              [class.selected]="selectedDate() === day.isoDate"
              [class.has-outfits]="day.outfits.length > 0"
              (click)="selectDate(day, $event)">
              <span class="day-number">{{ day.day }}</span>
              @if (day.outfits.length > 0) {
                <div class="day-preview">
                  @if (isMobile()) {
                    @if (day.outfits[0]; as firstOutfit) {
                      <span
                        class="preview-item"
                        cdkDrag
                        [cdkDragData]="{ outfitId: firstOutfit.id, fromDate: day.isoDate }"
                        [matTooltip]="'Drag ' + firstOutfit.name + ' to another date'"
                        (click)="$event.stopPropagation()">
                        <img [src]="firstOutfit.imageUrl || fallbackImage" [alt]="firstOutfit.name" />
                      </span>
                    }
                    @if (day.outfits.length > 1) {
                      <span class="more">+{{ day.outfits.length - 1 }}</span>
                    }
                  } @else {
                    @for (outfit of day.outfits.slice(0, 2); track outfit.id) {
                      <span
                        class="preview-item"
                        cdkDrag
                        [cdkDragData]="{ outfitId: outfit.id, fromDate: day.isoDate }"
                        [matTooltip]="'Drag ' + outfit.name + ' to another date'"
                        (click)="$event.stopPropagation()">
                        <img [src]="outfit.imageUrl || fallbackImage" [alt]="outfit.name" />
                      </span>
                    }
                    @if (day.outfits.length > 2) {
                      <span class="more">+{{ day.outfits.length - 2 }}</span>
                    }
                  }
                </div>
              }
            </button>
          }
        </div>

        @if (!isMobile() && dayPopover(); as popover) {
          <div
            class="day-popover glass"
            [style.top.px]="popover.top"
            [style.left.px]="popover.left"
            (click)="$event.stopPropagation()">
            <div class="popover-header">
              <h4>{{ popover.dateLabel }}</h4>
              <button mat-icon-button type="button" (click)="closePopover()">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            @if (popoverOutfitsForDate().length > 0) {
              <div class="popover-subtitle">Already Added</div>
              <div class="popover-existing-list">
                @for (outfit of popoverOutfitsForDate(); track outfit.id) {
                  <a class="popover-item existing" [routerLink]="['/outfits', outfit.id]" (click)="closePopover()">
                    <img [src]="outfit.imageUrl || fallbackImage" [alt]="outfit.name" />
                    <span>{{ outfit.name }}</span>
                    <span class="popover-item-pill">Added</span>
                  </a>
                }
              </div>
            }
            @if (!showExistingPicker()) {
              <div class="popover-actions">
                <a class="popover-add-btn" [routerLink]="['/outfit-canvas']" [queryParams]="{ date: popover.isoDate }" (click)="closePopover()">
                  <mat-icon>add</mat-icon>
                  Add New Outfit
                </a>
                <button
                  class="popover-add-btn"
                  type="button"
                  [disabled]="addablePopoverOutfitsCount() === 0"
                  (click)="openExistingPicker()">
                  <mat-icon>style</mat-icon>
                  Add Existing Outfit
                </button>
              </div>
            } @else {
              <div class="popover-picker-header">
                <button class="picker-back-btn" type="button" (click)="closeExistingPicker()">
                  <mat-icon>arrow_back</mat-icon>
                  Back
                </button>
              </div>
              <input
                class="popover-search"
                type="text"
                placeholder="Search outfits..."
                [ngModel]="existingSearchQuery()"
                (ngModelChange)="existingSearchQuery.set($event)" />
              <div class="popover-list">
                @for (outfit of filteredExistingOutfits(); track outfit.id) {
                  <button class="popover-item" type="button" (click)="addOutfitToDate(outfit.id, popover.isoDate)">
                    <img [src]="outfit.imageUrl || fallbackImage" [alt]="outfit.name" />
                    <span>{{ outfit.name }}</span>
                    @if (isScheduledOnDate(outfit, popover.isoDate)) {
                      <span class="popover-item-pill">Added</span>
                    } @else {
                      <span class="popover-item-pill add">Add</span>
                    }
                  </button>
                } @empty {
                  <div class="popover-empty">No matching outfits found.</div>
                }
              </div>
            }
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .calendar-page { padding: var(--dw-spacing-xl); max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: var(--dw-spacing-lg); }
    .subtitle { margin: 0; color: var(--dw-text-secondary); }
    .calendar-error { margin: 0 0 var(--dw-spacing-md); color: var(--dw-error); font-size: 13px; }
    .action-btn { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: var(--dw-radius-md); padding: 10px 16px; color: #fff; background: var(--dw-gradient-primary); }
    .calendar-shell { padding: var(--dw-spacing-md); border-radius: var(--dw-radius-xl); margin-bottom: var(--dw-spacing-lg); }
    .calendar-shell { position: relative; }
    .calendar-click-layer {
      position: absolute;
      inset: 0;
      z-index: 4;
      pointer-events: none;
      background: transparent;
      backdrop-filter: blur(0);
      -webkit-backdrop-filter: blur(0);
      transition: backdrop-filter 160ms ease, background-color 160ms ease;
    }
    .calendar-click-layer.active {
      pointer-events: auto;
      background: color-mix(in srgb, var(--dw-surface-base) 12%, transparent);
      backdrop-filter: blur(3px);
      -webkit-backdrop-filter: blur(3px);
    }
    .calendar-toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .calendar-toolbar h2 { margin: 0; font-size: 1.2rem; }
    .weekday-row { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; color: var(--dw-text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
    .weekday-row span { text-align: center; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; }
    .day-cell { min-height: 88px; border-radius: 14px; border: 1px solid rgba(140, 123, 112, 0.14); background: var(--dw-surface-card); color: var(--dw-text-muted); text-align: left; padding: 8px; display: flex; flex-direction: column; justify-content: space-between; }
    .day-cell.current-month { color: var(--dw-text-primary); }
    .day-cell.today { border-color: var(--dw-primary); box-shadow: 0 0 0 2px var(--dw-primary-glow); }
    .day-cell.selected { background: color-mix(in srgb, var(--dw-primary) 14%, var(--dw-surface-elevated)); border-color: var(--dw-primary); }
    .day-cell.cdk-drop-list-dragging { border-style: dashed; }
    .day-cell.has-outfits .day-number { font-weight: 700; }
    .day-number { font-size: 13px; }
    .day-preview { display: flex; align-items: center; gap: 4px; }
    .preview-item { display: inline-flex; border-radius: 50%; cursor: grab; }
    .preview-item:active { cursor: grabbing; }
    .day-preview img { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.7); }
    .preview-item.cdk-drag-preview { box-shadow: var(--dw-shadow-md); transform: scale(1.08); }
    .preview-item.cdk-drag-placeholder { opacity: 0.3; }
    .more { font-size: 11px; color: var(--dw-text-secondary); }
    .day-popover {
      position: absolute;
      width: 250px;
      max-height: 320px;
      overflow: auto;
      border-radius: 14px;
      padding: 10px;
      z-index: 5;
      border: 1px solid rgba(140, 123, 112, 0.18);
      box-shadow: var(--dw-shadow-lg);
    }
    .popover-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .popover-header h4 { margin: 0; font-size: 0.9rem; }
    .popover-add-btn {
      min-height: 36px;
      border-radius: 10px;
      border: 1px solid rgba(140,123,112,0.18);
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .popover-add-btn:disabled {
      background: color-mix(in srgb, var(--dw-surface-card) 82%, #888 18%);
      color: color-mix(in srgb, var(--dw-text-secondary) 78%, #666 22%);
      border-color: rgba(140,123,112,0.12);
      cursor: not-allowed;
      box-shadow: none;
      opacity: 0.72;
    }
    .popover-actions { display: grid; gap: 8px; }
    .popover-subtitle {
      font-size: 12px;
      color: var(--dw-text-secondary);
      margin: 0 0 8px;
    }
    .popover-existing-list {
      display: grid;
      gap: 8px;
      max-height: 140px;
      overflow-y: auto;
      padding-right: 2px;
      margin-bottom: 8px;
    }
    .popover-picker-header { margin-bottom: 8px; }
    .picker-back-btn {
      border: 1px solid rgba(140,123,112,0.2);
      border-radius: 10px;
      min-height: 34px;
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0 10px;
    }
    .popover-search {
      width: 100%;
      height: 36px;
      border-radius: 10px;
      border: 1px solid rgba(140,123,112,0.2);
      background: var(--dw-surface-card);
      color: var(--dw-text-primary);
      padding: 0 10px;
      margin-bottom: 8px;
      outline: none;
    }
    .popover-add-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .popover-list {
      display: grid;
      gap: 8px;
      max-height: 140px;
      overflow-y: auto;
      padding-right: 2px;
    }
    .popover-item { text-decoration: none; color: inherit; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(140,123,112,0.14); border-radius: 10px; padding: 6px; background: var(--dw-surface-card); width: 100%; text-align: left; }
    .popover-item.existing { text-decoration: none; }
    .popover-item img { width: 42px; height: 42px; border-radius: 8px; object-fit: cover; }
    .popover-item span { font-size: 12px; color: var(--dw-text-primary); }
    .popover-item-pill {
      margin-left: auto;
      font-size: 11px;
      border-radius: 999px;
      border: 1px solid rgba(140,123,112,0.25);
      padding: 2px 8px;
      color: var(--dw-text-secondary);
    }
    .popover-item-pill.add {
      border-color: color-mix(in srgb, var(--dw-primary) 40%, transparent);
      color: var(--dw-primary);
    }
    .popover-empty {
      min-height: 62px;
      border: 1px dashed rgba(140,123,112,0.2);
      border-radius: 10px;
      color: var(--dw-text-secondary);
      display: grid;
      place-items: center;
      font-size: 12px;
      text-align: center;
      padding: 8px;
    }
    @media (max-width: 768px) {
      .calendar-page { padding: var(--dw-spacing-md); }
      .page-header { flex-direction: column; }
      .day-cell { min-height: 72px; padding: 6px; }
      .day-preview img { width: 16px; height: 16px; }
    }
  `],
})
export class CalendarComponent implements OnInit {
  private wardrobeService = inject(WardrobeService);
  private bottomSheet = inject(MatBottomSheet);

  outfitList = this.wardrobeService.outfitList;
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  fallbackImage = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&h=500&fit=crop';

  private monthCursor = signal(this.startOfMonth(new Date()));
  isMobile = signal(window.innerWidth <= 768);
  selectedDate = signal(this.toISODate(new Date()));
  dayPopover = signal<DayPopoverState | null>(null);
  showExistingPicker = signal(false);
  existingSearchQuery = signal('');
  calendarLoadError = signal<string | null>(null);

  monthLabel = computed(() => this.monthCursor().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));

  days = computed<CalendarDay[]>(() => {
    const monthStart = this.monthCursor();
    const start = new Date(monthStart);
    start.setDate(1 - monthStart.getDay());
    const todayIso = this.toISODate(new Date());
    const currentMonth = monthStart.getMonth();

    const days: CalendarDay[] = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const isoDate = this.toISODate(date);
      days.push({
        isoDate,
        day: date.getDate(),
        inCurrentMonth: date.getMonth() === currentMonth,
        isToday: isoDate === todayIso,
        outfits: this.wardrobeService.getOutfitsByDate(isoDate),
      });
    }
    return days;
  });

  filteredExistingOutfits = computed(() => {
    const query = this.existingSearchQuery().trim().toLowerCase();
    if (!query) {
      return this.outfitList();
    }
    return this.outfitList().filter(outfit =>
      outfit.name.toLowerCase().includes(query) ||
      (outfit.occasion ?? '').toLowerCase().includes(query) ||
      (outfit.season ?? '').toLowerCase().includes(query)
    );
  });

  popoverOutfitsForDate = computed(() => {
    const popover = this.dayPopover();
    if (!popover) {
      return [];
    }
    return this.wardrobeService.getOutfitsByDate(popover.isoDate);
  });
  addablePopoverOutfitsCount = computed(() => {
    const popover = this.dayPopover();
    if (!popover) {
      return 0;
    }
    return this.outfitList().filter(outfit => !this.isScheduledOnDate(outfit, popover.isoDate)).length;
  });

  ngOnInit(): void {
    void this.loadCalendarData();
  }

  changeMonth(step: number): void {
    const next = new Date(this.monthCursor());
    next.setMonth(next.getMonth() + step);
    this.monthCursor.set(this.startOfMonth(next));
  }

  selectDate(day: CalendarDay, event: MouseEvent): void {
    this.selectedDate.set(day.isoDate);
    const outfits = day.outfits;
    if (this.isMobileView()) {
      this.bottomSheet.open(DayOutfitsSheetComponent, {
        data: {
          isoDate: day.isoDate,
          dateLabel: this.formatDateLabel(day.isoDate),
          outfitsForDate: outfits,
          allOutfits: this.outfitList(),
          fallbackImage: this.fallbackImage,
        } as DaySheetData,
        panelClass: 'dw-mobile-profile-sheet',
        backdropClass: 'dw-mobile-sheet-backdrop',
      });
      return;
    }

    if (!this.isMobileView()) {
      const anchor = event.currentTarget as HTMLElement | null;
      if (!anchor) {
        return;
      }
      const calendarRoot = anchor.closest('.calendar-shell') as HTMLElement | null;
      if (!calendarRoot) {
        return;
      }
      const anchorRect = anchor.getBoundingClientRect();
      const rootRect = calendarRoot.getBoundingClientRect();
      const popoverWidth = 250;
      let left = anchorRect.right - rootRect.left + 8;
      if (left + popoverWidth > rootRect.width - 8) {
        left = anchorRect.left - rootRect.left - popoverWidth - 8;
      }
      if (left < 8) {
        left = 8;
      }
      const top = Math.max(10, anchorRect.top - rootRect.top);
      this.dayPopover.set({
        isoDate: day.isoDate,
        dateLabel: this.formatDateLabel(day.isoDate),
        left,
        top,
      });
      this.showExistingPicker.set(false);
      this.existingSearchQuery.set('');
      return;
    }

    this.dayPopover.set(null);
  }

  onDrop(event: CdkDragDrop<string>): void {
    const targetDate = event.container.data;
    const payload = event.item.data as { outfitId?: string; fromDate?: string } | undefined;
    const outfitId = payload?.outfitId;
    const fromDate = payload?.fromDate;
    if (!outfitId || !fromDate || !targetDate || fromDate === targetDate) {
      return;
    }

    const outfit = this.wardrobeService.getOutfitById(outfitId);
    if (!outfit) {
      return;
    }

    const plannedDates = new Set(outfit.plannedDates ?? []);
    plannedDates.delete(fromDate);
    plannedDates.add(targetDate);
    this.wardrobeService.updateOutfit(outfit.id, { plannedDates: [...plannedDates] });
    const popover = this.dayPopover();
    if (popover) {
      const refreshed = this.wardrobeService.getOutfitsByDate(popover.isoDate);
      if (refreshed.length === 0) {
        this.dayPopover.set(null);
      }
    }
  }

  closePopover(): void {
    this.dayPopover.set(null);
    this.showExistingPicker.set(false);
    this.existingSearchQuery.set('');
  }

  openExistingPicker(): void {
    if (this.addablePopoverOutfitsCount() === 0) {
      return;
    }
    this.showExistingPicker.set(true);
  }

  closeExistingPicker(): void {
    this.showExistingPicker.set(false);
    this.existingSearchQuery.set('');
  }

  isScheduledOnDate(outfit: Outfit, isoDate: string): boolean {
    return (outfit.plannedDates ?? []).includes(isoDate);
  }

  async addOutfitToDate(outfitId: string, isoDate: string): Promise<void> {
    const outfit = this.wardrobeService.getOutfitById(outfitId);
    if (!outfit || this.isScheduledOnDate(outfit, isoDate)) {
      return;
    }
    const plannedDates = new Set(outfit.plannedDates ?? []);
    plannedDates.add(isoDate);
    await this.wardrobeService.updateOutfit(outfit.id, { plannedDates: [...plannedDates].sort() });
  }

  private async loadCalendarData(): Promise<void> {
    this.calendarLoadError.set(null);
    try {
      await this.wardrobeService.ensureOutfitsLoaded();
    } catch {
      this.calendarLoadError.set('Unable to load calendar outfits. Please refresh and try again.');
    }
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toISODate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDateLabel(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  private isMobileView(): boolean {
    const mobile = window.innerWidth <= 768;
    this.isMobile.set(mobile);
    if (mobile) {
      this.dayPopover.set(null);
      this.showExistingPicker.set(false);
      this.existingSearchQuery.set('');
    }
    return mobile;
  }
}
