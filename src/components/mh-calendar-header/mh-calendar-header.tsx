import { Component, h, Prop, State } from '@stencil/core';
import { IMHCalendarDateRange } from '../../types';
import dayjs from 'dayjs';
import { IMHCalendarViewType } from '../../store/store/mh-calendar-store.types';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { DateUtils } from '../../utils/DateUtils';
import { DaysGenerator } from '../../utils/DaysGenerator';

@Component({
  tag: 'mh-calendar-header',
  styleUrl: 'mh-calendar-header.css',
  shadow: false,
})
export class MHCalendarHeader {
  @Prop() showCurrentDate: boolean = false;
  @State() currentDateRange?: IMHCalendarDateRange;

  connectedCallback() {
    this.currentDateRange = newMhCalendarStore.state.calendarDateRange;
    newMhCalendarStore.onChange('calendarDateRange', (value) => {
      this.currentDateRange = { ...value };
    });
  }

  private formatDate(date: Date) {
    if (this.showCurrentDate) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            scale: '0.8',
          }}
        >
          <span
            style={{
              letterSpacing: '2px',
            }}
          >{`${dayjs(date).format('ddd')}`}</span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
            }}
          >{`${dayjs(date).date()}`}</span>
        </div>
      );
    }

    return <span>{dayjs(date).format('ddd')}</span>;
  }

  private getGridTemplateColumns() {
    switch (newMhCalendarStore.state.viewType) {
      case IMHCalendarViewType.DAY:
        return {
          display: 'grid',
          gridTemplateColumns: '40px 1fr',
        };
      case IMHCalendarViewType.WEEK:
        const daysCount = newMhCalendarStore.daysInRange;
        return {
          display: 'grid',
          gridTemplateColumns: `${newMhCalendarStore.state.properties.timeSlotWidth ?? '40px'} repeat(${daysCount}, 1fr)`,
        };
      case IMHCalendarViewType.MONTH:
      default:
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
        };
    }
  }

  render() {
    let days: Date[] = [];

    if (
      !this.currentDateRange?.fromDate ||
      !newMhCalendarStore.state.showViewHeader
    )
      return;

    switch (newMhCalendarStore.state.viewType) {
      case IMHCalendarViewType.DAY:
        // For day view, show only the current day (if not hidden)
        const dayViewDate = this.currentDateRange.fromDate;
        const dayViewDayOfWeek = dayjs(dayViewDate).day();
        const hiddenDays = newMhCalendarStore.state.hiddenDays || [];
        const normalizedHiddenDays = hiddenDays.map((day) =>
          day === 7 ? 0 : day
        );
        if (!normalizedHiddenDays.includes(dayViewDayOfWeek)) {
          days = [dayViewDate];
        }
        break;
      case IMHCalendarViewType.MONTH:
        // For month view, show all days in the month grid
        days = DaysGenerator.getDatesForMonthView(
          this.currentDateRange.fromDate
        ).slice(0, 7);
        break;
      case IMHCalendarViewType.WEEK:
      default:
        // For week view, show all visible days (filtered by hiddenDays)
        days = DaysGenerator.getDatesForMultiView();
        break;
    }

    return (
      <div
        class="mhCalendarHeader"
        style={{
          ...this.getGridTemplateColumns(),
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarHeader'),
        }}
      >
        {/* This empty div is to fill the grid layout */}
        {(newMhCalendarStore.state.viewType === IMHCalendarViewType.WEEK ||
          newMhCalendarStore.state.viewType === IMHCalendarViewType.DAY) && (
          <div />
        )}

        {days.map((day) => (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              class={`mhCalendarHeader__date ${DateUtils.isToday(day) ? 'mhCalendarHeader__today' : ''}`}
              style={{
                ...newMhCalendarStore.getInlineStyleForClass(
                  'mhCalendarHeader__date'
                ),
                ...(DateUtils.isToday(day)
                  ? newMhCalendarStore.getInlineStyleForClass(
                      'mhCalendarHeader__today'
                    )
                  : {}),
              }}
            >
              {this.formatDate(day)}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
