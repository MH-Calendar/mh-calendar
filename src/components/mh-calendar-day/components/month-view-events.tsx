import { Component, Prop, h } from '@stencil/core';
import { MHCalendarEvents } from '../../../types';
import { EventStyleManager } from '../../../utils/EventStyleManager';
import { EventRenderer } from '../../../utils/EventRenderer';
import newMhCalendarStore from '../../../store/store/mh-calendar-store';
import { EventDisplayMode } from '../../../types/enums';

@Component({
  tag: 'mh-calendar-day-month-view-events',
  shadow: false,
})
export class MonthViewEvents {
  @Prop() groupedEvents!: Map<string, MHCalendarEvents[]>;
  @Prop() maxVisibleEventsInMonthView!: number;
  @Prop() calendarDayElementHeight?: number;
  @Prop() day?: Date;

  render() {
    if (!this.calendarDayElementHeight || !this.day) {
      return null;
    }

    return (
      <div
        class="mhCalendarDay__eventsContainer"
        style={{
          minHeight: '0',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {Array.from(this.groupedEvents.entries()).map(([_, events]) => {
          const sortedEvents = events.sort(
            (a, b) => a.startDate.getTime() - b.startDate.getTime()
          );
          const maxEvents = this.maxVisibleEventsInMonthView;
          const hasMoreEvents = sortedEvents.length > maxEvents;
          const eventsToShow = hasMoreEvents
            ? sortedEvents.slice(0, maxEvents - 1)
            : sortedEvents.slice(0, maxEvents);

          return [
            ...eventsToShow.map((event, index) => {
              const instanceId = `${event.id}-${index}`;
              const eventTopPosition =
                EventStyleManager.calculateEventTopPosition(
                  event.startDate,
                  event.allDay ?? false,
                  this.calendarDayElementHeight!,
                  this.day!
                );
              // Use appropriate method based on eventDisplayMode
              const eventDisplayMode =
                newMhCalendarStore.state.eventDisplayMode ||
                EventDisplayMode.SideBySide;
              const positionStyle =
                eventDisplayMode === EventDisplayMode.Overlapping
                  ? EventStyleManager.calculateEventWidthOverlapping(
                      sortedEvents,
                      index
                    )
                  : EventStyleManager.calculateEventWidth(sortedEvents, index);

              return (
                <div
                  key={instanceId}
                  data-instance={instanceId}
                  class="mhCalendarDay__eventHolder"
                  style={{
                    ...EventRenderer.getEventHolderStyle(
                      eventTopPosition,
                      positionStyle,
                      newMhCalendarStore.state.viewType
                    ),
                    ...newMhCalendarStore.getInlineStyleForClass(
                      'mhCalendarDay__eventHolder'
                    ),
                  }}
                >
                  <mh-calendar-event
                    event={event}
                    dayHeight={this.calendarDayElementHeight}
                    eventTopPosition={eventTopPosition}
                    dayOfRendering={this.day}
                  />
                </div>
              );
            }),
            hasMoreEvents
              ? [
                  <div
                    class="mhCalendarDay__eventHolder"
                    style={{
                      ...EventRenderer.getEventHolderStyle(
                        0,
                        {},
                        newMhCalendarStore.state.viewType
                      ),
                      ...newMhCalendarStore.getInlineStyleForClass(
                        'mhCalendarDay__eventHolder'
                      ),
                    }}
                  >
                    <div
                      class="mhCalendarDay__eventsLeftIndicator"
                      style={{
                        ...newMhCalendarStore.getInlineStyleForClass(
                          'mhCalendarDay__eventsLeftIndicator'
                        ),
                      }}
                    >
                      {`${sortedEvents.length - eventsToShow.length} more`}
                    </div>
                  </div>,
                ]
              : [],
          ].flat();
        })}
      </div>
    );
  }
}
