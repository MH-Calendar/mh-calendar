import dayjs from 'dayjs';
import {
  MINUTES_IN_HOUR,
  WEEKEND_DAYS,
} from '../components/mh-calendar-day/mh-calendar-day.const';
import newMhCalendarStore from '../store/store/mh-calendar-store';

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

    const newDate = new Date(dayToSet);
    newDate.setHours(clickedHour);
    newDate.setMinutes(clickedMinutes);
    return newDate;
  }
}
