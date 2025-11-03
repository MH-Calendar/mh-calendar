import {
  Component,
  Prop,
  h,
} from '@stencil/core';
import { DragDropState } from '../../../utils/DragDropHandler';
import { EventRenderer } from '../../../utils/EventRenderer';
import newMhCalendarStore from '../../../store/store/mh-calendar-store';
import { IMHCalendarViewType } from '../../../store/store/mh-calendar-store.types';

@Component({
  tag: 'mh-calendar-day-dragged-event-preview',
  shadow: false,
})
export class DraggedEventPreview {
  @Prop() dragDropState!: DragDropState;
  @Prop() day?: Date;
  @Prop() calendarDayElementHeight?: number;
  @Prop() viewType?: IMHCalendarViewType;

  render() {
    if (
      !this.dragDropState.isDraggedOver ||
      !newMhCalendarStore.state.draggedEvent
    ) {
      return null;
    }

    return (
      <div
        class={`mhCalendarDay__eventHolder ${this.dragDropState.isDraggedOverBlocked ? 'mhCalendarDay__eventHolder--blocked' : ''}`}
        style={{
          ...EventRenderer.getStylesForDraggedEvent(
            this.dragDropState.isDraggedOver,
            this.dragDropState.isDraggedOverBlocked,
            this.day,
            this.calendarDayElementHeight,
            this.viewType
          ),
          ...newMhCalendarStore.getInlineStyleForClass(
            'mhCalendarDay__eventHolder'
          ),
        }}
      >
        <mh-calendar-event
          event={newMhCalendarStore.state.draggedEvent}
          dayHeight={this.calendarDayElementHeight}
          eventTopPosition={this.dragDropState.isDraggedOver}
          dayOfRendering={this.day}
          isDragged={true}
        />
      </div>
    );
  }
}

