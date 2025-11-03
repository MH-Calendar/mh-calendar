import dayjs from 'dayjs';
import newMhCalendarStore from '../store/store/mh-calendar-store';
import { MHCalendarEvents } from '../types';
import { DateUtils } from './DateUtils';
import { EventUtils } from './EventUtils';
import { IMHCalendarEvent } from '../components';

type EventBuilderMapById = Map<string, MHCalendarEvents>;
export type EventBuilderMapByDate = Map<string, EventBuilderMapById>;

export class EventManager {
  /**
   * Generate a unique id for a newly created event
   */
  public static generateEventId(): string {
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `event-${Date.now()}-${randomPart}`;
  }

  /**
   * Get all date keys for a date range
   */
  private static getDateKeysInRange = (
    startDate: Date,
    endDate: Date,
    isAllDay: boolean = false
  ): string[] => {
    const dateKeys: string[] = [];

    if (isAllDay) {
      // For all-day events, extract just the date part to avoid timezone issues
      const startDateStr = DateUtils.convertDateToString(startDate);
      const endDateStr = DateUtils.convertDateToString(endDate);

      let currentDate = dayjs(startDateStr);
      const endDateTime = dayjs(endDateStr);

      while (
        currentDate.isSame(endDateTime, 'day') ||
        currentDate.isBefore(endDateTime, 'day')
      ) {
        dateKeys.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(1, 'day');
      }
    } else {
      // For timed events, use the actual timestamps but work with days
      let currentDate = dayjs(startDate).startOf('day');
      const endDateTime = dayjs(endDate).startOf('day');

      while (
        currentDate.isSame(endDateTime, 'day') ||
        currentDate.isBefore(endDateTime, 'day')
      ) {
        dateKeys.push(currentDate.format('YYYY-MM-DD'));
        currentDate = currentDate.add(1, 'day');
      }
    }

    return dateKeys;
  };

  /**
   * Remove event from all dates in the events map
   */
  private static removeEventFromAllDates = (
    events: EventBuilderMapByDate,
    eventID: string
  ): void => {
    for (const [dateKey, dateEvents] of events) {
      if (dateEvents.has(eventID)) {
        dateEvents.delete(eventID);
        // Clean up empty date entries
        if (dateEvents.size === 0) {
          events.delete(dateKey);
        }
      }
    }
  };

  /**
   * Add event to all relevant dates
   */
  private static addEventToDates = (
    events: EventBuilderMapByDate,
    eventData: MHCalendarEvents
  ): void => {
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);
    const eventDates = this.getDateKeysInRange(
      startDate,
      endDate,
      eventData.allDay || false
    );

    eventDates.forEach((dateKey) => {
      if (!events.has(dateKey)) {
        events.set(dateKey, new Map<string, MHCalendarEvents>());
      }
      events.get(dateKey)!.set(eventData.id, eventData);
    });
  };

  /**
   * Map events by date for calendar display
   */
  public static mapEventsByDate = (
    events: MHCalendarEvents[]
  ): EventBuilderMapByDate => {
    const eventsByDate = new Map<string, Map<string, MHCalendarEvents>>();

    events.forEach((event) => {
      this.addEventToDates(eventsByDate, event);
    });

    return eventsByDate;
  };

  /**
   * Update an existing event
   */
  public static updateEvent(
    events: EventBuilderMapByDate,
    eventID: string,
    eventData: MHCalendarEvents
  ): void {
    this.removeEventFromAllDates(events, eventID);
    this.addEventToDates(events, eventData);
  }

  /**
   * Add a new event
   */
  public static addEvent(
    events: EventBuilderMapByDate,
    eventData: MHCalendarEvents
  ): void {
    this.addEventToDates(events, eventData);
  }

  /**
   * Remove an event
   */
  public static removeEvent(
    events: EventBuilderMapByDate,
    eventID: string
  ): void {
    this.removeEventFromAllDates(events, eventID);
  }

  /**
   * Get all events for a specific date
   */
  public static getEventsForDate(
    events: EventBuilderMapByDate,
    date: Date | string
  ): MHCalendarEvents[] {
    const dateKey =
      typeof date === 'string' ? date : DateUtils.convertDateToString(date);
    const dailyEvents = events.get(dateKey);

    if (dailyEvents) {
      return Array.from(dailyEvents.values()).filter((event) => {
        return EventUtils.shouldEventBeDisplayedInTimeView(
          event,
          new Date(`${dateKey}T00:00:00`) // to avoid issues with timezones
        );
      });
    }
    return [];
  }

  /**
   * Handle event date change for drag and drop functionality
   */
  public static handleEventDateChange(
    newStartDate: Date,
    newEndDate: Date,
    event?: IMHCalendarEvent
  ): void {
    let originalEvent: IMHCalendarEvent | null = event ?? null;
    const { reactiveEvents, draggedEvent } = newMhCalendarStore.state;

    if (!event) {
      if (!draggedEvent?.id) {
        console.error('No dragged event found');
        return;
      }

      // Find the original event data (get from any date key that contains it)
      for (const [_, eventsMap] of reactiveEvents) {
        if (eventsMap.has(draggedEvent.id)) {
          originalEvent = eventsMap.get(draggedEvent.id)!;
          break;
        }
      }
    }
    if (!originalEvent) {
      console.error('Event not found in reactive events');
      return;
    }

    // Store original date range for cleanup
    const originalStartDate = new Date(originalEvent.startDate);
    const originalEndDate = new Date(originalEvent.endDate);
    const originalDateKeys = this.getDateKeysInRange(
      originalStartDate,
      originalEndDate,
      originalEvent.allDay || false
    );

    // Remove event from all original date keys
    originalDateKeys.forEach((dateKey) => {
      if (reactiveEvents.has(dateKey)) {
        const eventsMap = reactiveEvents.get(dateKey)!;
        eventsMap.delete(originalEvent.id);
        // Clean up empty date entries
        if (eventsMap.size === 0) {
          reactiveEvents.delete(dateKey);
        }
      }
    });

    // Update the event with new dates
    const updatedEvent: MHCalendarEvents = {
      ...originalEvent,
      startDate: newStartDate,
      endDate: newEndDate,
      isHidden: false,
    };

    // Get new date keys where the event should be placed
    const newDateKeys = this.getDateKeysInRange(
      newStartDate,
      newEndDate,
      updatedEvent.allDay || false
    );

    // Add the updated event to all new date keys
    newDateKeys.forEach((dateKey) => {
      if (!reactiveEvents.has(dateKey)) {
        reactiveEvents.set(dateKey, new Map());
      }
      reactiveEvents.get(dateKey)!.set(updatedEvent.id, updatedEvent);
    });

    // Trigger reactivity by creating a new Map reference
    newMhCalendarStore.state.reactiveEvents = new Map(reactiveEvents);

    // Clear the dragged event
    newMhCalendarStore.state.draggedEvent = null;
  }
}
