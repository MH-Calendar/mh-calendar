import { Component, Element, State, h, Watch } from '@stencil/core';
import dayjs from 'dayjs';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { DaysGenerator } from '../../utils/DaysGenerator';
import { EventManager } from '../../utils/EventManager';
import { DateUtils } from '../../utils/DateUtils';
import { MHCalendarEvents } from '../../types';
import { VIEW_HEIGHT } from '../../const/default-theme';

@Component({
  tag: 'mh-calendar-agenda-view',
  styleUrl: 'mh-calendar-agenda-view.css',
  shadow: false,
})
export class MHCalendarAgendaView {
  @Element() el?: HTMLElement;

  @State() sortedEvents: Array<{
    date: Date;
    events: MHCalendarEvents[];
  }> = [];

  componentWillLoad() {
    this.updateEvents();

    // Watch for changes in calendar date range and events
    newMhCalendarStore.onChange('calendarDateRange', () => {
      this.updateEvents();
    });

    newMhCalendarStore.onChange('reactiveEvents', () => {
      this.updateEvents();
    });
  }

  @Watch('sortedEvents')
  handleEventsChange() {
    // Force re-render if needed
  }

  private updateEvents() {
    const { fromDate, toDate } = newMhCalendarStore.state.calendarDateRange;
    if (!fromDate || !toDate) return;

    // Agenda view works for DAY and WEEK - use calendarDateRange
    // For DAY: fromDate === toDate (single day)
    // For WEEK: fromDate to toDate (week range)
    let dates: Date[];

    if (dayjs(fromDate).isSame(toDate, 'day')) {
      // Single day
      dates = [fromDate];
    } else {
      // Week range - use getDatesForMultiView to respect hiddenDays
      dates = DaysGenerator.getDatesForMultiView();

      // If getDatesForMultiView doesn't return dates (e.g., hiddenDays filter all days),
      // fallback to generating dates from range
      if (dates.length === 0) {
        dates = [];
        let current = dayjs(fromDate);
        const end = dayjs(toDate);
        while (current.isBefore(end, 'day') || current.isSame(end, 'day')) {
          dates.push(current.toDate());
          current = current.add(1, 'day');
        }
      }
    }

    // Get all events for the date range and sort them
    const allEvents: Array<{ date: Date; event: MHCalendarEvents }> = [];

    dates.forEach((date) => {
      const eventsForDate = EventManager.getEventsForDate(
        newMhCalendarStore.state.reactiveEvents,
        date
      );

      eventsForDate.forEach((event) => {
        allEvents.push({ date, event });
      });
    });

    // Group events by date
    const eventsByDate = new Map<
      string,
      { date: Date; events: MHCalendarEvents[] }
    >();

    allEvents.forEach(({ date, event }) => {
      const dateKey = DateUtils.convertDateToString(date);

      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, { date, events: [] });
      }

      const dayData = eventsByDate.get(dateKey)!;

      // Check if event is not already added (to avoid duplicates)
      if (!dayData.events.find((e) => e.id === event.id)) {
        dayData.events.push(event);
      }
    });

    // Sort events within each day by start time
    // All-day events come first, then timed events sorted by start time
    eventsByDate.forEach((dayData) => {
      dayData.events.sort((a, b) => {
        // All-day events come first
        if (a.allDay && !b.allDay) return -1;
        if (!a.allDay && b.allDay) return 1;

        // If both all-day or both timed, sort by start time
        return a.startDate.getTime() - b.startDate.getTime();
      });
    });

    // Sort days chronologically
    const sortedDays = Array.from(eventsByDate.values()).sort((a, b) => {
      return a.date.getTime() - b.date.getTime();
    });

    this.sortedEvents = sortedDays;
  }

  private formatEventTime(event: MHCalendarEvents): string {
    if (event.allDay) {
      return 'All Day';
    }

    const startTime = dayjs(event.startDate);
    const endTime = dayjs(event.endDate);

    // Check if same day
    if (startTime.isSame(endTime, 'day')) {
      // Same day - show time range
      const startStr = startTime.format('h:mm A');
      const endStr = endTime.format('h:mm A');

      // If same time (duration 0 or very short), just show start time
      if (startTime.isSame(endTime, 'minute')) {
        return startStr;
      }

      return `${startStr} - ${endStr}`;
    }

    // Different days - show date and time
    const startStr = startTime.format('MMM D, h:mm A');
    const endStr = endTime.format('MMM D, h:mm A');
    return `${startStr} - ${endStr}`;
  }

  private formatDate(date: Date): string {
    const d = dayjs(date);
    const today = dayjs();

    if (d.isSame(today, 'day')) {
      return 'Today';
    }

    if (d.isSame(today.add(1, 'day'), 'day')) {
      return 'Tomorrow';
    }

    if (d.isSame(today.subtract(1, 'day'), 'day')) {
      return 'Yesterday';
    }

    // Check if within current week
    const startOfWeek = today.startOf('week');
    const endOfWeek = today.endOf('week');

    if (d.isAfter(startOfWeek) && d.isBefore(endOfWeek)) {
      return d.format('dddd'); // Day name (Monday, Tuesday, etc.)
    }

    // Default format
    return d.format('MMMM D, YYYY');
  }

  render() {
    const containerHeight = newMhCalendarStore.state.fixedHeight ?? VIEW_HEIGHT;

    if (this.sortedEvents.length === 0) {
      return (
        <div
          class="mhCalendarAgendaView mhCalendarAgendaView--empty"
          style={{
            height: containerHeight,
            overflow: 'hidden',
          }}
        >
          <div class="mhCalendarAgendaView__emptyMessage">
            No events scheduled
          </div>
        </div>
      );
    }

    return (
      <div
        style={{
          height: containerHeight,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '0',
        }}
      >
        <div
          class="mhCalendarAgendaView"
          style={{
            flex: '1 1 0',
            minHeight: '0',
            maxHeight: '100%',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {this.sortedEvents.map((dayData) => (
            <div
              key={DateUtils.convertDateToString(dayData.date)}
              class="mhCalendarAgendaView__day"
            >
              <div class="mhCalendarAgendaView__dayHeader">
                <span class="mhCalendarAgendaView__dayDate">
                  {this.formatDate(dayData.date)}
                </span>
                <span class="mhCalendarAgendaView__dayDateFull">
                  {dayjs(dayData.date).format('MMM D, YYYY')}
                </span>
              </div>
              <div class="mhCalendarAgendaView__events">
                {dayData.events.map((event) => {
                  const eventContent = newMhCalendarStore.state.eventContent;
                  const customContent =
                    eventContent && typeof eventContent === 'function'
                      ? eventContent(event)
                      : null;

                  // Get event color (use event-specific color or default)
                  const eventColor =
                    event.color ||
                    getComputedStyle(document.documentElement)
                      .getPropertyValue('--eventBackgroundColor')
                      .trim() ||
                    '#3b82f6';

                  // Read-only view - no click handlers, no drag handlers
                  return (
                    <div
                      key={event.id}
                      class="mhCalendarAgendaView__event"
                      data-event-id={event.id}
                      style={
                        {
                          '--eventColor': eventColor,
                        } as any
                      }
                    >
                      <div class="mhCalendarAgendaView__eventTime">
                        {this.formatEventTime(event)}
                      </div>
                      <div class="mhCalendarAgendaView__eventContent">
                        {customContent ? (
                          <div class="mhCalendarAgendaView__eventCustom">
                            {customContent}
                          </div>
                        ) : (
                          <>
                            <div class="mhCalendarAgendaView__eventTitle">
                              {event.title || 'Untitled Event'}
                            </div>
                            {event.description && (
                              <div class="mhCalendarAgendaView__eventDescription">
                                {event.description}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}
