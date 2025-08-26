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
import { DEFAULT_MONTH_EVENT_HEIGHT, SHOW_DATE_ON_DAY } from '../../defaults';
import {
  IMHCalendarViewType,
  MHCalendarReducerStoreActions,
} from '../../store/store/mh-calendar-store.types';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { EventManager } from '../../utils/EventManager';
import { DateUtils } from '../../utils/DateUtils';
import { EventStyleManager } from '../../utils/EventStyleManager';

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
  @State() isDraggedOver: number | null = null;
  @State() isDayHovered: boolean = false;
  @State() entered: boolean = false;

  @Element() el?: HTMLElement;

  // Performance optimization properties
  private targetElement: HTMLElement | null = null;
  private targetRect: DOMRect | null = null;
  private lastProcessedTime: number = 0;
  private readonly THROTTLE_MS = 16; // ~60fps
  private intervalId?: number;
  private storeUnsubscribers: (() => void)[] = [];
  private isOverTarget: boolean = false;
  private draggedOverOffsetY: number | null = null;

  // Consolidated drag processing logic
  private processDragPosition = (clientY: number): void => {
    const target = this.getTargetElement();
    if (!target) return;

    const newRect = target.getBoundingClientRect();
    const touchOffsetY = clientY - newRect.top;
    // Early return if position hasn't changed significantly
    if (
      this.draggedOverOffsetY !== null &&
      Math.abs(touchOffsetY - this.draggedOverOffsetY) < 2
    ) {
      return;
    }

    if (!this.calendarDayElementHeight) {
      throw new Error('Init error');
    }

    const calcBlockPosition = DayUtils.getDragEventTopPosition(
      touchOffsetY,
      this.calendarDayElementHeight
    );
    // Only update if position actually changed
    if (this.isDraggedOver !== calcBlockPosition) {
      this.draggedOverOffsetY = touchOffsetY;
      this.isDraggedOver = calcBlockPosition;
    }
  };

  private dispatchDropEvent = (clientY: number): void => {
    const target = this.getTargetElement();
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const dropOffsetY = clientY - rect.top;

    if (!this.calendarDayElementHeight) {
      throw new Error('Init error');
    }

    const dropTopPosition = DayUtils.getDragEventTopPosition(
      dropOffsetY,
      this.calendarDayElementHeight
    );
    newMhCalendarStore.dispatch({
      type: MHCalendarReducerStoreActions.EVENT_DROP,
      payload: {
        topPosition: dropTopPosition,
        date: this.day,
      },
    });

    this.resetDragState();
  };

  private resetDragState = (): void => {
    this.isDraggedOver = null;
    this.draggedOverOffsetY = null;
    this.isOverTarget = false;
    this.entered = false;
  };

  // Helper methods
  private getTargetElement(): HTMLElement | null {
    if (!this.targetElement) {
      this.targetElement = this.el?.querySelector(
        '.mhCalendarDay'
      ) as HTMLElement;
    }
    return this.targetElement;
  }

  private updateTargetRect(): DOMRect | null {
    const target = this.getTargetElement();
    if (target) {
      this.targetRect = target.getBoundingClientRect();
    }
    return this.targetRect;
  }

  private isPointInside(
    clientX: number,
    clientY: number,
    rect: DOMRect
  ): boolean {
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  // Touch event handlers
  @Listen('touchmove', { target: 'window' })
  handleTouchMove(e: TouchEvent): void {
    const now = performance.now();
    if (now - this.lastProcessedTime < this.THROTTLE_MS) {
      return;
    }
    this.lastProcessedTime = now;

    if (!this.el) return;

    const touch = e.touches[0];
    if (!touch) return;

    const rect = this.targetRect || this.updateTargetRect();
    if (!rect) return;

    const isInside = this.isPointInside(touch.clientX, touch.clientY, rect);

    if (isInside) {
      this.isOverTarget = true;
      this.entered = true;
      this.processDragPosition(touch.clientY);
    } else if (!isInside && this.isOverTarget) {
      this.resetDragState();
    }
  }

  @Listen('touchend', { target: 'window' })
  handleTouchEnd(e: TouchEvent): void {
    if (!this.el || !this.isOverTarget) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    try {
      this.dispatchDropEvent(touch.clientY);
    } catch (error) {
      console.error('Error handling touch end:', error);
      this.resetDragState();
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
      this.targetRect = null; // Invalidate cached rect
    }
  }

  componentWillLoad(): void {
    this.calendarDayElementHeight = 600; // Default fallback

    if (this.day) {
      this.isToday = DateUtils.isToday(this.day);
      this.getGroupedEvents();
    }
  }

  componentDidLoad(): void {
    this.calendarDayElementHeight = this.el?.offsetHeight || 600;
    newMhCalendarStore.state.heightOfCalendarDay = this.el?.offsetHeight || 600;
    this.updateCurrentTimePosition();
    this.setupStoreSubscriptions();
    this.startTimeInterval();
  }

  componentDidUpdate(): void {
    const newHeight = this.el?.offsetHeight || 600;
    if (newHeight !== this.calendarDayElementHeight) {
      this.calendarDayElementHeight = newHeight;
      this.updateCurrentTimePosition();
      this.targetRect = null; // Invalidate cached rect
      newMhCalendarStore.state.heightOfCalendarDay =
        this.el?.offsetHeight || 600;
    }
  }

  private setupStoreSubscriptions(): void {
    newMhCalendarStore.onChange('calendarDateRange', () => {
      this.getGroupedEvents();
    });

    newMhCalendarStore.onChange('reactiveEvents', () => {
      this.getGroupedEvents();
    });

    newMhCalendarStore.onChange('viewType', () => {
      this.getGroupedEvents();
      this.updateCurrentTimePosition();
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

  private onDayClick = (event: MouseEvent, isContext = false): void => {
    if (!this.el || !this.day) return;

    event.preventDefault();
    event.stopPropagation();

    const exactDateUserClicked = DateUtils.getExactDateBasedOnUserPosition(
      event.clientY - this.el.getBoundingClientRect().top,
      this.day
    );

    if (
      !isContext &&
      typeof newMhCalendarStore.state.onDayClick === 'function'
    ) {
      newMhCalendarStore.state.onDayClick(exactDateUserClicked);
    }
    if (
      isContext &&
      typeof newMhCalendarStore.state.onRightDayClick === 'function'
    ) {
      newMhCalendarStore.state.onRightDayClick(exactDateUserClicked);
    }
  };

  disconnectedCallback(): void {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }

    this.storeUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.storeUnsubscribers = [];

    this.targetElement = null;
    this.targetRect = null;
  }

  // Styling methods
  private getEventHolderStyle(
    eventTopPosition: number,
    positionStyle: any
  ): any {
    if (!newMhCalendarStore.state.viewType) return;

    const isTimeView = [
      IMHCalendarViewType.DAY,
      IMHCalendarViewType.WEEK,
    ].includes(newMhCalendarStore.state.viewType);

    if (isTimeView) {
      return {
        overflow: 'hidden',
        position: 'absolute',
        left: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        top: `${eventTopPosition}px`,
        ...positionStyle,
      };
    }

    return {
      height: `${DEFAULT_MONTH_EVENT_HEIGHT}px`,
      width: '100%',
    };
  }

  private getStylesForDraggedEvent(): any {
    if (!newMhCalendarStore.state.viewType) return;

    const isTimeView = [
      IMHCalendarViewType.DAY,
      IMHCalendarViewType.WEEK,
    ].includes(newMhCalendarStore.state.viewType);

    if (isTimeView) {
      return {
        width: '100%',
        position: 'absolute',
        top: `${this.isDraggedOver}px`,
      };
    }

    return {
      height: '40px',
      width: '100%',
    };
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
          this.processDragPosition(e.clientY);
        }}
        onDragLeave={() => {
          this.resetDragState();
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
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarDay'),
        }}
      >
        {!this.showCurrentDate && newMhCalendarStore.state.showAllDayTasks && (
          <div
            class="mhCalendarDay_allDaysEventHolder"
            style={{
              position: newMhCalendarStore.state.makeAllDaysSticky
                ? 'sticky'
                : 'absolute',
              height: newMhCalendarStore.state.allDayEventsHeight + 'px',
              ...newMhCalendarStore.getInlineStyleForClass(
                'mhCalendarDay_allDaysEventHolder'
              ),
            }}
          >
            {this.allDayEvents.map((event) => (
              <mh-calendar-event event={event} />
            ))}
          </div>
        )}

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

        {this.isToday && isTimeView && (
          <div
            class="mhCalendarDay__currentTime"
            style={{
              ...this.currentTimePosition,
              ...newMhCalendarStore.getInlineStyleForClass(
                'mhCalendarDay__currentTime'
              ),
            }}
          />
        )}

        {this.isDraggedOver && newMhCalendarStore.state.draggedEvent && (
          <div
            class="mhCalendarDay__eventHolder"
            style={{
              ...this.getStylesForDraggedEvent(),
              ...newMhCalendarStore.getInlineStyleForClass(
                'mhCalendarDay__eventHolder'
              ),
            }}
          >
            <mh-calendar-event
              event={newMhCalendarStore.state.draggedEvent}
              dayHeight={this.calendarDayElementHeight}
              eventTopPosition={this.isDraggedOver}
              dayOfRendering={this.day}
              isDragged={true}
            />
          </div>
        )}

        {Array.from(this.groupedEvents.entries()).map(([_, events]) =>
          events
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
            .slice(0, 5)
            .map((event, index) => {
              if (!this.calendarDayElementHeight || !this.day) return;

              const instanceId = `${event.id}-${index}`;
              const eventTopPosition =
                EventStyleManager.calculateEventTopPosition(
                  event.startDate,
                  event.allDay ?? false,
                  this.calendarDayElementHeight,
                  this.day
                );
              const positionStyle = EventStyleManager.calculateEventWidth(
                events,
                index
              );

              return (
                <div
                  key={instanceId}
                  data-instance={instanceId}
                  class="mhCalendarDay__eventHolder"
                  style={{
                    ...this.getEventHolderStyle(
                      eventTopPosition,
                      positionStyle
                    ),
                    ...newMhCalendarStore.getInlineStyleForClass(
                      'mhCalendarDay__eventHolder'
                    ),
                  }}
                >
                  {index < 4 ? (
                    <mh-calendar-event
                      event={event}
                      dayHeight={this.calendarDayElementHeight}
                      eventTopPosition={eventTopPosition}
                      dayOfRendering={this.day}
                    />
                  ) : (
                    <div
                      class="mhCalendarDay__eventsLeftIndicator"
                      style={{
                        ...newMhCalendarStore.getInlineStyleForClass(
                          'mhCalendarDay__eventsLeftIndicator'
                        ),
                      }}
                    >
                      {`${events.length - index} events left`}
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>
    );
  }
}
