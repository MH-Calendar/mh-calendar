import { Component, h, Prop } from '@stencil/core';
import { IMHCalendarEvent } from '../../../../components';
import newMhCalendarStore from '../../../../store/store/mh-calendar-store';

@Component({
  tag: 'mh-calendar-event-small',
  styleUrl: 'mh-calendar-event-small.css',
  shadow: false,
})
export class MHCalendarEventSmall {
  @Prop() event?: IMHCalendarEvent;

  render() {
    if (!this.event) return;

    return (
      <div
        class="mhCalendarEventSmall"
        style={{
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarEventSmall'),
        }}
      >
        <div
          class="mhCalendarEventSmall__dot"
          style={{
            ...newMhCalendarStore.getInlineStyleForClass(
              'mhCalendarEventSmall__dot'
            ),
          }}
        ></div>
        <span>{this.event.title}</span>
      </div>
    );
  }
}
