import {
  Component,
  Prop,
  h,
} from '@stencil/core';
import { BusinessHoursUtils } from '../mh-calendar-day.utils';
import newMhCalendarStore from '../../../store/store/mh-calendar-store';

@Component({
  tag: 'mh-calendar-day-time-view-overlays',
  shadow: false,
})
export class TimeViewOverlays {
  @Prop() day!: Date;
  @Prop() calendarDayElementHeight!: number;
  @Prop() isToday!: boolean;
  @Prop() currentTimePosition?: { top: string };
  @Prop() isTimeView!: boolean;

  render() {
    if (!this.isTimeView) {
      return null;
    }

    // Non-business hours overlays
    const businessHours = BusinessHoursUtils.getBusinessHoursForDay(
      this.day,
      newMhCalendarStore.state.businessHours
    );
    const { viewType, showTimeFrom, showTimeTo } = newMhCalendarStore.state;

    const nonBusinessHoursStyles = BusinessHoursUtils.getNonBusinessHoursStyles(
      this.day,
      this.calendarDayElementHeight,
      viewType,
      businessHours,
      showTimeFrom,
      showTimeTo,
      newMhCalendarStore.headerMargin
    );

    return (
      <>
        {nonBusinessHoursStyles.map((style, index) => (
          <div
            key={`non-business-hours-${index}`}
            class="mhCalendarDay__nonBusinessHours"
            style={{
              ...style,
              ...newMhCalendarStore.getInlineStyleForClass(
                'mhCalendarDay__nonBusinessHours'
              ),
            }}
          />
        ))}
        {this.isToday && this.currentTimePosition && (
          <div
            class="mhCalendarDay__currentTime"
            style={{
              ...this.currentTimePosition,
              ...newMhCalendarStore.getInlineStyleForClass(
                'mhCalendarDay__currentTime'
              ),
            }}
          />
        )}
      </>
    );
  }
}

