import { Component, h, Prop } from '@stencil/core';
import newMhCalendarStore from '../../../../store/store/mh-calendar-store';
import {
  IMHCalendarEvent,
  IMHCalendarViewType,
} from '../../../../store/store/mh-calendar-store.types';
import dayjs from 'dayjs';

@Component({
  tag: 'mh-calendar-event-full',
  styleUrl: 'mh-calendar-event-full.css',
  shadow: false,
})
export class MHCalendarEventFull {
  @Prop() event?: IMHCalendarEvent;

  render() {
    if (!this.event) return;

    return (
      <div
        class="mhCalendarEventFull"
        style={{
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarEventFull'),
        }}
      >
        {typeof newMhCalendarStore.state?.eventContent === 'function' ? (
          <div
            class="mhCalendarEventFull__userEventContentHolder"
            style={{
              ...newMhCalendarStore.getInlineStyleForClass(
                'mhCalendarEventFull__userEventContentHolder'
              ),
            }}
            innerHTML={newMhCalendarStore.state.eventContent(this.event)}
          />
        ) : (
          <div
            class="mhCalendarEventFull__content"
            style={{
              ...newMhCalendarStore.getInlineStyleForClass(
                'mhCalendarEventFull__content'
              ),
            }}
          >
            <div
              class="mhCalendarEventFull__content__title"
              style={{
                ...newMhCalendarStore.getInlineStyleForClass(
                  'mhCalendarEventFull__content__title'
                ),
              }}
            >
              {this.event.title}
            </div>
            {newMhCalendarStore.state.viewType !==
              IMHCalendarViewType.MONTH && (
              <>
                <div
                  class="mhCalendarEventFull__content__date"
                  style={{
                    ...newMhCalendarStore.getInlineStyleForClass(
                      'mhCalendarEventFull__content__date'
                    ),
                  }}
                >
                  {dayjs(this.event.startDate).format('h:mm a')}-
                  {dayjs(this.event.endDate).format('h:mm a')}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}
