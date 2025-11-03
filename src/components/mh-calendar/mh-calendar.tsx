import { Component, Method, Prop, State, h } from '@stencil/core';
import { IMHCalendarFullOptions, UserApi } from '../../types';
import {
  base64Svg,
  DEFAULT_WEEK_VIEW_CONFIG,
} from '../../const/default-config';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import {
  IMHCalendarEvent,
  IMHCalendarViewType,
  MHCalendarReducerStoreActions,
} from '../../store/store/mh-calendar-store.types';
import { createUserAPI } from '../../store/store/mh-calendar-store.user-api';

@Component({
  tag: 'mh-calendar',
  styleUrl: 'mh-calendar.css',
  shadow: false,
})
export class MHCalendar {
  @Prop() config: IMHCalendarFullOptions = {};
  @Prop() reactComponent: any;
  @Prop() events: IMHCalendarEvent[] = [];

  @State() svgContent: string = '';

  @Method()
  async getApi(): Promise<UserApi> {
    const userAPI = createUserAPI(newMhCalendarStore);
    return userAPI;
  }

  componentWillLoad() {
    if (window.location.protocol.includes('https')) {
      this.svgContent = atob(base64Svg);
    }
    // Initialize the calendar store or update only if events are null or prop has changed
    if (!newMhCalendarStore.state.reactiveEvents.size) {
      newMhCalendarStore.dispatch({
        type: MHCalendarReducerStoreActions.SET_CONFIG,
        payload: {
          ...DEFAULT_WEEK_VIEW_CONFIG,
          ...this.config,
          events: this.events,
        },
      });
    }
  }

  private getCorrectViewType() {
    switch (newMhCalendarStore.state.viewType) {
      case IMHCalendarViewType.DAY:
        return <mh-calendar-multi-view />;
      case IMHCalendarViewType.WEEK:
        return <mh-calendar-multi-view />;
      case IMHCalendarViewType.MONTH:
        return <mh-calendar-month />;
      case IMHCalendarViewType.AGENDA:
        return <mh-calendar-agenda-view />;
      default:
        return <mh-calendar-multi-view />;
    }
  }

  render() {
    if (!newMhCalendarStore.state.reactiveEvents) return;
    return (
      <div
        class="mhCalendar"
        onDrop={() => {}}
        onDragOver={(e) => e.preventDefault()}
        style={{ ...newMhCalendarStore.getInlineStyleForClass('mhCalendar') }}
      >
        {newMhCalendarStore.state.showCalendarNavigation && (
          <div class="mhCalendar__navigationHolder">
            <mh-calendar-navigation
              changeDateRangeByUnit={newMhCalendarStore.state.viewType}
            />
          </div>
        )}
        <div class="mhCalendar__calendarViewHolder">
          {this.getCorrectViewType()}
        </div>
        <mh-calendar-modal />
        {/* <div innerHTML={this.svgContent} /> */}
      </div>
    );
  }
}
