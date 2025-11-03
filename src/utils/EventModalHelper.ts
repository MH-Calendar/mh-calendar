import dayjs from 'dayjs';
import { MHCalendarEvents } from '../types';
import newMhCalendarStore from '../store/store/mh-calendar-store';
import { EventManager } from './EventManager';

export class EventModalHelper {
  /**
   * Creates modal content for event creation/editing
   */
  static createEventModalContent(
    event: MHCalendarEvents,
    isNewEvent: boolean = false,
    onSave: (updatedEvent: MHCalendarEvents) => void,
    onCancel: () => void
  ): HTMLElement {
    const container = document.createElement('div');
    container.className = 'mhCalendarEventModal';
    container.innerHTML = `
      <div class="mhCalendarEventModal__header">
        <h3>${isNewEvent ? 'New Event' : 'Edit Event'}</h3>
      </div>
      <div class="mhCalendarEventModal__body">
        <div class="mhCalendarEventModal__field">
          <label>Title:</label>
          <input 
            type="text" 
            id="event-title" 
            value="${event.title || ''}" 
            placeholder="Enter title"
          />
        </div>
        <div class="mhCalendarEventModal__field">
          <label>Description:</label>
          <textarea 
            id="event-description" 
            placeholder="Enter description (optional)"
            rows="3"
          >${event.description || ''}</textarea>
        </div>
        <div class="mhCalendarEventModal__field">
          <label>Date and Time:</label>
          <div class="mhCalendarEventModal__datetime">
            <div>
              <label style="font-size: 12px;">From:</label>
              <input 
                type="datetime-local" 
                id="event-start" 
                value="${this.formatDateTimeLocal(event.startDate)}"
              />
            </div>
            <div>
              <label style="font-size: 12px;">To:</label>
              <input 
                type="datetime-local" 
                id="event-end" 
                value="${this.formatDateTimeLocal(event.endDate)}"
              />
            </div>
          </div>
        </div>
        <div class="mhCalendarEventModal__field">
          <label>
            <input 
              type="checkbox" 
              id="event-allDay" 
              ${event.allDay ? 'checked' : ''}
            />
            All Day
          </label>
        </div>
      </div>
      <div class="mhCalendarEventModal__footer">
        <button id="event-modal-cancel" class="mhCalendarEventModal__button mhCalendarEventModal__button--cancel">
          Cancel
        </button>
        <button id="event-modal-save" class="mhCalendarEventModal__button mhCalendarEventModal__button--save">
          Save
        </button>
      </div>
    `;

    // Add event listeners
    const saveButton = container.querySelector('#event-modal-save');
    const cancelButton = container.querySelector('#event-modal-cancel');

    (saveButton as HTMLElement)?.addEventListener('click', () => {
      const titleInput = container.querySelector(
        '#event-title'
      ) as HTMLInputElement;
      const descriptionInput = container.querySelector(
        '#event-description'
      ) as HTMLTextAreaElement;
      const startInput = container.querySelector(
        '#event-start'
      ) as HTMLInputElement;
      const endInput = container.querySelector(
        '#event-end'
      ) as HTMLInputElement;
      const allDayInput = container.querySelector(
        '#event-allDay'
      ) as HTMLInputElement;

      const updatedEvent: MHCalendarEvents = {
        ...event,
        title: titleInput?.value || 'New Event',
        description: descriptionInput?.value || undefined,
        allDay: allDayInput?.checked || false,
        startDate: new Date(startInput.value),
        endDate: new Date(endInput.value),
      };

      // Automatically add/update event in reactiveEvents
      const reactiveEvents = newMhCalendarStore.state.reactiveEvents;

      if (isNewEvent) {
        // Add new event to reactiveEvents
        EventManager.addEvent(reactiveEvents, updatedEvent);
      } else {
        // Update existing event in reactiveEvents
        EventManager.updateEvent(reactiveEvents, event.id, updatedEvent);
      }

      // Trigger reactivity update by creating new Map reference
      newMhCalendarStore.state.reactiveEvents = new Map(reactiveEvents);

      // Call user callback with the event (user can do whatever they want with it)
      onSave(updatedEvent);
      newMhCalendarStore.closeModal();
    });

    cancelButton?.addEventListener('click', () => {
      onCancel();
      newMhCalendarStore.closeModal();
    });

    // Handle Enter key in title input
    const titleInput = container.querySelector(
      '#event-title'
    ) as HTMLInputElement;
    titleInput?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        (saveButton as HTMLElement)?.click();
      }
    });

    return container;
  }

  /**
   * Formats a Date object to datetime-local input format
   */
  private static formatDateTimeLocal(date: Date): string {
    const d = dayjs(date);
    return d.format('YYYY-MM-DDTHH:mm');
  }
}
