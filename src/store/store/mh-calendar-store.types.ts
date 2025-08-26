import {
  MHCalendarEvents,
  IMHCalendarFullOptions,
  IMHCalendarDateRange,
} from '../../types';
import { EventBuilderMapByDate } from '../../utils/EventManager';

export enum MHCalendarReducerStoreActions {
  SET_CONFIG = 'SET_CONFIG',
  SET_DRAGGED_EVENT = 'SET_DRAGGED_EVENT',
  SHOW_EVENT = 'SHOW_EVENT',
  CHANGE_VIEW = 'CHANGE_VIEW',
  NEXT_DATE_RANGE = 'NEXT_DATE_RANGE',
  PREV_DATE_RANGE = 'PREV_DATE_RANGE',
  SET_TO_TODAY = 'SET_TO_TODAY',
  EVENT_DROP = 'EVENT_DROP',
}

export interface IMHCalendarAction<T = any> {
  type: MHCalendarReducerStoreActions;
  payload: T;
}

export interface IMHCalendarEvent {
  id: string;
  startDate: Date;
  endDate: Date;
  title?: string;
  allDay?: boolean;
  description?: string;
  isHidden?: boolean;

  draggingToggle?: boolean;

  // Allow user to pass any key to event.
  [key: string]: unknown;
}

export enum IMHCalendarViewType {
  DAY = 'DAY',
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  MULTI_DAY = 'MULTI_DAY',
}

export interface IMHCalendarState extends IMHCalendarFullOptions {
  calendarDateRange: IMHCalendarDateRange;
  reactiveEvents: EventBuilderMapByDate;
  draggedEvent: MHCalendarEvents | null;
  heightOfCalendarHour: number;
  heightOfCalendarDay?: number;

  // Values of css variables. Set also here for components
  // where style is set directly in tsx files
  properties: Record<string, string>;
}

export interface IMHCalendarStore {
  state: IMHCalendarState;
  daysInRange: number;
  hoursInDay: number;
  getEventById: (id: string) => MHCalendarEvents[];
  getEvents: () => MHCalendarEvents[];
}

export interface IMHCalendarReducer {
  reduce(state: IMHCalendarState, action: IMHCalendarAction): IMHCalendarState;
}

export enum UserErrors {
  DIRECT_STORE_SET = "State can't be set directly. Use dispatch method",
}

export interface IDateRange {
  fromDate: Date;
  toDate: Date;
}
