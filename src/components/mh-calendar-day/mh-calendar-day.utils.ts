import dayjs from 'dayjs';
import {
  MINUTES_IN_HOUR,
  NON_BUSINESS_HOURS_OVERLAY_Z_INDEX,
  FULL_WIDTH_PERCENTAGE,
  DATE_FORMAT_YYYY_MM_DD,
} from './mh-calendar-day.const';
import { MHCalendarEvents, BusinessHoursConfig } from '../../types';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { EventUtils } from '../../utils/EventUtils';
import { DateUtils } from '../../utils/DateUtils';
import { IMHCalendarViewType } from '../../store/store/mh-calendar-store.types';

export class DayUtils {
  static getDayStyles(day: string | Date): string[] {
    const isDayCurrentMonth = dayjs(day).isSame(
      newMhCalendarStore.state.calendarDateRange.fromDate,
      'month'
    );
    const style = [];
    if (isDayCurrentMonth) style.push('current-month');
    // Needed to properly show days with styles but not in the current month
    if (!isDayCurrentMonth) style.push('different-month');

    if (DateUtils.isToday(day)) style.push('today');
    if (DateUtils.isWeekend(day)) style.push('weekend');
    return style;
  }

  static calculateCurrentTimePosition(calendarDayElementHeight: number) {
    const currentDate = new Date();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const { headerMargin, hoursRangeCal } = newMhCalendarStore;
    const { showTimeTo, showTimeFrom } = newMhCalendarStore.state;

    if (!showTimeFrom || !showTimeTo) return;

    let totalDisplayedMinutes = hoursRangeCal * MINUTES_IN_HOUR;

    // Ensure the current time is within the displayed range
    const clampedHours = Math.max(showTimeFrom, Math.min(hours, showTimeTo));
    const clampedMinutes = clampedHours === hours ? minutes : 0;
    let currentDisplayedMinutes =
      (clampedHours - showTimeFrom) * MINUTES_IN_HOUR + clampedMinutes;
    const percentageOfDisplayedTime =
      (currentDisplayedMinutes / totalDisplayedMinutes) * 100;
    const topPosition =
      ((calendarDayElementHeight - headerMargin) * percentageOfDisplayedTime) /
      100;

    const calculatedTopPosition = topPosition + headerMargin || 0;
    return {
      top: calculatedTopPosition + 'px',
      display: calculatedTopPosition === headerMargin ? 'none' : 'block',
    };
  }

  static groupEvents(events: MHCalendarEvents[]): {
    dayEvents: Map<string, MHCalendarEvents[]>;
    allDayEvents: MHCalendarEvents[];
  } {
    // Separate events into allDay and regular events
    const allDayEvents = events.filter((event) => event.allDay === true);
    const regularEvents = events.filter((event) => event.allDay !== true);

    const groups: MHCalendarEvents[][] = [];

    // Process only regular events (not all-day events)
    regularEvents.forEach((currentEvent) => {
      const overlappingGroupIndices: number[] = [];

      // Find ALL existing groups that currentEvent overlaps with
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        // Check if currentEvent overlaps with ANY event in this group
        if (
          group.some((groupEvent) =>
            EventUtils.areEventsOverlapping(currentEvent, groupEvent)
          )
        ) {
          overlappingGroupIndices.push(i);
        }
      }

      if (overlappingGroupIndices.length === 0) {
        // No overlapping group found, create a new group
        groups.push([currentEvent]);
      } else {
        // Current event overlaps with one or more existing groups.
        // Add currentEvent to the first overlapping group.
        const targetGroupIndex = overlappingGroupIndices[0];
        groups[targetGroupIndex].push(currentEvent);

        // If currentEvent overlapped with multiple groups, these groups now need to be merged.
        // Merge other overlapping groups (beyond the first one) into the targetGroup.
        // Iterate backwards because we are modifying the 'groups' array by splicing.
        for (let i = overlappingGroupIndices.length - 1; i > 0; i--) {
          const groupToMergeIndex = overlappingGroupIndices[i];
          groups[targetGroupIndex].push(...groups[groupToMergeIndex]);
          groups.splice(groupToMergeIndex, 1); // Remove the merged group
        }
      }
    });

    // Convert groups to Map format (dayEvents)
    const dayEventsMap = new Map<string, MHCalendarEvents[]>();
    groups.forEach((group, index) => {
      // Sort events within the group by start date for consistent key generation (optional but good)
      group.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      const earliestStartTime = group[0].startDate.getTime(); // Assumes sorted or you can use Math.min
      const keyDate = new Date(earliestStartTime);

      // Using UTC methods for keys can make them more consistent across timezones
      const timeKey = `${keyDate.getUTCHours()}:${String(keyDate.getUTCMinutes()).padStart(2, '0')}-group-${index}`;
      dayEventsMap.set(timeKey, group);
    });

    // Sort all-day events by start date for consistency
    allDayEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return {
      dayEvents: dayEventsMap,
      allDayEvents: allDayEvents,
    };
  }

  static getDragEventTopPosition(
    mousePosition: number,
    calendarDayElementHeight: number
  ): number {
    const { hoursInDay, headerMargin } = newMhCalendarStore;
    const { showAllDayTasks, allDayEventsHeight } = newMhCalendarStore.state;

    const slotHeight = (calendarDayElementHeight - headerMargin) / hoursInDay;
    const slotIndex = Math.floor((mousePosition - headerMargin) / slotHeight);
    const topPosition = slotIndex * slotHeight;

    if (
      (showAllDayTasks && mousePosition < (allDayEventsHeight ?? 0)) ||
      mousePosition < 0
    ) {
      return headerMargin || 1;
    }

    return topPosition + (headerMargin || 1);
  }
}

export class BusinessHoursUtils {
  /**
   * Finds the business hours configuration for a specific day
   * Priority: specific date > day of week > default configuration
   */
  static getBusinessHoursForDay(
    day: Date,
    businessHours: BusinessHoursConfig[] | undefined
  ): { start: number; end: number } | null {
    if (
      !businessHours ||
      !Array.isArray(businessHours) ||
      businessHours.length === 0
    ) {
      return null;
    }

    const currentDay = dayjs(day);
    const currentDayOfWeek = currentDay.day(); // 0 = Sunday, 6 = Saturday
    const currentDateStr = currentDay.format(DATE_FORMAT_YYYY_MM_DD);

    // First, check for specific date match
    for (const config of businessHours) {
      if (config.date) {
        const configDate = dayjs(config.date);
        if (configDate.format(DATE_FORMAT_YYYY_MM_DD) === currentDateStr) {
          return { start: config.start, end: config.end };
        }
      }
    }

    // Then, check for day of week match
    for (const config of businessHours) {
      if (config.dayOfWeek !== undefined) {
        // Handle both array and single number
        const daysOfWeek = Array.isArray(config.dayOfWeek)
          ? config.dayOfWeek
          : [config.dayOfWeek];

        if (daysOfWeek.includes(currentDayOfWeek)) {
          return { start: config.start, end: config.end };
        }
      }
    }

    // Finally, check for default (no dayOfWeek or date specified)
    for (const config of businessHours) {
      if (config.dayOfWeek === undefined && !config.date) {
        return { start: config.start, end: config.end };
      }
    }

    return null;
  }

  /**
   * Calculates styles for non-business hours overlays (gray areas)
   * Returns array of style objects for each non-business hours range
   */
  static getNonBusinessHoursStyles(
    day: Date,
    calendarDayElementHeight: number,
    viewType: IMHCalendarViewType | undefined,
    businessHours: { start: number; end: number } | null,
    showTimeFrom: number | undefined,
    showTimeTo: number | undefined,
    headerMargin: number
  ): Array<Record<string, string>> {
    if (!viewType || !calendarDayElementHeight || !day) {
      return [];
    }

    const isTimeView = [
      IMHCalendarViewType.DAY,
      IMHCalendarViewType.WEEK,
    ].includes(viewType);

    if (!isTimeView) return [];

    // If no business hours configured, don't show overlay
    if (!businessHours || !showTimeFrom || !showTimeTo) {
      return [];
    }

    const availableHeight = calendarDayElementHeight - headerMargin;
    const totalDisplayedMinutes = (showTimeTo - showTimeFrom) * MINUTES_IN_HOUR;

    const calculatePosition = (hour: number): number => {
      const minutes = (hour - showTimeFrom) * MINUTES_IN_HOUR;
      const percentage =
        (minutes / totalDisplayedMinutes) * FULL_WIDTH_PERCENTAGE;
      return (
        (availableHeight * percentage) / FULL_WIDTH_PERCENTAGE + headerMargin
      );
    };

    const styles: Array<Record<string, string>> = [];
    const MIN_HEIGHT = 0;

    // Non-business hours before business hours
    if (showTimeFrom < businessHours.start) {
      const nonBusinessStart = calculatePosition(showTimeFrom);
      const nonBusinessEnd = Math.min(
        calculatePosition(businessHours.start),
        calendarDayElementHeight
      );
      const height = Math.max(
        MIN_HEIGHT,
        nonBusinessEnd - Math.max(headerMargin, nonBusinessStart)
      );

      if (height > MIN_HEIGHT) {
        styles.push({
          position: 'absolute',
          top: `${Math.max(headerMargin, nonBusinessStart)}px`,
          left: `${MIN_HEIGHT}`,
          width: `${FULL_WIDTH_PERCENTAGE}%`,
          height: `${height}px`,
          zIndex: `${NON_BUSINESS_HOURS_OVERLAY_Z_INDEX}`,
        });
      }
    }

    // Non-business hours after business hours
    if (showTimeTo > businessHours.end) {
      const nonBusinessStart = Math.max(
        headerMargin,
        calculatePosition(businessHours.end)
      );
      const nonBusinessEnd = calculatePosition(showTimeTo);
      const height = Math.max(
        MIN_HEIGHT,
        Math.min(calendarDayElementHeight, nonBusinessEnd) - nonBusinessStart
      );

      if (height > MIN_HEIGHT) {
        styles.push({
          position: 'absolute',
          top: `${nonBusinessStart}px`,
          left: `${MIN_HEIGHT}`,
          width: `${FULL_WIDTH_PERCENTAGE}%`,
          height: `${height}px`,
          zIndex: `${NON_BUSINESS_HOURS_OVERLAY_Z_INDEX}`,
        });
      }
    }

    return styles;
  }

  /**
   * Checks if a given date/time is within business hours
   * Returns true if the time is within business hours, false otherwise
   */
  static isWithinBusinessHours(
    date: Date,
    businessHours: BusinessHoursConfig[] | undefined
  ): boolean {
    const businessHoursForDay = this.getBusinessHoursForDay(
      date,
      businessHours
    );

    // If no business hours configured, allow all times
    if (!businessHoursForDay) {
      return true;
    }

    const currentHour = dayjs(date).hour();
    const currentMinute = dayjs(date).minute();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const businessStartInMinutes = businessHoursForDay.start * 60;
    const businessEndInMinutes = businessHoursForDay.end * 60;

    // Check if current time is within business hours
    // Note: end time is exclusive (not included)
    return (
      currentTimeInMinutes >= businessStartInMinutes &&
      currentTimeInMinutes < businessEndInMinutes
    );
  }

  /**
   * Checks if an event (with start and end times) fits within business hours
   * Returns true if the entire event fits within business hours, false otherwise
   */
  static isEventWithinBusinessHours(
    startDate: Date,
    endDate: Date,
    businessHours: BusinessHoursConfig[] | undefined
  ): boolean {
    // Get business hours for the start date (assuming same day event)
    const businessHoursForDay = this.getBusinessHoursForDay(
      startDate,
      businessHours
    );

    // If no business hours configured, allow all times
    if (!businessHoursForDay) {
      return true;
    }

    const startHour = dayjs(startDate).hour();
    const startMinute = dayjs(startDate).minute();
    const startTimeInMinutes = startHour * 60 + startMinute;

    const endHour = dayjs(endDate).hour();
    const endMinute = dayjs(endDate).minute();
    const endTimeInMinutes = endHour * 60 + endMinute;

    const businessStartInMinutes = businessHoursForDay.start * 60;
    const businessEndInMinutes = businessHoursForDay.end * 60;

    // Check if entire event is within business hours
    return (
      startTimeInMinutes >= businessStartInMinutes &&
      endTimeInMinutes <= businessEndInMinutes
    );
  }
}
