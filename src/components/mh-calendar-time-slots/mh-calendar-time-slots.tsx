import { Component, Element, h, State, Watch } from '@stencil/core';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { DaysGenerator } from '../../utils/DaysGenerator';
import dayjs from 'dayjs';
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

    // Render slots
    return Array.from({ length: this.amountOfPrintedSlots ?? 0 }).map(
      (_, index) => {
        const slotTime = calculateSlotTime(index);
        const displayTime = shouldShowTime(slotTime);
        const formattedTime = !displayTime
          ? ''
          : dayjs()
              .hour(displayTime)
              .minute(0)
              .format(newMhCalendarStore.state.hoursDisplayFormat);

        return (
          <div class="mhCalendarWeek__border">
            <span>{formattedTime}</span>
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
                  ...newMhCalendarStore.getInlineStyleForClass('gtm-info'),
                }}
              >
                GMT
                {(() => {
                  const offset = -new Date().getTimezoneOffset() / 60;
                  return offset >= 0 ? `+${offset}` : offset;
                })()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
}
