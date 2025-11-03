import { ObservableMap } from '@stencil/store';
import { MHCalendarReducer } from './mh-calendar-store.reducer';
import {
  IMHCalendarAction,
  IMHCalendarReducer,
  IMHCalendarState,
  IMHCalendarStore,
  MHCalendarReducerStoreActions,
  UserErrors,
} from './mh-calendar-store.types';
import { stateManager } from '../store';
import dayjs from 'dayjs';
import { MHCalendarEvents } from '../../types';
import { DaysGenerator } from '../../utils/DaysGenerator';
export class MHCalendarStore implements IMHCalendarStore {
  constructor(
    private reducer: IMHCalendarReducer,
    private stateManager: ObservableMap<IMHCalendarState>
  ) {}

  /**
   * Opens the global modal with specified content and position
   * @param content - The content to display in the modal (can be string, JSX, or HTMLElement)
   * @param position - Optional position configuration (x/y coordinates, relative to element, or rect)
   * @example
   * // Center of screen
   * store.openModal(<div>Hello</div>);
   *
   * // At specific coordinates
   * store.openModal(<div>Hello</div>, { x: 100, y: 200 });
   *
   * // Relative to an element
   * store.openModal(<div>Hello</div>, { element: buttonElement, alignment: 'bottom' });
   *
   * // Using rect coordinates
   * const rect = element.getBoundingClientRect();
   * store.openModal(<div>Hello</div>, { rect, alignment: 'top' });
   */
  public openModal(
    content: any,
    position?: {
      x?: number;
      y?: number;
      element?: HTMLElement;
      alignment?: 'top' | 'bottom' | 'left' | 'right' | 'center';
      rect?: { top: number; left: number; width: number; height: number };
    }
  ): void {
    this.dispatch({
      type: MHCalendarReducerStoreActions.OPEN_MODAL,
      payload: { content, position },
    });
  }

  /**
   * Closes the global modal
   */
  public closeModal(): void {
    this.dispatch({
      type: MHCalendarReducerStoreActions.CLOSE_MODAL,
      payload: {},
    });
  }

  private isReducerSet() {
    if (!this.reducer) throw new Error("Reducer wasn't passed to constructor.");
  }

  /**
   * Pass stencil store action.
   */
  public get state(): IMHCalendarState {
    return this.stateManager.state;
  }

  public set state(_: unknown) {
    console.error(UserErrors.DIRECT_STORE_SET);
  }

  public onChange(type: keyof IMHCalendarState, action: (value: any) => void) {
    this.stateManager.onChange(type, action);
  }

  // public reset = this.stateManager.reset;
  public get(key: keyof IMHCalendarState) {
    this.stateManager.get(key);
  }

  public dispatch(action: IMHCalendarAction): void {
    try {
      this.isReducerSet();

      const currentState = this.stateManager.state;
      const newState = this.reducer.reduce(currentState, action);

      if (!newState) {
        console.error(`Reducer returned ${newState} for action:`, action);
        return;
      }

      Object.assign(this.stateManager.state, newState);

      return;
    } catch (error) {
      console.error('Error during state reduction:', error);
    }
  }

  // ###### Dynamic getters #######

  public get daysInRange() {
    // For WEEK/DAY views, use filtered days to account for hiddenDays
    if (this.state.viewType === 'WEEK' || this.state.viewType === 'DAY') {
      const visibleDays = DaysGenerator.getDatesForMultiView();
      return visibleDays.length;
    }

    // For other views, calculate normally
    const start = dayjs(this.state.calendarDateRange.fromDate);
    const end = dayjs(this.state.calendarDateRange.toDate);

    if (start.isAfter(end, 'day')) return 0;
    return end.diff(start, 'day') + 1;
  }

  public get hoursInDay() {
    if (!this.state.slotInterval || !this.state.hoursSlotInterval) return 0;

    const slotDivider =
      (this.state.slotInterval.hours * 60 + this.state.slotInterval.minutes) /
      60;
    return this.hoursRangeCal / slotDivider;
  }

  public get hoursRangeCal() {
    if (
      typeof this.state.showTimeTo !== 'number' ||
      typeof this.state.showTimeFrom !== 'number'
    )
      return 0;
    return this.state.showTimeTo - this.state.showTimeFrom;
  }

  public get headerMargin() {
    return (
      (this.state.showAllDayTasks ? this.state.allDayEventsHeight : 0) ?? 0
    );
  }

  public getEventById(id: string): MHCalendarEvents[] {
    const result: MHCalendarEvents[] = [];

    for (const eventMapById of this.state.reactiveEvents.values()) {
      if (eventMapById.has(id)) {
        result.push(eventMapById.get(id)!);
      }
    }

    return result;
  }

  public getEvents(): MHCalendarEvents[] {
    const allEvents: MHCalendarEvents[] = [];

    for (const eventMapById of this.state.reactiveEvents.values()) {
      for (const event of eventMapById.values()) {
        allEvents.push(event);
      }
    }

    return allEvents;
  }

  public getInlineStyleForClass(className: string) {
    return (
      this?.state?.style?.[className as keyof typeof this.state.style] || {}
    );
  }

  // for now for user api

  public nextPeriod() {
    this.dispatch({
      type: MHCalendarReducerStoreActions.NEXT_DATE_RANGE,
      payload: {},
    });
  }

  public previousPeriod() {
    this.dispatch({
      type: MHCalendarReducerStoreActions.PREV_DATE_RANGE,
      payload: {},
    });
  }
}

const mhCalendarReducer = new MHCalendarReducer();
const newMhCalendarStore = new MHCalendarStore(mhCalendarReducer, stateManager);

export default newMhCalendarStore;
