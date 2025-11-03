import dayjs from 'dayjs';
import { MINUTES_IN_HOUR } from '../../components/mh-calendar-day/mh-calendar-day.const';
import { DEFAULT_THEME } from '../../const/default-theme';
import { MHCalendarEvents } from '../../types';
import { ConfigValidator } from '../../utils/ConfigValidator';
import { DateUtils } from '../../utils/DateUtils';
import { EventManager } from '../../utils/EventManager';
import { BusinessHoursUtils } from '../../components/mh-calendar-day/mh-calendar-day.utils';
import { TimezoneUtils } from '../../utils/TimezoneUtils';
import newMhCalendarStore from './mh-calendar-store';
import {
  IMHCalendarState,
  IMHCalendarViewType,
} from './mh-calendar-store.types';
import { MHCalendarStoreUtils } from './mh-calendar-store.utils';

export class MHCalendarActions extends MHCalendarStoreUtils {
  protected setConfig(state: IMHCalendarState, payload: Record<string, any>) {
    const configValidator = new ConfigValidator(payload);
    if (!configValidator.validateConfig()) return state;

    const { properties, ...userJsCss } = payload.style;

    if (userJsCss) {
      state.style = this.mergeStyles(userJsCss);
    }

    const userPropsMergeWithDefaults = {
      ...DEFAULT_THEME.properties,
      ...(properties || {}),
    };
    state.properties = userPropsMergeWithDefaults;

    Object.entries(userPropsMergeWithDefaults).map(([key, val]: any) => {
      document.documentElement.style.setProperty(`--${key}`, val);
    });

    const { fromDate, toDate } = this.updateDateRangeForViewType(
      payload.viewType,
      payload.startDate || new Date()
    );

    state.calendarDateRange = {
      fromDate,
      toDate,
    };

    state.eventContent = payload.eventContent;
    state.viewType = payload.viewType;

    if (payload.events) {
      state.reactiveEvents = EventManager.mapEventsByDate(payload.events);
    }

    // Common with config
    state.showTimeFrom = payload.showTimeFrom;
    state.showTimeTo = payload.showTimeTo;
    state.showAllDayTasks = payload.showAllDayTasks;
    state.allDayEventsHeight = payload.allDayEventsHeight;
    state.fixedHeight = payload.fixedHeight;
    state.virtualScrollHeight = payload.virtualScrollHeight;
    state.showDateSwitcher = payload.showDateSwitcher;
    state.showViewTypeSwitcher = payload.showViewTypeSwitcher;
    state.showCalendarNavigation = payload.showCalendarNavigation;
    state.makeAllDaysSticky = payload.makeAllDaysSticky;
    state.allowEventDragging = payload.allowEventDragging;
    state.showViewHeader = payload.showViewHeader;
    state.hoursDisplayFormat = payload.hoursDisplayFormat;
    state.allowEventResize = payload.allowEventResize;
    state.minEventDuration = payload.minEventDuration;
    state.businessHours = payload.businessHours;
    state.hiddenDays = payload.hiddenDays;
    state.blockBusinessHours = payload.blockBusinessHours;

    if (payload.slotInterval) {
      state.slotInterval = payload.slotInterval;
    }

    if (payload.hoursSlotInterval) {
      state.hoursSlotInterval = payload.hoursSlotInterval;
    }

    // Handle user actions assign
    state.onDayClick = payload.onDayClick;
    state.onEventClick = payload.onEventClick;
    state.onRightEventClick = payload.onRightEventClick;
    state.onRightDayClick = payload.onRightDayClick;
    state.onEventCreated = payload.onEventCreated;
    state.onEventUpdated = payload.onEventUpdated;
    state.createEventOnClick = payload.createEventOnClick;

    // Validate and set timezones (max 3)
    if (payload.timezones) {
      state.timezones = TimezoneUtils.validateTimezones(payload.timezones);
    }

    // Set timezone label
    if (payload.timezoneLabel !== undefined) {
      state.timezoneLabel = payload.timezoneLabel;
    }

    // Set event display mode
    if (payload.eventDisplayMode) {
      state.eventDisplayMode = payload.eventDisplayMode;
    }

    // if (true) {
    //   const link = document.createElement('link');
    //   link.rel = 'stylesheet';
    //   link.href = '/dist/themes/dark-theme.css'; // Updated path
    //   link.onload = () => console.log('CSS loaded successfully');
    //   link.onerror = () => console.log('CSS failed to load');
    //   document.head.appendChild(link);
    // }

    return { ...state };
  }

  protected setDraggedEvent(
    state: IMHCalendarState,
    payload: { event: MHCalendarEvents }
  ) {
    // const events = state.events ?? [];
    // for (let x = 0; x < events.length; x++) {
    //   const currentEvent = events[x];
    //   if (currentEvent.id === payload.event.id) {
    //     currentEvent.isHidden = true;
    //     break;
    //   }
    // }

    state.draggedEvent = payload.event;
    // state.events = events;

    //  for now
    if (payload) {
      return state;
    }
    return state;
  }

  protected showEvent(state: IMHCalendarState, payload: { eventID: string }) {
    // const events = state.events ?? [];

    // for (let x = 0; x < events.length; x++) {
    //   const currentEvent = events[x];
    //   if (currentEvent.id === payload.eventID) {
    //     currentEvent.isHidden = false;
    //     break;
    //   }
    // }

    if (payload) {
      return state;
    }

    return state;
  }

  protected changeView(
    state: IMHCalendarState,
    payload: { viewType: IMHCalendarViewType }
  ) {
    const newCalendarDateRange = this.updateDateRangeForViewType(
      payload.viewType,
      new Date()
    );
    Object.assign(state, {
      viewType: payload.viewType,
      calendarDateRange: newCalendarDateRange,
    });

    return state;
  }

  protected shiftDateRange(
    state: IMHCalendarState,
    payload: { amount: number }
  ) {
    if (!state.viewType || !state.calendarDateRange.fromDate) return state;

    const newCalendarDateRange = this.shiftCalendar(
      state.viewType,
      state.calendarDateRange.fromDate,
      payload.amount
    );

    state.calendarDateRange = newCalendarDateRange;

    return state;
  }

  protected setDateToToday(state: IMHCalendarState) {
    if (!state.viewType) return state;

    const newCalendarDateRange = this.updateDateRangeForViewType(
      state.viewType,
      new Date()
    );

    state.calendarDateRange = newCalendarDateRange;

    return state;
  }

  protected handleEventDrop(
    state: IMHCalendarState,
    payload: { topPosition: number; date: Date; isAllDay?: boolean }
  ) {
    const { topPosition, date, isAllDay } = payload;
    if (!state.draggedEvent) return state;

    if (
      newMhCalendarStore.state.viewType === IMHCalendarViewType.MONTH &&
      state.draggedEvent
    ) {
      const originalStart = state.draggedEvent.startDate;
      const originalEnd = state.draggedEvent.endDate;

      const newStartDate = new Date(date);
      newStartDate.setHours(
        originalStart.getHours(),
        originalStart.getMinutes(),
        originalStart.getSeconds(),
        originalStart.getMilliseconds()
      );

      const newEndDate = new Date(date);
      newEndDate.setHours(
        originalEnd.getHours(),
        originalEnd.getMinutes(),
        originalEnd.getSeconds(),
        originalEnd.getMilliseconds()
      );

      EventManager.handleEventDateChange(newStartDate, newEndDate);
      state.draggedEvent = null;
      return state;
    }

    // Handle all day event conversion
    if (isAllDay === true) {
      // Convert to all day event - set start to beginning of day, end to end of day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      // Update event with allDay flag
      const updatedEvent = {
        ...state.draggedEvent,
        allDay: true,
      };

      EventManager.handleEventDateChange(startDate, endDate, updatedEvent);
      state.draggedEvent = null;
      return state;
    }

    // Handle conversion from all day to timed event
    // If dragged event is all day but drop is NOT in all day holder
    if (!isAllDay && state.draggedEvent.allDay) {
      // Use the calendar's time range (showTimeFrom to showTimeTo)
      const startHour = state.showTimeFrom ?? 0;
      const endHour = state.showTimeTo ?? 24;

      const startDate = new Date(date);
      startDate.setHours(startHour, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(endHour, 0, 0, 0);

      // Update event without allDay flag (or set to false)
      const updatedEvent = {
        ...state.draggedEvent,
        allDay: false,
      };

      EventManager.handleEventDateChange(startDate, endDate, updatedEvent);
      state.draggedEvent = null;
      return state;
    }

    // Regular timed event drop (skip if already handled above)
    const startDate = DateUtils.getExactDateBasedOnUserPosition(
      topPosition,
      date
    );

    const eventDurationInMinutes = this.calculateEventDuration(
      state.draggedEvent
    );

    const endDate = new Date(
      startDate.getTime() + eventDurationInMinutes * MINUTES_IN_HOUR * 1000
    );

    // Validate business hours if blockBusinessHours is enabled
    if (state.blockBusinessHours && !isAllDay) {
      const isWithinBusinessHours =
        BusinessHoursUtils.isEventWithinBusinessHours(
          startDate,
          endDate,
          state.businessHours
        );

      if (!isWithinBusinessHours) {
        // Block the drop - return state without updating event
        state.draggedEvent = null;
        return state;
      }
    }

    // Ensure allDay is false for timed events
    const updatedEvent = {
      ...state.draggedEvent,
      allDay: false,
    };

    EventManager.handleEventDateChange(startDate, endDate, updatedEvent);
    state.draggedEvent = null;

    return state;
  }

  protected openModal(
    state: IMHCalendarState,
    payload: {
      content: any;
      position?: {
        x?: number;
        y?: number;
        element?: HTMLElement;
        alignment?: 'top' | 'bottom' | 'left' | 'right' | 'center';
      };
    }
  ): IMHCalendarState {
    state.modal = {
      isOpen: true,
      content: payload.content,
      position: payload.position,
    };
    return { ...state };
  }

  protected closeModal(state: IMHCalendarState): IMHCalendarState {
    state.modal = {
      isOpen: false,
      content: null,
      position: undefined,
    };
    return { ...state };
  }

  protected handleEventResize(
    state: IMHCalendarState,
    payload: {
      eventId: string;
      finalY: number;
    }
  ) {
    const { eventId } = payload;
    const event = newMhCalendarStore.getEventById(eventId);
    let endDate = DateUtils.getExactDateBasedOnUserPosition(
      payload.finalY,
      event[0].endDate
    );

    if (dayjs(endDate).isBefore(dayjs(event[0].startDate))) {
      endDate = dayjs(event[0].startDate)
        .add(state.minEventDuration ?? 15, 'minute')
        .toDate();
    }

    EventManager.handleEventDateChange(event[0].startDate, endDate, event[0]);
    return state;
  }
}
