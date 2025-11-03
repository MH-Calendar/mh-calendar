import { DateUtils } from './DateUtils';
import { EventModalHelper } from './EventModalHelper';
import newMhCalendarStore from '../store/store/mh-calendar-store';
import { IMHCalendarViewType } from '../store/store/mh-calendar-store.types';
import { MHCalendarEvents } from '../types';
import { EventManager } from './EventManager';

export class DayClickHandler {
  static handleDayClick(
    event: MouseEvent,
    el: HTMLElement | null,
    day: Date | undefined,
    isContext: boolean = false
  ): void {
    if (!el || !day) return;

    // Prevent opening modal if click is from resize handler or event element
    const target = event.target as HTMLElement;
    if (
      target.closest('.mhCalendarResizeEventHandler') ||
      target.closest('.mhCalendarEvent')
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const exactDateUserClicked = DateUtils.getExactDateBasedOnUserPosition(
      event.clientY - el.getBoundingClientRect().top,
      day
    );

    // Handle event creation if createEventOnClick is enabled
    if (
      !isContext &&
      newMhCalendarStore.state.createEventOnClick &&
      typeof newMhCalendarStore.state.onEventCreated === 'function'
    ) {
      const viewType = newMhCalendarStore.state.viewType;
      const isTimeView =
        viewType &&
        [IMHCalendarViewType.DAY, IMHCalendarViewType.WEEK].includes(viewType);

      let newEvent: MHCalendarEvents;

      if (isTimeView) {
        // For WEEK/DAY view: round down to hour and create 1-hour event
        // e.g., click at 15:30 -> create event 15:00-16:00
        // Dates are already in main timezone from getExactDateBasedOnUserPosition
        const clickedHour = exactDateUserClicked.getHours();
        const startDate = new Date(exactDateUserClicked);
        startDate.setHours(clickedHour, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(clickedHour + 1, 0, 0, 0);

        newEvent = {
          id: EventManager.generateEventId(),
          startDate,
          endDate,
          title: 'New Event',
          allDay: false,
        };
      } else {
        // For MONTH view: create all-day event
        const startDate = new Date(day);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(day);
        endDate.setHours(23, 59, 59, 999);

        newEvent = {
          id: EventManager.generateEventId(),
          startDate,
          endDate,
          title: 'New Event',
          allDay: true,
        };
      }

      // Open modal for event creation
      const clickTarget = event.target as HTMLElement;
      const rect = clickTarget.getBoundingClientRect();

      const modalContent = EventModalHelper.createEventModalContent(
        newEvent,
        true, // isNewEvent
        (updatedEvent) => {
          // Save event via callback
          if (typeof newMhCalendarStore.state.onEventCreated === 'function') {
            newMhCalendarStore.state.onEventCreated(updatedEvent);
          }
        },
        () => {
          // Cancel - do nothing, event was not created
        }
      );

      newMhCalendarStore.openModal(modalContent, {
        rect,
        alignment: 'center',
      });
    }

    // Call original onDayClick callback if provided
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
  }
}
