import { Component, Element, h, Prop } from '@stencil/core';
import { MHCalendarEvents } from '../../types';
import {
  IMHCalendarViewType,
  MHCalendarReducerStoreActions,
} from '../../store/store/mh-calendar-store.types';
import newMhCalendarStore from '../../store/store/mh-calendar-store';
import { EventStyleManager } from '../../utils/EventStyleManager';
import { DEFAULT_MONTH_EVENT_HEIGHT } from '../../defaults';
import { EventModalHelper } from '../../utils/EventModalHelper';

@Component({
  tag: 'mh-calendar-event',
  styleUrl: 'mh-calendar-event.css',
  shadow: false,
})
export class MHCalendarEvent {
  @Prop() event?: MHCalendarEvents;
  @Prop() dayHeight?: number;
  @Prop() eventTopPosition?: number;
  @Prop() dayOfRendering?: Date;
  @Prop() isDragged: boolean = false;
  @Prop() instanceOfEvent?: string;

  @Element() el?: HTMLElement;

  private onEventClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (!this.event || !this.el) return;

    // Open modal for event editing
    const rect = this.el.getBoundingClientRect();

    const modalContent = EventModalHelper.createEventModalContent(
      this.event,
      false, // isNewEvent
      (updatedEvent) => {
        // Update event via callback
        if (typeof newMhCalendarStore.state.onEventUpdated === 'function') {
          newMhCalendarStore.state.onEventUpdated(updatedEvent);
        }
        // Also call original onEventClick if provided
        if (typeof newMhCalendarStore.state.onEventClick === 'function') {
          newMhCalendarStore.state.onEventClick(updatedEvent);
        }
      },
      () => {
        // Cancel - just call original onEventClick if provided
        if (
          typeof newMhCalendarStore.state.onEventClick === 'function' &&
          this.event
        ) {
          newMhCalendarStore.state.onEventClick(this.event);
        }
      }
    );

    newMhCalendarStore.openModal(modalContent, {
      rect,
      alignment: 'right',
    });
  }

  private onRightEventClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (newMhCalendarStore.state.onRightEventClick && this.event) {
      newMhCalendarStore.state.onRightEventClick(this.event);
    }
  }

  private calculateEventHeight() {
    if (!this.event || !this.dayHeight) return;

    const height = this.event.allDay
      ? '40px'
      : EventStyleManager.calculateEventHeight(
          this.event?.startDate,
          this.event?.endDate,
          this.dayHeight,
          this.dayOfRendering, // Always use dayOfRendering, not endDate
          newMhCalendarStore.state.showTimeFrom,
          newMhCalendarStore.state.showTimeTo,
          this.isDragged // useFullDuration = true when dragged
        );
    return height;
  }

  private onDragStart = (event: DragEvent | TouchEvent) => {
    if (!this.el || !this.event) return;

    this.event.isHidden = true;
    this.el.style.opacity = '0.3';

    newMhCalendarStore.dispatch({
      type: MHCalendarReducerStoreActions.SET_DRAGGED_EVENT,
      payload: {
        event: this.event,
      },
    });

    const dragData = {
      event2: this.event,
      startDate: this.event.startDate,
      endDate: this.event.endDate,
      ...event,
    };

    if (
      event instanceof DragEvent &&
      'dataTransfer' in event &&
      !!event.dataTransfer
    ) {
      event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      event.dataTransfer.effectAllowed = 'move';
      const img = new Image();
      img.src =
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; // 1x1 transparent gif
      event.dataTransfer?.setDragImage(img, 0, 0);
    }
  };

  private onDragEnd = () => {
    if (!this.el) return;

    this.el.style.opacity = '1';
  };

  private getEventColor(): string {
    // Use event-specific color if provided, otherwise use default from CSS variable
    if (this.event?.color) {
      return this.event.color;
    }

    // Fallback to default CSS variable
    const defaultColor = getComputedStyle(document.documentElement)
      .getPropertyValue('--eventBackgroundColor')
      .trim();

    return defaultColor || '#00b536'; // Ultimate fallback to DEFAULT_THEME_COLOR
  }

  private getMHCalendarEventStyle() {
    if (!this.el || !this.event || !newMhCalendarStore.state.viewType) return;

    const eventColor = this.getEventColor();

    // When dragged, ensure full opacity for the preview (original item fades separately)
    if (this.isDragged && !this.event?.allDay) {
      return {
        height: '100%',
        width: '100%',
        position: 'relative',
        opacity: '1',
        backgroundColor: eventColor,
        borderRadius: '5px', // Ensure border radius is visible
        overflow: 'hidden', // Ensure content stays within rounded corners
        ...newMhCalendarStore.getInlineStyleForClass('mhCalendarEvent'),
      };
    }

    // Dragged all-day preview should also be fully opaque and match regular styling
    if (this.isDragged && this.event?.allDay) {
      return {
        height: `${DEFAULT_MONTH_EVENT_HEIGHT}px`,
        width: '100%',
        opacity: '1',
        padding: '4px',
        fontSize: '10px',
        backgroundColor: eventColor,
      };
    }

    const shouldEventHaveCustomHeight =
      [IMHCalendarViewType.WEEK, IMHCalendarViewType.DAY].includes(
        newMhCalendarStore.state.viewType
      ) && !this.event.allDay;

    if (shouldEventHaveCustomHeight) {
      return {
        height: this.calculateEventHeight(),
        maxHeight: this.calculateEventHeight(),
        position: 'relative',
        backgroundColor: eventColor,
      };
    }

    return {
      height: `${DEFAULT_MONTH_EVENT_HEIGHT}px`,
      width: '100%',
      opacity: this.event?.isHidden ? '0.1' : '1',
      padding: '4px',
      fontSize: '10px',
      backgroundColor: eventColor,
    };
  }

  private getCorrectEventUI() {
    if (!this.event || !newMhCalendarStore.state.viewType) return;

    if (
      [IMHCalendarViewType.DAY, IMHCalendarViewType.WEEK].includes(
        newMhCalendarStore.state.viewType
      ) &&
      !this.event.allDay
    ) {
      return <mh-calendar-event-full event={this.event} />;
    }

    return <mh-calendar-event-small event={this.event} />;
  }

  render() {
    return (
      <div
        onClick={(e) => this.onEventClick(e)}
        class="mhCalendarEvent"
        style={{
          ...this.getMHCalendarEventStyle(),
          ...newMhCalendarStore.getInlineStyleForClass('mhCalendarEvent'),
        }}
        draggable={true}
        onDragStart={(event) => {
          if (
            (!newMhCalendarStore.state.allowEventDragging &&
              !this.event?.draggingToggle) ||
            (newMhCalendarStore.state.allowEventDragging &&
              this.event?.draggingToggle)
          ) {
            event.preventDefault();
            return;
          }
          this.onDragStart(event);
        }}
        onTouchStart={(event) => {
          if (
            (!newMhCalendarStore.state.allowEventDragging &&
              !this.event?.draggingToggle) ||
            (newMhCalendarStore.state.allowEventDragging &&
              this.event?.draggingToggle)
          ) {
            event.preventDefault();
            return;
          }
          event.preventDefault();
          this.onDragStart(event);
        }}
        onDragEnd={this.onDragEnd}
        onTouchEnd={this.onDragEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          this.onRightEventClick(e);
        }}
      >
        {this.getCorrectEventUI()}
        {!this.event?.allDay && (
          <mh-calendar-resize-event-handler
            eventId={this.event?.id ?? ''}
            eventHeight={this.calculateEventHeight() ?? '0px'}
            eventEndDate={this.event?.endDate}
            eventStartDate={this.event?.startDate}
          />
        )}
      </div>
    );
  }
}
