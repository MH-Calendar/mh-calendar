import dayjs from 'dayjs';
import newMhCalendarStore from '../store/store/mh-calendar-store';
import { MHCalendarEvents } from '../types';

export class EventUtils {
  static areEventsOverlapping(
    event1: MHCalendarEvents,
    event2: MHCalendarEvents
  ): boolean {
    const start1 = event1.startDate.getTime();
    const end1 = event1.endDate.getTime();
    const start2 = event2.startDate.getTime();
    const end2 = event2.endDate.getTime();

    // Events overlap if one starts before the other ends
    return start1 < end2 && start2 < end1;
  }

  static shouldEventBeDisplayedInTimeView(
    event: MHCalendarEvents,
    date: Date
  ): boolean {
    const { showTimeFrom, showTimeTo } = newMhCalendarStore.state;

    if (!showTimeFrom || !showTimeTo) return false;

    const eventStartDate = dayjs(event.startDate);
    const eventEndDate = dayjs(event.endDate);
    const viewDate = dayjs(date);

    const viewDayStart = viewDate.startOf('day');
    const viewDayEnd = viewDate.endOf('day');

    if (
      eventEndDate.isBefore(viewDayStart) ||
      eventStartDate.isAfter(viewDayEnd)
    ) {
      return false;
    }

    const viewWindowStart = viewDate.set('hour', showTimeFrom).startOf('hour');
    const viewWindowEnd = viewDate.set('hour', showTimeTo).startOf('hour'); // no endOf

    let effectiveEventStartForView = eventStartDate.isAfter(viewWindowStart)
      ? eventStartDate
      : viewWindowStart;

    let effectiveEventEndForView = eventEndDate.isBefore(viewWindowEnd)
      ? eventEndDate
      : viewWindowEnd;

    // Treat end time as exclusive
    return effectiveEventStartForView.isBefore(effectiveEventEndForView);
  }
}
