import {
  Component,
  Prop,
  h,
} from '@stencil/core';
import { MHCalendarEvents } from '../../../types';
import { EventStyleManager } from '../../../utils/EventStyleManager';
import { EventRenderer } from '../../../utils/EventRenderer';
import newMhCalendarStore from '../../../store/store/mh-calendar-store';
import { EventDisplayMode } from '../../../types/enums';

@Component({
  tag: 'mh-calendar-day-time-view-events',
  shadow: false,
})
export class TimeViewEvents {
  @Prop() groupedEvents!: Map<string, MHCalendarEvents[]>;
  @Prop() calendarDayElementHeight?: number;
  @Prop() day?: Date;

  render() {
    if (!this.calendarDayElementHeight || !this.day) {
      return null;
    }

    return (
      <>
        {Array.from(this.groupedEvents.entries()).flatMap(([_, events]) =>
          events
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
            .map((event, index) => {
              const instanceId = `${event.id}-${index}`;
              const eventTopPosition = EventStyleManager.calculateEventTopPosition(
                event.startDate,
                event.allDay ?? false,
                this.calendarDayElementHeight!,
                this.day!
              );
              // Use appropriate method based on eventDisplayMode
              const eventDisplayMode =
                newMhCalendarStore.state.eventDisplayMode || EventDisplayMode.SideBySide;
              const positionStyle =
                eventDisplayMode === EventDisplayMode.Overlapping
                  ? EventStyleManager.calculateEventWidthOverlapping(events, index)
                  : EventStyleManager.calculateEventWidth(events, index);

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
            })
        )}
      </>
    );
  }
}

