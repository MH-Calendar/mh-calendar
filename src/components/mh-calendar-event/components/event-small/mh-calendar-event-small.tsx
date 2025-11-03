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

  private getEventColor(): string {
    // Use event-specific color if provided, otherwise use default from CSS variable
    if (this.event?.color) {
      return this.event.color;
    }

    // Fallback to default CSS variable
    const defaultColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--eventBackgroundColor')
      .trim();

    return defaultColor || '#00b536'; // Ultimate fallback to DEFAULT_THEME_COLOR
  }

  render() {
    if (!this.event) return;

    const eventColor = this.getEventColor();

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
            backgroundColor: eventColor,
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
