import { Component, State, h } from '@stencil/core';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { DaysGenerator } from '../../utils/DaysGenerator';
import { IMHCalendarDateRange } from '../../types';
import { VIEW_HEIGHT } from '../../const/default-theme';

@Component({
  tag: 'mh-calendar-month',
  styleUrl: 'mh-calendar-month.css',
  shadow: false,
})
export class MHCalendarMonth {
  @State() currentFromDate: Date | undefined;

  connectedCallback() {
    this.currentFromDate = newMhCalendarStore.state.calendarDateRange.fromDate;
    newMhCalendarStore.onChange(
      'calendarDateRange',
      (value: IMHCalendarDateRange) => {
        this.currentFromDate = value.fromDate;
      }
    );
  }

  render() {
    if (!this.currentFromDate) return;

    const daysInMonth = DaysGenerator.getDatesForMonthView(
      this.currentFromDate
    );
    return (
      <div
        class="mhCalendarMonth"
        style={{
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarMonth'),
        }}
      >
        <mh-calendar-header />
        <div
          style={{
            height: newMhCalendarStore.state.fixedHeight ?? VIEW_HEIGHT,
            overflow: newMhCalendarStore.state.fixedHeight
              ? 'scroll'
              : 'hidden',
          }}
        >
          <div
            class="mhCalendarMonth__days"
            style={{
              height: newMhCalendarStore.state.virtualScrollHeight ?? '100%',
            }}
          >
            {daysInMonth.map((day) => {
              return <mh-calendar-day day={day} showCurrentDate={true} />;
            })}
          </div>
        </div>
      </div>
    );
  }
}
