import dayjs from 'dayjs';
import newMhCalendarStore from '../store/store/mh-calendar-store';

const TOTAL_DAYS_TO_DISPLAY_IN_MONTH_VIEW = 42;

export class DaysGenerator {
  static getDaysInWeek = (): Date[] => {
    const day = newMhCalendarStore.state.calendarDateRange.fromDate;

    if (!day) return [];

    const startOfWeek = new Date();
    startOfWeek.setDate(day.getDate() - day.getDay() + 1);
    const daysInWeek: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      daysInWeek.push(currentDay);
    }
    return daysInWeek;
  };

  /**
   * This function returns an array of dates that should be displayed within the month view.
   * It calculates these dates based on the date passed as a parameter.
   * The function includes all dates from the month of the provided date, as well as
   * dates from the previous and next months to ensure the view is fully populated.
   */
  static getDatesForMonthView = (day: Date): Date[] => {
    const year = day.getFullYear();
    const month = day.getMonth();
    const daysInMonth: Date[] = [];
    const daysCount = new Date(year, month + 1, 0).getDate();

    // Add days from the current month
    for (let i = 1; i <= daysCount; i++) {
      daysInMonth.push(new Date(year, month, i));
    }

    // Ensure the first day is a Monday or go back to previous month
    while (daysInMonth[0].getDay() !== 1) {
      const firstDay = daysInMonth[0];
      const previousDay = new Date(firstDay);
      previousDay.setDate(firstDay.getDate() - 1);
      daysInMonth.unshift(previousDay);
    }

    // Ensure the last day is a Sunday or go forward to the next month
    while (daysInMonth[daysInMonth.length - 1].getDay() !== 0) {
      const lastDay = daysInMonth[daysInMonth.length - 1];
      const nextDay = new Date(lastDay);
      nextDay.setDate(lastDay.getDate() + 1);
      daysInMonth.push(nextDay);
    }

    // Ensure exactly 6 weeks (42 days) for consistent grid
    while (daysInMonth.length < TOTAL_DAYS_TO_DISPLAY_IN_MONTH_VIEW) {
      const lastDay = daysInMonth[daysInMonth.length - 1];
      const nextDay = new Date(lastDay);
      nextDay.setDate(lastDay.getDate() + 1);
      daysInMonth.push(nextDay);
    }

    return daysInMonth;
  };

  static getDatesForMultiView(): Date[] {
    const generatedDays: Date[] = [];
    const fromDate = newMhCalendarStore.state.calendarDateRange.fromDate;
    const toDate = newMhCalendarStore.state.calendarDateRange.toDate;
    if (dayjs(fromDate).isAfter(toDate, 'day')) return generatedDays;
    if (dayjs(fromDate).isSame(toDate, 'day'))
      return fromDate ? [fromDate] : [];

    const hiddenDays = newMhCalendarStore.state.hiddenDays || [];
    // Normalize hiddenDays: convert 7 to 0 (Sunday), keep others as is
    const normalizedHiddenDays = hiddenDays.map((day) => (day === 7 ? 0 : day));

    let current = dayjs(fromDate);

    while (current.isBefore(toDate, 'day') || current.isSame(toDate, 'day')) {
      const dayOfWeek = current.day(); // 0 = Sunday, 6 = Saturday
      // Only add day if it's not in the hiddenDays array
      if (!normalizedHiddenDays.includes(dayOfWeek)) {
        generatedDays.push(current.toDate());
      }
      current = current.add(1, 'day');
    }

    return generatedDays;
  }

  public static generateSlotHours(userInput: {
    hours: number;
    minutes: number;
  }): string[] {
    const { showTimeFrom, showTimeTo } = newMhCalendarStore.state;

    if (!showTimeFrom || !showTimeTo) return [];

    const slots: string[] = [];

    // Calculate total interval in minutes
    const intervalMinutes = userInput.hours * 60 + userInput.minutes;

    if (intervalMinutes === 0) {
      return slots;
    }

    // Start from fromDate time
    let currentHour = showTimeFrom;
    let currentMinute = 0;

    // Generate slots until we reach the end time (inclusive)
    while (
      currentHour < showTimeTo ||
      (currentHour === showTimeTo && currentMinute === 0)
    ) {
      // Format the time string
      const hourStr = currentHour.toString();
      const minuteStr =
        currentMinute === 0
          ? ''
          : `:${currentMinute.toString().padStart(2, '0')}`;
      const timeSlot = hourStr + minuteStr;

      slots.push(timeSlot);

      // Add the interval
      currentMinute += intervalMinutes;

      // Handle minute overflow
      if (currentMinute >= 60) {
        const additionalHours = Math.floor(currentMinute / 60);
        currentHour += additionalHours;
        currentMinute = currentMinute % 60;
      }
    }
    return slots;
  }
}
