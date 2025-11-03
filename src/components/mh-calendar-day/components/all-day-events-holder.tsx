import { Component, Prop, h } from '@stencil/core';
import { MHCalendarEvents } from '../../../types';
import { DragDropState } from '../../../utils/DragDropHandler';
import newMhCalendarStore from '../../../store/store/mh-calendar-store';

@Component({
  tag: 'mh-calendar-day-all-day-events-holder',
  shadow: false,
})
export class AllDayEventsHolder {
  @Prop() showCurrentDate!: boolean;
  @Prop() allDayEvents!: MHCalendarEvents[];
  @Prop() dragDropState!: DragDropState;
  @Prop() onDragOver!: (e: DragEvent) => void;
  @Prop() onDragLeave!: (e: DragEvent) => void;
  @Prop() onDrop!: (e: DragEvent) => void;

  render() {
    if (this.showCurrentDate || !newMhCalendarStore.state.showAllDayTasks) {
      return null;
    }

    return (
      <div
        class="mhCalendarDay_allDaysEventHolder"
        style={{
          position: newMhCalendarStore.state.makeAllDaysSticky
            ? 'sticky'
            : 'absolute',
          height: newMhCalendarStore.state.allDayEventsHeight + 'px',
          ...newMhCalendarStore.getInlineStyleForClass(
            'mhCalendarDay_allDaysEventHolder'
          ),
        }}
        onDragOver={this.onDragOver}
        onDragLeave={this.onDragLeave}
        onDrop={this.onDrop}
      >
        {this.allDayEvents.map((event) => (
          <mh-calendar-event event={event} />
        ))}
        {this.dragDropState.isDraggedOverAllDay &&
          newMhCalendarStore.state.draggedEvent &&
          (() => {
            // Create a temporary event with allDay: true to force small rendering
            const previewEvent = {
              ...newMhCalendarStore.state.draggedEvent,
              allDay: true,
            };
            return <mh-calendar-event event={previewEvent} isDragged={true} />;
          })()}
      </div>
    );
  }
}
