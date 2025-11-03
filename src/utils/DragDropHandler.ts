import { DayUtils, BusinessHoursUtils } from '../components/mh-calendar-day/mh-calendar-day.utils';
import { DateUtils } from './DateUtils';
import newMhCalendarStore from '../store/store/mh-calendar-store';
import { MHCalendarReducerStoreActions } from '../store/store/mh-calendar-store.types';

export interface DragDropState {
  isDraggedOver: number | null;
  isDraggedOverAllDay: boolean;
  isDraggedOverBlocked: boolean;
  draggedOverOffsetY: number | null;
  isOverTarget: boolean;
  entered: boolean;
}

export class DragDropHandler {
  private day: Date | undefined;
  private calendarDayElementHeight: number | undefined;
  private targetElement: HTMLElement | null = null;
  private targetRect: DOMRect | null = null;
  private lastProcessedTime: number = 0;
  private readonly THROTTLE_MS = 16; // ~60fps

  constructor(day: Date | undefined, calendarDayElementHeight: number | undefined) {
    this.day = day;
    this.calendarDayElementHeight = calendarDayElementHeight;
  }

  updateDay(day: Date | undefined): void {
    this.day = day;
    this.targetRect = null; // Invalidate cached rect
  }

  updateHeight(height: number | undefined): void {
    this.calendarDayElementHeight = height;
  }

  setTargetElement(element: HTMLElement | null): void {
    this.targetElement = element;
  }

  updateTargetRect(): DOMRect | null {
    if (this.targetElement) {
      this.targetRect = this.targetElement.getBoundingClientRect();
    }
    return this.targetRect;
  }

  isPointInside(clientX: number, clientY: number, rect: DOMRect): boolean {
    return (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    );
  }

  processDragPosition(clientY: number, state: DragDropState): DragDropState {
    const target = this.targetElement;
    if (!target) return state;

    const newRect = target.getBoundingClientRect();
    const touchOffsetY = clientY - newRect.top;
    
    // Early return if position hasn't changed significantly
    if (
      state.draggedOverOffsetY !== null &&
      Math.abs(touchOffsetY - state.draggedOverOffsetY) < 2
    ) {
      return state;
    }

    if (!this.calendarDayElementHeight) {
      throw new Error('Init error');
    }

    const calcBlockPosition = DayUtils.getDragEventTopPosition(
      touchOffsetY,
      this.calendarDayElementHeight
    );

    // Check if position is blocked by business hours
    let isBlocked = false;
    if (
      newMhCalendarStore.state.blockBusinessHours &&
      this.day &&
      newMhCalendarStore.state.draggedEvent
    ) {
      const startDate = DateUtils.getExactDateBasedOnUserPosition(
        calcBlockPosition,
        this.day
      );

      // Calculate event duration
      const draggedEvent = newMhCalendarStore.state.draggedEvent;
      const eventDurationInMinutes =
        (draggedEvent.endDate.getTime() - draggedEvent.startDate.getTime()) /
        (1000 * 60);
      const endDate = new Date(
        startDate.getTime() + eventDurationInMinutes * 60 * 1000
      );

      // Check if event fits within business hours
      const isWithinBusinessHours =
        BusinessHoursUtils.isEventWithinBusinessHours(
          startDate,
          endDate,
          newMhCalendarStore.state.businessHours
        );

      isBlocked = !isWithinBusinessHours;
    }

    // Only update if position actually changed
    if (
      state.isDraggedOver !== calcBlockPosition ||
      state.isDraggedOverBlocked !== isBlocked
    ) {
      return {
        ...state,
        draggedOverOffsetY: touchOffsetY,
        isDraggedOver: calcBlockPosition,
        isDraggedOverBlocked: isBlocked,
      };
    }

    return state;
  }

  dispatchDropEvent(clientY: number, el: HTMLElement | null, showCurrentDate: boolean): void {
    const target = this.targetElement;
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const dropOffsetY = clientY - rect.top;

    if (!this.calendarDayElementHeight) {
      throw new Error('Init error');
    }

    // Check if drop is in all day events holder
    const allDayHolder = el?.querySelector(
      '.mhCalendarDay_allDaysEventHolder'
    ) as HTMLElement;
    let isAllDay = false;

    if (
      allDayHolder &&
      newMhCalendarStore.state.showAllDayTasks &&
      !showCurrentDate
    ) {
      const allDayRect = allDayHolder.getBoundingClientRect();
      const allDayHeight = newMhCalendarStore.state.allDayEventsHeight || 0;

      // Check if drop position is within all day holder bounds
      if (
        clientY >= allDayRect.top &&
        clientY <= allDayRect.top + allDayHeight
      ) {
        isAllDay = true;
      }
    }

    const dropTopPosition = isAllDay
      ? 0
      : DayUtils.getDragEventTopPosition(
          dropOffsetY,
          this.calendarDayElementHeight
        );

    // Validate business hours if blockBusinessHours is enabled
    if (
      !isAllDay &&
      newMhCalendarStore.state.blockBusinessHours &&
      this.day &&
      newMhCalendarStore.state.draggedEvent
    ) {
      const startDate = DateUtils.getExactDateBasedOnUserPosition(
        dropTopPosition,
        this.day
      );

      // Calculate event duration
      const draggedEvent = newMhCalendarStore.state.draggedEvent;
      const eventDurationInMinutes =
        (draggedEvent.endDate.getTime() - draggedEvent.startDate.getTime()) /
        (1000 * 60);
      const endDate = new Date(
        startDate.getTime() + eventDurationInMinutes * 60 * 1000
      );

      // Check if event fits within business hours
      const isWithinBusinessHours =
        BusinessHoursUtils.isEventWithinBusinessHours(
          startDate,
          endDate,
          newMhCalendarStore.state.businessHours
        );

      if (!isWithinBusinessHours) {
        // Block the drop - don't dispatch EVENT_DROP
        return;
      }
    }

    newMhCalendarStore.dispatch({
      type: MHCalendarReducerStoreActions.EVENT_DROP,
      payload: {
        topPosition: dropTopPosition,
        date: this.day,
        isAllDay,
      },
    });
  }

  handleTouchMove(e: TouchEvent, state: DragDropState): DragDropState {
    const now = performance.now();
    if (now - this.lastProcessedTime < this.THROTTLE_MS) {
      return state;
    }
    this.lastProcessedTime = now;

    const touch = e.touches[0];
    if (!touch) return state;

    const rect = this.targetRect || this.updateTargetRect();
    if (!rect) return state;

    const isInside = this.isPointInside(touch.clientX, touch.clientY, rect);

    if (isInside) {
      const newState = {
        ...state,
        isOverTarget: true,
        entered: true,
      };
      return this.processDragPosition(touch.clientY, newState);
    } else if (!isInside && state.isOverTarget) {
      return this.resetDragState();
    }

    return state;
  }

  handleTouchEnd(e: TouchEvent, el: HTMLElement | null, showCurrentDate: boolean): void {
    const touch = e.changedTouches[0];
    if (!touch) return;

    try {
      this.dispatchDropEvent(touch.clientY, el, showCurrentDate);
    } catch (error) {
      console.error('Error handling touch end:', error);
    }
  }

  resetDragState(): DragDropState {
    return {
      isDraggedOver: null,
      isDraggedOverAllDay: false,
      draggedOverOffsetY: null,
      isOverTarget: false,
      entered: false,
      isDraggedOverBlocked: false,
    };
  }
}

