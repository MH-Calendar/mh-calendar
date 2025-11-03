import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import {
  MINUTES_IN_HOUR,
  WEEKEND_DAYS,
} from '../components/mh-calendar-day/mh-calendar-day.const';
import newMhCalendarStore from '../store/store/mh-calendar-store';
import { TimezoneUtils } from './TimezoneUtils';

// Load dayjs timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export class DateUtils {
  static convertDateToString = (
    date: Date,
    format: string = 'YYYY-MM-DD'
  ): string => {
    return dayjs(date).format(format);
  };

  static formatDateRange(from: Date, to: Date, isOneDay = false): string {
    const fromDate = dayjs(from);
    const toDate = dayjs(to);

    if (isOneDay || fromDate.isSame(toDate, 'day')) {
      return fromDate.format('MMMM D, YYYY');
    }

    const sameMonth = fromDate.month() === toDate.month();
    const sameYear = fromDate.year() === toDate.year();

    const fromStr = fromDate.format('MMMM D');
    const toStr = sameMonth ? toDate.format('D') : toDate.format('MMMM D');

    const yearStr = sameYear
      ? fromDate.format(', YYYY')
      : `, ${fromDate.year()} - ${toDate.year()}`;

    return `${fromStr} - ${toStr}${yearStr}`;
  }

  static isToday(day: string | Date): boolean {
    return dayjs(day).isSame(dayjs(), 'day');
  }

  static isWeekend(day: string | Date): boolean {
    return WEEKEND_DAYS.includes(dayjs(day).day());
  }

  static getExactDateBasedOnUserPosition(
    userTopPosition: number, // Place of where user has clicked, or event was dropped etc
    dayToSet: Date
  ): Date {
    const { heightOfCalendarDay, showTimeTo, showTimeFrom } =
      newMhCalendarStore.state;
    const { headerMargin } = newMhCalendarStore;

    if (!heightOfCalendarDay || !showTimeTo || !showTimeFrom) return dayToSet;

    const adjustedMousePosition = userTopPosition - headerMargin;
    const adjustedCalendarHeight = heightOfCalendarDay - headerMargin;
    const userPositionInDayPercentage =
      adjustedMousePosition / adjustedCalendarHeight;

    const totalDisplayedMinutes = (showTimeTo - showTimeFrom) * MINUTES_IN_HOUR;

    const clickedHour = Math.floor(
      (totalDisplayedMinutes * userPositionInDayPercentage) / MINUTES_IN_HOUR +
        showTimeFrom
    );
    const clickedMinutes = Math.floor(
      Math.round(totalDisplayedMinutes * userPositionInDayPercentage) %
        MINUTES_IN_HOUR
    );

    // Get main timezone if configured
    const timezones = newMhCalendarStore.state.timezones || [];
    const mainTimezone = TimezoneUtils.getMainTimezone(timezones);
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // If main timezone is configured and different from browser, create date in main timezone
    if (mainTimezone && mainTimezone !== browserTimezone) {
      // Parse the day date as a string to avoid timezone conversion issues
      const dayString = dayjs(dayToSet).format('YYYY-MM-DD');

      // Create date in main timezone with the clicked hour/minute
      const dateInMainTz = dayjs.tz(
        `${dayString} ${String(clickedHour).padStart(2, '0')}:${String(clickedMinutes).padStart(2, '0')}:00`,
        mainTimezone
      );

      // Convert to JavaScript Date (which uses browser's local timezone)
      // This Date object represents the correct moment in time
      return dateInMainTz.toDate();
    }

    // Default: use browser timezone (current behavior)
    const newDate = new Date(dayToSet);
    newDate.setHours(clickedHour);
    newDate.setMinutes(clickedMinutes);
    return newDate;
  }
}
