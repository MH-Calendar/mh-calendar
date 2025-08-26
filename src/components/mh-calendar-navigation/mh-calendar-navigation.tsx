import { Component, h, Prop, State } from '@stencil/core';
import { IMHCalendarDateRange } from '../../types';
import { DEFAULT_NAVIGATION_UNIT } from '../../defaults';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import {
  IMHCalendarViewType,
  MHCalendarReducerStoreActions,
} from '../../store/store/mh-calendar-store.types';
import dayjs from 'dayjs';
import { state } from '../../store/store';
import { DateUtils } from '../../utils/DateUtils';

@Component({
  tag: 'mh-calendar-navigation',
  styleUrl: 'mh-calendar-navigation.css',
  shadow: false,
})
export class MhCalendarNavigation {
  @Prop() changeDateRangeByUnit: IMHCalendarViewType = DEFAULT_NAVIGATION_UNIT;

  @State() currentDateRange?: IMHCalendarDateRange;

  private isOneDay: boolean = false;

  connectedCallback() {
    this.currentDateRange = { ...newMhCalendarStore.state.calendarDateRange };

    newMhCalendarStore.onChange('calendarDateRange', (value) => {
      this.currentDateRange = { ...value };
    });

    this.isOneDay = dayjs(
      newMhCalendarStore.state.calendarDateRange.fromDate
    ).isSame(newMhCalendarStore.state.calendarDateRange.toDate, 'day');

    newMhCalendarStore.onChange('viewType', () => {
      this.isOneDay = dayjs(
        newMhCalendarStore.state.calendarDateRange.fromDate
      ).isSame(newMhCalendarStore.state.calendarDateRange.toDate, 'day');
    });
  }

  private onTodayClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    newMhCalendarStore.dispatch({
      type: MHCalendarReducerStoreActions.SET_TO_TODAY,
      payload: {},
    });
  };

  private onViewChange = (newViewType: IMHCalendarViewType) => {
    newMhCalendarStore.dispatch({
      type: MHCalendarReducerStoreActions.CHANGE_VIEW,
      payload: {
        viewType: newViewType,
      },
    });
  };

  private onDateRangeChange(event: Event, amount: number) {
    event.preventDefault();
    event.stopPropagation();

    // Todo: Make to func when will be rdy to remove old store
    if (amount > 0) {
      newMhCalendarStore.dispatch({
        type: MHCalendarReducerStoreActions.NEXT_DATE_RANGE,
        payload: {},
      });
    } else {
      newMhCalendarStore.dispatch({
        type: MHCalendarReducerStoreActions.PREV_DATE_RANGE,
        payload: {},
      });
    }
  }

  render() {
    const { fromDate, toDate } = newMhCalendarStore.state.calendarDateRange;
    if (!fromDate || !toDate) return;

    return (
      <div
        class="mhCalendarNavigation__container"
        style={{
          ...newMhCalendarStore.getInlineStyleForClass(
            'mhCalendarNavigation__container'
          ),
        }}
      >
        {newMhCalendarStore.state.showDateSwitcher && (
          <div class="mhCalendarNavigation">
            <button
              onClick={(e) => this.onDateRangeChange(e, -1)}
            >{`<`}</button>
            <span>
              {DateUtils.formatDateRange(fromDate, toDate, this.isOneDay) ||
                '...'}
            </span>
            <button onClick={(e) => this.onDateRangeChange(e, 1)}>{`>`}</button>
            <button onClick={this.onTodayClick}>Today</button>
          </div>
        )}
        {newMhCalendarStore.state.showViewTypeSwitcher && (
          <div class="mhCalendarNavigation__viewSwitcher">
            <button
              class={`view-switch-btn ${state.viewType === IMHCalendarViewType.DAY ? 'active' : ''}`}
              onClick={() => this.onViewChange(IMHCalendarViewType.DAY)}
            >
              Day
            </button>
            <button
              class={`view-switch-btn ${state.viewType === IMHCalendarViewType.WEEK ? 'active' : ''}`}
              onClick={() => this.onViewChange(IMHCalendarViewType.WEEK)}
            >
              Week
            </button>
            <button
              class={`view-switch-btn ${state.viewType === IMHCalendarViewType.MONTH ? 'active' : ''}`}
              onClick={() => this.onViewChange(IMHCalendarViewType.MONTH)}
            >
              Month
            </button>
          </div>
        )}
      </div>
    );
  }
}
