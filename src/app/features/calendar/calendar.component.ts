import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
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
  dateLabel: string;
  outfits: Outfit[];
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
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="day-sheet">
      <div class="sheet-handle"></div>
      <h3>{{ data.dateLabel }}</h3>
      <div class="sheet-list">
        @for (outfit of data.outfits; track outfit.id) {
          <button class="sheet-card" type="button" (click)="openOutfit(outfit.id)">
            <img [src]="outfit.imageUrl || data.fallbackImage" [alt]="outfit.name" />
            <div class="sheet-card-info">
              <strong>{{ outfit.name }}</strong>
              <span>{{ outfit.occasion || 'General' }}</span>
            </div>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .day-sheet { padding: 10px 12px calc(14px + var(--dw-safe-bottom)); }
    .sheet-handle { width: 40px; height: 4px; border-radius: 999px; background: var(--dw-text-muted); opacity: 0.5; margin: 0 auto 12px; }
    h3 { margin: 0 0 10px; font-size: 1rem; color: var(--dw-text-primary); }
    .sheet-list { display: grid; gap: 8px; }
    .sheet-card { width: 100%; border: 1px solid rgba(140,123,112,0.18); border-radius: 14px; padding: 8px; background: var(--dw-surface-card); display: flex; align-items: center; gap: 10px; text-align: left; }
    .sheet-card img { width: 52px; height: 52px; border-radius: 10px; object-fit: cover; }
    .sheet-card-info { display: grid; gap: 2px; }
    .sheet-card-info span { font-size: 12px; color: var(--dw-text-secondary); }
  `],
})
export class DayOutfitsSheetComponent {
  private bottomSheetRef = inject(MatBottomSheetRef<DayOutfitsSheetComponent>);
  private router = inject(Router);
  data = inject<DaySheetData>(MAT_BOTTOM_SHEET_DATA);

  openOutfit(outfitId: string): void {
    this.bottomSheetRef.dismiss();
    this.router.navigate(['/outfits', outfitId]);
  }
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'dw-calendar',
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatTooltipModule, MatBottomSheetModule, DragDropModule],
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
            <div class="popover-list">
              @for (outfit of popoverOutfits(); track outfit.id) {
                <a class="popover-item" [routerLink]="['/outfits', outfit.id]" (click)="closePopover()">
                  <img [src]="outfit.imageUrl || fallbackImage" [alt]="outfit.name" />
                  <span>{{ outfit.name }}</span>
                </a>
              }
            </div>
          </div>
        }
      </section>

      <section class="day-panel glass">
        <div class="panel-header">
          <h3>{{ selectedDateLabel() }}</h3>
          <button mat-stroked-button routerLink="/outfit-canvas">
            <mat-icon>edit_calendar</mat-icon>
            Plan Day
          </button>
        </div>

        @if (selectedOutfits().length > 0) {
          <div class="scheduled-grid">
            @for (outfit of selectedOutfits(); track outfit.id) {
              <a class="scheduled-card" [routerLink]="['/outfits', outfit.id]">
                <img [src]="outfit.imageUrl || fallbackImage" [alt]="outfit.name" />
                <div class="card-info">
                  <strong>{{ outfit.name }}</strong>
                  <span>{{ outfit.occasion || 'General' }}</span>
                </div>
              </a>
            }
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>event_available</mat-icon>
            <p>No outfits scheduled for this date.</p>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .calendar-page { padding: var(--dw-spacing-xl); max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: var(--dw-spacing-lg); }
    .subtitle { margin: 0; color: var(--dw-text-secondary); }
    .action-btn { display: inline-flex; align-items: center; gap: 8px; border: none; border-radius: var(--dw-radius-md); padding: 10px 16px; color: #fff; background: var(--dw-gradient-primary); }
    .calendar-shell { padding: var(--dw-spacing-md); border-radius: var(--dw-radius-xl); margin-bottom: var(--dw-spacing-lg); }
    .calendar-shell { position: relative; }
    .calendar-click-layer {
      position: absolute;
      inset: 0;
      z-index: 4;
      pointer-events: none;
      background: transparent;
    }
    .calendar-click-layer.active { pointer-events: auto; }
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
    .popover-list { display: grid; gap: 8px; }
    .popover-item { text-decoration: none; color: inherit; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(140,123,112,0.14); border-radius: 10px; padding: 6px; background: var(--dw-surface-card); }
    .popover-item img { width: 42px; height: 42px; border-radius: 8px; object-fit: cover; }
    .popover-item span { font-size: 12px; color: var(--dw-text-primary); }
    .day-panel { padding: var(--dw-spacing-md); border-radius: var(--dw-radius-xl); }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--dw-spacing-md); }
    .panel-header h3 { margin: 0; font-size: 1rem; }
    .scheduled-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; }
    .scheduled-card { text-decoration: none; color: inherit; border: 1px solid rgba(140, 123, 112, 0.12); border-radius: 14px; overflow: hidden; background: var(--dw-surface-card); }
    .scheduled-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
    .card-info { padding: 10px; display: grid; gap: 2px; }
    .card-info span { color: var(--dw-text-secondary); font-size: 12px; }
    .empty-state { min-height: 120px; display: grid; place-items: center; color: var(--dw-text-secondary); text-align: center; }
    .empty-state mat-icon { font-size: 30px; width: 30px; height: 30px; margin-bottom: 6px; }
    @media (max-width: 768px) {
      .calendar-page { padding: var(--dw-spacing-md); }
      .page-header { flex-direction: column; }
      .day-cell { min-height: 72px; padding: 6px; }
      .day-preview img { width: 16px; height: 16px; }
      .panel-header { flex-direction: column; align-items: flex-start; gap: 8px; }
      .day-panel { display: block; }
    }
    @media (min-width: 769px) {
      .day-panel { display: none; }
    }
  `],
})
export class CalendarComponent {
  private wardrobeService = inject(WardrobeService);
  private bottomSheet = inject(MatBottomSheet);

  outfitList = this.wardrobeService.outfitList;
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  fallbackImage = 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=500&h=500&fit=crop';

  private monthCursor = signal(this.startOfMonth(new Date()));
  isMobile = signal(window.innerWidth <= 768);
  selectedDate = signal(this.toISODate(new Date()));
  dayPopover = signal<DayPopoverState | null>(null);

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

  selectedOutfits = computed(() => this.wardrobeService.getOutfitsByDate(this.selectedDate()));
  popoverOutfits = computed(() => {
    const popover = this.dayPopover();
    if (!popover) {
      return [];
    }
    return this.wardrobeService.getOutfitsByDate(popover.isoDate);
  });

  selectedDateLabel = computed(() => {
    const [year, month, day] = this.selectedDate().split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  });

  changeMonth(step: number): void {
    const next = new Date(this.monthCursor());
    next.setMonth(next.getMonth() + step);
    this.monthCursor.set(this.startOfMonth(next));
  }

  selectDate(day: CalendarDay, event: MouseEvent): void {
    this.selectedDate.set(day.isoDate);
    const outfits = day.outfits;
    if (this.isMobileView() && outfits.length > 0) {
      this.bottomSheet.open(DayOutfitsSheetComponent, {
        data: {
          dateLabel: this.formatDateLabel(day.isoDate),
          outfits,
          fallbackImage: this.fallbackImage,
        } as DaySheetData,
        panelClass: 'dw-mobile-profile-sheet',
        backdropClass: 'dw-mobile-sheet-backdrop',
      });
      return;
    }

    if (!this.isMobileView() && outfits.length > 0) {
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
    }
    return mobile;
  }
}
