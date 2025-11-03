import { DEFAULT_MONTH_EVENT_HEIGHT } from '../defaults';

const DEFAULT_MAX_VISIBLE_EVENTS = 3;

export class MonthViewCalculator {
  /**
   * Calculates the maximum number of events that can fit in month view
   * based on available height in the day cell
   */
  static calculateMaxVisibleEvents(
    el: HTMLElement | null,
    showCurrentDate: boolean
  ): number {
    if (!el) {
      return DEFAULT_MAX_VISIBLE_EVENTS; // Default fallback
    }

    // Get the parent grid container to get the actual row height
    const gridContainer = el.closest('.mhCalendarMonth__days');
    if (!gridContainer) {
      // Fallback to element's height if grid not found
      const dayCellHeight = el.offsetHeight;
      if (dayCellHeight > 0) {
        return this.calculateFromElementHeight(
          dayCellHeight,
          el,
          showCurrentDate
        );
      }
      return DEFAULT_MAX_VISIBLE_EVENTS;
    }

    // Get computed height from grid row
    const rowHeight = gridContainer.getBoundingClientRect().height / 6; // 6 rows in month view

    if (rowHeight > 0) {
      return this.calculateFromElementHeight(rowHeight, el, showCurrentDate);
    }

    return DEFAULT_MAX_VISIBLE_EVENTS;
  }

  private static calculateFromElementHeight(
    dayCellHeight: number,
    el: HTMLElement,
    showCurrentDate: boolean
  ): number {
    if (!el || dayCellHeight <= 0) {
      return DEFAULT_MAX_VISIBLE_EVENTS;
    }

    // Calculate actual height reserved for date display (if shown)
    let dateHeight = 0;
    if (showCurrentDate) {
      const dateElement = el.querySelector(
        '.mhCalendarDay_dayDate'
      ) as HTMLElement;
      if (dateElement) {
        const dateRect = dateElement.getBoundingClientRect();
        dateHeight = dateRect.height;
      } else {
        // Fallback to approximate height if element not found yet
        dateHeight = 40;
      }
    }

    // Reserve some padding/margin space
    const padding = 4;
    const availableHeight = dayCellHeight - dateHeight - padding;

    // Each event takes DEFAULT_MONTH_EVENT_HEIGHT (20px)
    const eventHeight = DEFAULT_MONTH_EVENT_HEIGHT;

    // Calculate how many events can fit
    // Subtract 1 to reserve space for "more events" indicator if needed
    const maxEvents = Math.max(
      1,
      Math.floor(availableHeight / eventHeight) - 1
    );

    // Ensure at least 1 event can be shown, but don't allow too many
    return Math.max(1, Math.min(maxEvents, 10));
  }
}
