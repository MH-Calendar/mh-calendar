import dayjs from 'dayjs';
import {
  MILLISECONDS_IN_HOUR,
  MINUTES_IN_HOUR,
} from '../components/mh-calendar-day/mh-calendar-day.const';
import newMhCalendarStore from '../store/store/mh-calendar-store';
import { MHCalendarEvents } from '../types';
import { EventUtils } from './EventUtils';

const DEFAULT_EVENT_WIDTH = 100; // 100%
const EVENT_MARGIN = 2; // pixels

export class EventStyleManager {
  /**
   * Calculates optimal width and position for overlapping events
   * Based on the maximum number of events that overlap at any given time
   */
  static calculateEventWidth(
    events: MHCalendarEvents[],
    currentEventIndex: number
  ) {
    if (events.length === 1) {
      return {
        width: `${DEFAULT_EVENT_WIDTH}%`,
        left: '0%',
        marginLeft: '0px',
      };
    }

    const currentEvent = events[currentEventIndex];

    // Find all events that overlap with the current event
    const overlappingEvents = events.filter((event) =>
      EventUtils.areEventsOverlapping(currentEvent, event)
    );

    // Calculate the maximum number of concurrent overlapping events
    // This determines how many columns we need
    const maxConcurrentEvents =
      EventStyleManager.calculateMaxConcurrentEvents(events);

    // Find the position (column) of the current event among its overlapping events
    const currentEventColumn = EventStyleManager.findEventColumn(
      currentEvent,
      overlappingEvents
    );

    // Calculate width based on maximum concurrent events (not total events)
    const totalMarginSpace = EVENT_MARGIN * (maxConcurrentEvents - 1);
    const availableWidth =
      DEFAULT_EVENT_WIDTH - (totalMarginSpace / window.innerWidth) * 100;
    const eventWidth = availableWidth / maxConcurrentEvents;

    // Calculate left position based on the event's column
    const leftPosition =
      eventWidth * currentEventColumn +
      ((EVENT_MARGIN * currentEventColumn) / window.innerWidth) * 100;

    return {
      width: `calc(${eventWidth}% - 2px)`, // -2 is margin to event not touching
      left: `${leftPosition}%`,
      marginLeft: '0px',
    };
  }

  /**
   * Calculates the maximum number of events that overlap at any given time
   */
  static calculateMaxConcurrentEvents(events: MHCalendarEvents[]): number {
    if (events.length <= 1) return events.length;

    // Create time points for start and end of each event
    const timePoints: {
      time: number;
      type: 'start' | 'end';
      eventId: string;
    }[] = [];

    events.forEach((event) => {
      timePoints.push(
        { time: event.startDate.getTime(), type: 'start', eventId: event.id },
        { time: event.endDate.getTime(), type: 'end', eventId: event.id }
      );
    });

    // Sort time points by time, with 'start' before 'end' for same time
    timePoints.sort((a, b) => {
      if (a.time === b.time) {
        return a.type === 'start' ? -1 : 1;
      }
      return a.time - b.time;
    });

    let currentConcurrent = 0;
    let maxConcurrent = 0;

    // Sweep through time points
    timePoints.forEach((point) => {
      if (point.type === 'start') {
        currentConcurrent++;
        maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      } else {
        currentConcurrent--;
      }
    });

    return maxConcurrent;
  }

  /**
   * Finds the optimal column (position) for an event among overlapping events
   */
  static findEventColumn(
    currentEvent: MHCalendarEvents,
    overlappingEvents: MHCalendarEvents[]
  ): number {
    // Sort overlapping events by start time, then by duration (shorter events first)
    const sortedOverlapping = overlappingEvents.sort((a, b) => {
      const startDiff = a.startDate.getTime() - b.startDate.getTime();
      if (startDiff !== 0) return startDiff;

      // If same start time, shorter events first
      const durationA = a.endDate.getTime() - a.startDate.getTime();
      const durationB = b.endDate.getTime() - b.startDate.getTime();
      return durationA - durationB;
    });

    // Find the index of current event in sorted overlapping events
    const currentEventIndex = sortedOverlapping.findIndex(
      (event) => event.id === currentEvent.id
    );

    return currentEventIndex;
  }

  static calculateEventHeight(
    startDate: Date,
    endDate: Date,
    dayHeight: number,
    currentDate?: Date,
    showTimeFrom: number = 10,
    showTimeTo: number = 24
  ): string {
    if (!currentDate) {
      return '0px';
    }

    // Get the top margin for all-day events (same logic as position calculation)
    const topMarginOfAllDayEvents = newMhCalendarStore.headerMargin;

    // Available height for timed events (excluding the top margin)
    const availableHeight = dayHeight - topMarginOfAllDayEvents;

    const visibleHoursPerDay = showTimeTo - showTimeFrom;
    if (visibleHoursPerDay <= 0 || availableHeight <= 0) {
      return '0px';
    }

    const s_time = startDate.getTime();
    const e_time = endDate.getTime();
    if (s_time >= e_time) {
      return '0px';
    }

    // Calculate the current day boundaries
    const c_day_start_obj = new Date(currentDate);
    c_day_start_obj.setHours(0, 0, 0, 0);
    const c_day_start_time = c_day_start_obj.getTime();

    const c_day_end_obj = new Date(currentDate);
    c_day_end_obj.setHours(0, 0, 0, 0);
    c_day_end_obj.setDate(c_day_end_obj.getDate() + 1);
    const c_day_end_time = c_day_end_obj.getTime();

    // Check if event overlaps with current day
    if (e_time <= c_day_start_time || s_time >= c_day_end_time) {
      return '0px';
    }

    // Get the actual start and end times within the current day
    const actualStartMillis = Math.max(s_time, c_day_start_time);
    const actualEndMillis = Math.min(e_time, c_day_end_time);

    // Convert milliseconds to hours from start of day
    const actualStartHour =
      (actualStartMillis - c_day_start_time) / MILLISECONDS_IN_HOUR;
    const actualEndHour =
      (actualEndMillis - c_day_start_time) / MILLISECONDS_IN_HOUR;

    // Clamp to visible time window
    const renderStartHour = Math.max(actualStartHour, showTimeFrom);
    const renderEndHour = Math.min(actualEndHour, showTimeTo);

    const durationInHours = renderEndHour - renderStartHour;
    if (durationInHours <= 0) {
      return '0px';
    }

    // Use available height (not total dayHeight) for calculation
    const hourHeight = availableHeight / visibleHoursPerDay;
    const eventHeight = durationInHours * hourHeight;

    // -2 added to have a margin, to events not touch when start
    // just after each other
    return `${Math.round(eventHeight) - 2}px`;
  }

  static calculateEventTopPosition(
    eventStartDate: Date,
    isAllDayEvent: boolean,
    calendarDayElementHeight: number,
    day: string | Date
  ): number {
    if (isAllDayEvent) {
      return 0;
    }
    const topMarginOfAllDayEvents = newMhCalendarStore.headerMargin ;

    // If event start before the day, return top calendar position
    if (
      !calendarDayElementHeight ||
      dayjs(day).isAfter(dayjs(eventStartDate), 'day')
    )
      return topMarginOfAllDayEvents;

    // Space in calendar day for events without all day events (top margin)
    const availableHeight = calendarDayElementHeight - topMarginOfAllDayEvents;
    const hours = eventStartDate.getHours();
    const minutes = eventStartDate.getMinutes();

    const startHour = newMhCalendarStore.state.showTimeFrom;
    const endHour = newMhCalendarStore.state.showTimeTo;

    if (!startHour || !endHour) return 0;

    const totalDisplayedMinutes = (endHour - startHour) * MINUTES_IN_HOUR;

    // Ensure the event time is within the displayed range
    const clampedHours = Math.max(startHour, Math.min(hours, endHour));
    const clampedMinutes = clampedHours === hours ? minutes : 0;

    const currentDisplayedMinutes =
      (clampedHours - startHour) * MINUTES_IN_HOUR + clampedMinutes;

    const percentageOfDisplayedTime =
      (currentDisplayedMinutes / totalDisplayedMinutes) * 100;

    const topPosition = (availableHeight * percentageOfDisplayedTime) / 100;

    return topPosition + topMarginOfAllDayEvents - 2; // Adjust for border
  }
}
