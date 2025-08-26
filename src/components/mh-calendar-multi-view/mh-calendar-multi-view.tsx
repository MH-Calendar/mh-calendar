import { Component, Element, h } from '@stencil/core';

import { DaysGenerator } from '../../utils/DaysGenerator';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { VIEW_HEIGHT } from '../../const/default-theme';

@Component({
  tag: 'mh-calendar-multi-view',
  styleUrl: 'mh-calendar-multi-view.css',
  shadow: false,
})
export class MHCalendarMultiView {
  @Element() MHCalendarMultiViewEl?: HTMLElement;

  updateCSSProperties() {
    const daysInView = newMhCalendarStore.daysInRange;

    this.MHCalendarMultiViewEl?.style.setProperty(
      '--days-in-view',
      `${daysInView}`
    );
  }

  componentWillLoad() {
    this.updateCSSProperties();

    newMhCalendarStore.onChange('calendarDateRange', () => {
      this.updateCSSProperties();
    });
  }

  render() {
    const generatedDays = DaysGenerator.getDatesForMultiView();
    return (
      <div
        class="mhCalendarMultiView"
        style={{
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarMultiView'),
        }}
      >
        <mh-calendar-header showCurrentDate={true} />
        <div
          class="mhCalendarMultiView__holder"
          style={{
            height: newMhCalendarStore.state.fixedHeight ?? VIEW_HEIGHT,
            overflow: newMhCalendarStore.state.fixedHeight
              ? 'scroll'
              : 'hidden',
            ...newMhCalendarStore.getInlineStyleForClass(
              'mhCalendarMultiView__holder'
            ),
          }}
        >
          <mh-calendar-time-slots />
          {generatedDays.map((day) => {
            return <mh-calendar-day key={day.toISOString()} day={day} />;
          })}
        </div>
      </div>
    );
  }
}
