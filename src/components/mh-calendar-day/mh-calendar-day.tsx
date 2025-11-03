import {
  Component,
  Element,
  Listen,
  Prop,
  State,
  h,
  Watch,
} from '@stencil/core';
import dayjs from 'dayjs';
import { DayUtils } from './mh-calendar-day.utils';
import { MHCalendarEvents } from '../../types';
import { SHOW_DATE_ON_DAY } from '../../defaults';
import { IMHCalendarViewType } from '../../store/store/mh-calendar-store.types';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { EventManager } from '../../utils/EventManager';
import { DateUtils } from '../../utils/DateUtils';
import { DragDropHandler, DragDropState } from '../../utils/DragDropHandler';
import { MonthViewCalculator } from '../../utils/MonthViewCalculator';
import { DayClickHandler } from '../../utils/DayClickHandler';

@Component({
  tag: 'mh-calendar-day',
  styleUrl: 'mh-calendar-day.css',
  shadow: false,
})
export class MHCalendarDay {
  @Prop() day?: Date;
  @Prop() showCurrentDate: boolean = SHOW_DATE_ON_DAY;

  @State() calendarDayElementHeight?: number;
  @State() isToday: boolean = false;
  @State() currentTimePosition?: { top: string };
  @State() groupedEvents: Map<string, MHCalendarEvents[]> = new Map();
  @State() allDayEvents: MHCalendarEvents[] = [];
  @State() dragDropState: DragDropState = {
    isDraggedOver: null,
    isDraggedOverAllDay: false,
    isDraggedOverBlocked: false,
    draggedOverOffsetY: null,
    isOverTarget: false,
    entered: false,
  };
  @State() isDayHovered: boolean = false;
  @State() maxVisibleEventsInMonthView: number = 3; // Default: start with conservative value

  @Element() el?: HTMLElement;

  // Drag and drop handler instance
  private dragDropHandler!: DragDropHandler; // Initialized in componentWillLoad
  private intervalId?: number;
  private storeUnsubscribers: (() => void)[] = [];

  private processDragPosition = (clientY: number): void => {
    const newState = this.dragDropHandler.processDragPosition(
      clientY,
      this.dragDropState
    );
    if (newState !== this.dragDropState) {
      this.dragDropState = newState;
    }
  };

  private dispatchDropEvent = (clientY: number): void => {
    this.dragDropHandler.dispatchDropEvent(
      clientY,
      this.el || null,
      this.showCurrentDate
    );
    this.dragDropState = this.dragDropHandler.resetDragState();
  };

  private resetDragState = (): void => {
    this.dragDropState = this.dragDropHandler.resetDragState();
  };

  // Touch event handlers
  @Listen('touchmove', { target: 'window' })
  handleTouchMove(e: TouchEvent): void {
    if (!this.el) return;

    const newState = this.dragDropHandler.handleTouchMove(
      e,
      this.dragDropState
    );
    if (newState !== this.dragDropState) {
      this.dragDropState = newState;
    }
  }

  @Listen('touchend', { target: 'window' })
  handleTouchEnd(e: TouchEvent): void {
    if (!this.el || !this.dragDropState.isOverTarget) return;

    try {
      this.dragDropHandler.handleTouchEnd(e, this.el, this.showCurrentDate);
      this.dragDropState = this.dragDropHandler.resetDragState();
    } catch (error) {
      console.error('Error handling touch end:', error);
      this.dragDropState = this.dragDropHandler.resetDragState();
    }
  }

  // Component lifecycle and data management
  private getGroupedEvents(): void {
    if (!this.day) {
      throw new Error('Init error');
    }

    const eventsArray = EventManager.getEventsForDate(
      newMhCalendarStore.state.reactiveEvents,
      this.day
    );

    const groupedEvents = DayUtils.groupEvents(eventsArray);
    this.allDayEvents = groupedEvents.allDayEvents;
    this.groupedEvents = groupedEvents.dayEvents;
  }

  @Watch('day')
  dayChanged(newDay: Date): void {
    if (newDay) {
      this.isToday = DateUtils.isToday(newDay);
      this.getGroupedEvents();
      this.updateCurrentTimePosition();
      this.dragDropHandler.updateDay(newDay);
    }
  }

  componentWillLoad(): void {
    this.calendarDayElementHeight = 600; // Default fallback
    this.dragDropHandler = new DragDropHandler(
      this.day,
      this.calendarDayElementHeight
    );

    if (this.day) {
      this.isToday = DateUtils.isToday(this.day);
      this.getGroupedEvents();
    }
  }

  componentDidLoad(): void {
    this.calendarDayElementHeight = this.el?.offsetHeight || 600;
    newMhCalendarStore.state.heightOfCalendarDay = this.el?.offsetHeight || 600;
    this.dragDropHandler.updateHeight(this.calendarDayElementHeight);

    // Set target element for drag handler
    const targetElement = this.el?.querySelector(
      '.mhCalendarDay'
    ) as HTMLElement;
    this.dragDropHandler.setTargetElement(targetElement || null);

    this.updateCurrentTimePosition();
    this.calculateMaxVisibleEventsInMonthView();
    this.setupStoreSubscriptions();
    this.startTimeInterval();
  }

  componentDidUpdate(): void {
    const newHeight = this.el?.offsetHeight || 600;
    if (newHeight !== this.calendarDayElementHeight) {
      this.calendarDayElementHeight = newHeight;
      this.dragDropHandler.updateHeight(this.calendarDayElementHeight);
      this.updateCurrentTimePosition();
      this.calculateMaxVisibleEventsInMonthView();
      newMhCalendarStore.state.heightOfCalendarDay =
        this.el?.offsetHeight || 600;
    } else {
      // Recalculate even if height didn't change (view type might have changed)
      this.calculateMaxVisibleEventsInMonthView();
    }
  }

  private setupStoreSubscriptions(): void {
    newMhCalendarStore.onChange('calendarDateRange', () => {
      this.getGroupedEvents();
      this.calculateMaxVisibleEventsInMonthView();
    });

    newMhCalendarStore.onChange('reactiveEvents', () => {
      this.getGroupedEvents();
      // Recalculate max events when events change
      setTimeout(() => {
        this.calculateMaxVisibleEventsInMonthView();
      }, 50);
    });

    newMhCalendarStore.onChange('viewType', () => {
      this.getGroupedEvents();
      this.updateCurrentTimePosition();
      this.calculateMaxVisibleEventsInMonthView();
    });
  }

  private startTimeInterval(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      this.updateCurrentTimePosition();
    }, 60000); // 1 minute
  }

  private updateCurrentTimePosition(): void {
    if (
      this.calendarDayElementHeight &&
      this.isToday &&
      this.calendarDayElementHeight > 0
    ) {
      const currentTimePosition = DayUtils.calculateCurrentTimePosition(
        this.calendarDayElementHeight
      );
      this.currentTimePosition = currentTimePosition;
    }
  }

  /**
   * Calculates the maximum number of events that can fit in month view
   * based on available height in the day cell
   */
  private calculateMaxVisibleEventsInMonthView(): void {
    if (
      !this.el ||
      !newMhCalendarStore.state.viewType ||
      newMhCalendarStore.state.viewType !== IMHCalendarViewType.MONTH
    ) {
      return;
    }

    // Use setTimeout to ensure calculation happens after layout is complete
    setTimeout(() => {
      if (!this.el) return;
      this.maxVisibleEventsInMonthView =
        MonthViewCalculator.calculateMaxVisibleEvents(
          this.el,
          this.showCurrentDate
        );
    }, 0);
  }

  private onDayClick = (event: MouseEvent, isContext = false): void => {
    DayClickHandler.handleDayClick(event, this.el || null, this.day, isContext);
  };

  disconnectedCallback(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.storeUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.storeUnsubscribers = [];
  }

  render() {
    if (
      !newMhCalendarStore.state.viewType ||
      !this.day ||
      !this.calendarDayElementHeight
    )
      return;

    const dayOfMonth = dayjs(this.day).format('DD');
    const style = DayUtils.getDayStyles(this.day);
    const isTimeView = [
      IMHCalendarViewType.DAY,
      IMHCalendarViewType.WEEK,
    ].includes(newMhCalendarStore.state.viewType);

    return (
      <div
        class={`mhCalendarDay ${style.join(' ')} ${this.isDayHovered ? 'day__hovered' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          // If not dragging over all day holder, process normal drag
          if (!this.dragDropState.isDraggedOverAllDay) {
            this.processDragPosition(e.clientY);
            this.dragDropState = {
              ...this.dragDropState,
              isDraggedOverAllDay: false, // Clear all day preview if dragging elsewhere
            };
          }
        }}
        onDragLeave={() => {
          this.isDayHovered = false;
          // Don't reset if still dragging over all day holder
          if (!this.dragDropState.isDraggedOverAllDay) {
            this.resetDragState();
          }
        }}
        onMouseEnter={() => {
          this.isDayHovered = true;
        }}
        onMouseLeave={() => {
          this.isDayHovered = false;
        }}
        onDrop={(e) => {
          e.preventDefault();
          this.dispatchDropEvent(e.clientY);
        }}
        onClick={this.onDayClick}
        onContextMenu={(e) => this.onDayClick(e, true)}
        style={{
          overflowY: newMhCalendarStore.state.makeAllDaysSticky
            ? 'visible'
            : 'hidden',
          overflowX: 'hidden',
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarDay'),
        }}
      >
        <mh-calendar-day-all-day-events-holder
          showCurrentDate={this.showCurrentDate}
          allDayEvents={this.allDayEvents}
          dragDropState={this.dragDropState}
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            // Show preview when dragging over all day holder
            if (newMhCalendarStore.state.draggedEvent) {
              this.dragDropState = {
                ...this.dragDropState,
                isDraggedOverAllDay: true,
                isDraggedOver: null, // Clear timed event preview
              };
            }
          }}
          onDragLeave={(e: DragEvent) => {
            // Only reset if leaving the all day holder completely
            const relatedTarget = e.relatedTarget as HTMLElement;
            const allDayHolder = e.currentTarget as HTMLElement;
            if (!allDayHolder.contains(relatedTarget)) {
              this.dragDropState = {
                ...this.dragDropState,
                isDraggedOverAllDay: false,
              };
            }
          }}
          onDrop={(e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            this.dispatchDropEvent(e.clientY);
          }}
        />
        {this.showCurrentDate && (
          <span
            class="mhCalendarDay_dayDate"
            style={{
              ...newMhCalendarStore.getInlineStyleForClass(
                'mhCalendarDay_dayDate'
              ),
            }}
          >
            {dayOfMonth}
          </span>
        )}
        <mh-calendar-day-time-view-overlays
          day={this.day!}
          calendarDayElementHeight={this.calendarDayElementHeight!}
          isToday={this.isToday}
          currentTimePosition={this.currentTimePosition}
          isTimeView={isTimeView}
        />
        <mh-calendar-day-dragged-event-preview
          dragDropState={this.dragDropState}
          day={this.day}
          calendarDayElementHeight={this.calendarDayElementHeight}
          viewType={newMhCalendarStore.state.viewType}
        />
        {!isTimeView ? (
          <mh-calendar-day-month-view-events
            groupedEvents={this.groupedEvents}
            maxVisibleEventsInMonthView={this.maxVisibleEventsInMonthView}
            calendarDayElementHeight={this.calendarDayElementHeight}
            day={this.day}
          />
        ) : (
          <mh-calendar-day-time-view-events
            groupedEvents={this.groupedEvents}
            calendarDayElementHeight={this.calendarDayElementHeight}
            day={this.day}
          />
        )}
      </div>
    );
  }
}
