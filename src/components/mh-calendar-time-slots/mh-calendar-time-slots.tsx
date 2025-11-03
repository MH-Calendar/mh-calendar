import { Component, Element, h, State, Watch } from '@stencil/core';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { DaysGenerator } from '../../utils/DaysGenerator';
import { TimezoneUtils } from '../../utils/TimezoneUtils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Load dayjs timezone plugins
dayjs.extend(utc);
dayjs.extend(timezone);
@Component({
  tag: 'mh-calendar-time-slots',
  styleUrl: 'mh-calendar-time-slots.css',
  shadow: false,
})
export class MHCalendarTimeSlots {
  @Element() MHCalendarTimeSlotsElement: any;

  @State() currentTimeFrom?: Date;
  @State() amountOfPrintedSlots?: number;
  @State() amountOfPrintedHoursSlots?: string[];

  connectedCallback() {
    this.currentTimeFrom = newMhCalendarStore.state.calendarDateRange.fromDate;

    if (
      !newMhCalendarStore.state.slotInterval ||
      !newMhCalendarStore.state.hoursSlotInterval
    )
      return;

    const userSlotDivider =
      (newMhCalendarStore.state.slotInterval.hours * 60 +
        newMhCalendarStore.state.slotInterval.minutes) /
      60;

    const userHourSlotDivider = DaysGenerator.generateSlotHours(
      newMhCalendarStore.state.hoursSlotInterval
    );

    this.amountOfPrintedSlots =
      newMhCalendarStore.hoursRangeCal / userSlotDivider;

    this.amountOfPrintedHoursSlots = userHourSlotDivider;

    newMhCalendarStore.onChange('calendarDateRange', () => {
      if (newMhCalendarStore.state.calendarDateRange.fromDate) {
        this.currentTimeFrom =
          newMhCalendarStore.state.calendarDateRange.fromDate;
      }
    });
  }

  @Watch('currentTimeFrom')
  private generateTimeSlots() {
    const { headerMargin } = newMhCalendarStore;

    this.MHCalendarTimeSlotsElement.style.setProperty(
      '--border-slots-length',
      `calc((100% - ${headerMargin}px) / ${this.amountOfPrintedSlots})`
    );

    if (this.amountOfPrintedHoursSlots) {
      const hourLabels = this.amountOfPrintedHoursSlots.map((h) => parseInt(h));
      const hourInterval =
        hourLabels.length > 1 ? hourLabels[1] - hourLabels[0] : 1;
      const totalHourIntervals =
        (hourLabels[hourLabels.length - 1] - hourLabels[0]) / hourInterval;
      this.MHCalendarTimeSlotsElement.style.setProperty(
        '--time-slots-length',
        `calc((100% - ${headerMargin}px) / ${totalHourIntervals + 1})`
      );
    }

    if (
      newMhCalendarStore.state.heightOfCalendarDay &&
      this.amountOfPrintedHoursSlots?.length
    ) {
      newMhCalendarStore.state.heightOfCalendarHour =
        newMhCalendarStore.state.heightOfCalendarDay /
        this.amountOfPrintedHoursSlots.length;
    }
  }

  private renderCalendarSlots() {
    if (
      !newMhCalendarStore.state.slotInterval ||
      !newMhCalendarStore.state.hoursSlotInterval
    )
      return;
    // Extract constants
    const slotDurationMinutes =
      newMhCalendarStore.state.slotInterval.hours * 60 +
      newMhCalendarStore.state.slotInterval.minutes;
    const hourIntervalMinutes =
      newMhCalendarStore.state.hoursSlotInterval.hours * 60 +
      newMhCalendarStore.state.hoursSlotInterval.minutes;
    const startTimeMinutes = (newMhCalendarStore.state.showTimeFrom || 0) * 60;

    // Helper functions
    const calculateSlotTime = (index: number) => {
      const totalMinutes =
        index === 0
          ? startTimeMinutes
          : startTimeMinutes + slotDurationMinutes * index;
      return totalMinutes / 60; // Convert to hours
    };

    const shouldShowTime = (timeInHours: number) => {
      const hourInterval = hourIntervalMinutes / 60;
      return timeInHours % hourInterval === 0 ? timeInHours : '';
    };

    // Get timezones
    const timezones = newMhCalendarStore.state.timezones || [];
    const mainTimezone = TimezoneUtils.getMainTimezone(timezones);
    const additionalTimezones = timezones.slice(1); // Skip first (main) timezone

    // Render slots
    return Array.from({ length: this.amountOfPrintedSlots ?? 0 }).map(
      (_, index) => {
        const slotTime = calculateSlotTime(index);
        const displayTime = shouldShowTime(slotTime);

        if (!displayTime) {
          return (
            <div class="mhCalendarWeek__border">
              <span></span>
            </div>
          );
        }

        // Format main timezone time
        // Use main timezone if specified, otherwise use browser default
        const referenceDate = this.currentTimeFrom || new Date();
        const dateString = dayjs(referenceDate).format('YYYY-MM-DD');

        const formattedMainTime =
          mainTimezone &&
          mainTimezone !== Intl.DateTimeFormat().resolvedOptions().timeZone
            ? dayjs
                .tz(
                  `${dateString} ${String(Math.floor(displayTime)).padStart(2, '0')}:${String(Math.round((displayTime % 1) * 60)).padStart(2, '0')}:00`,
                  mainTimezone
                )
                .format(newMhCalendarStore.state.hoursDisplayFormat)
            : dayjs()
                .hour(displayTime)
                .minute(0)
                .format(newMhCalendarStore.state.hoursDisplayFormat);

        // Format additional timezones
        const additionalTimes = additionalTimezones.map((tz, tzIndex) => {
          const formattedTime = TimezoneUtils.formatTimeInTimezone(
            Math.floor(displayTime),
            Math.round((displayTime % 1) * 60),
            mainTimezone,
            tz,
            newMhCalendarStore.state.hoursDisplayFormat,
            referenceDate
          );
          const abbreviation = TimezoneUtils.getTimezoneAbbreviation(tz);

          return {
            formattedTime,
            abbreviation,
            timezone: tz,
            key: `tz-${tzIndex}`,
          };
        });

        return (
          <div class="mhCalendarWeek__border">
            <div class="mhCalendarWeek__border__timeContainer">
              <span class="mhCalendarWeek__border__mainTime">
                {formattedMainTime}
              </span>
              {additionalTimes.length > 0 && (
                <div class="mhCalendarWeek__border__additionalTimezones">
                  {additionalTimes.map(
                    ({ formattedTime, abbreviation, timezone, key }) => (
                      <span
                        key={key}
                        class="mhCalendarWeek__border__additionalTime"
                        title={timezone}
                      >
                        {formattedTime}
                        {abbreviation && (
                          <span class="mhCalendarWeek__border__tzAbbr">
                            {abbreviation}
                          </span>
                        )}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        );
      }
    );
  }

  render() {
    this.generateTimeSlots();

    if (!newMhCalendarStore.hoursInDay) return <></>;

    return (
      <div
        style={{
          height: newMhCalendarStore.state.virtualScrollHeight ?? '100%',
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarTimeSlots'),
        }}
        class="mhCalendarTimeSlots"
      >
        <div
          style={{
            height: newMhCalendarStore.state.virtualScrollHeight ?? '100%',
            ...newMhCalendarStore.getInlineStyleForClass(
              'mhCalendarWeek__borders'
            ),
          }}
          class="mhCalendarWeek__borders"
        >
          {newMhCalendarStore.state.showAllDayTasks && (
            <div
              class="mhCalendarWeek__border"
              style={{
                height: `${newMhCalendarStore.state.allDayEventsHeight}px`,
                ...newMhCalendarStore.getInlineStyleForClass(
                  'mhCalendarWeek__border'
                ),
              }}
            />
          )}
          {this.renderCalendarSlots()}
        </div>
        <div class="mhCalendarTimeSlots__timeHolder">
          {newMhCalendarStore.state.showAllDayTasks && (
            <div
              class="time__holder"
              style={{
                height: `${newMhCalendarStore.state.allDayEventsHeight}px`,
                ...newMhCalendarStore.getInlineStyleForClass('time__holder'),
              }}
            >
              <span
                class="gtm-info"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  width: '100%',
                  height: '100%',
                  ...newMhCalendarStore.getInlineStyleForClass('gtm-info'),
                }}
              >
                {newMhCalendarStore.state.timezoneLabel !== undefined
                  ? newMhCalendarStore.state.timezoneLabel
                  : (() => {
                      const timezones =
                        newMhCalendarStore.state.timezones || [];
                      const mainTimezone =
                        TimezoneUtils.getMainTimezone(timezones);
                      const offset =
                        TimezoneUtils.getTimezoneOffset(mainTimezone);
                      const abbr =
                        TimezoneUtils.getTimezoneAbbreviation(mainTimezone);

                      if (abbr) {
                        return `${abbr} (GMT${offset >= 0 ? '+' : ''}${offset})`;
                      }

                      return `GMT${offset >= 0 ? '+' : ''}${offset}`;
                    })()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
