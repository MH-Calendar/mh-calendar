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
  EVENT_RESIZE = 'EVENT_RESIZE',
  OPEN_MODAL = 'OPEN_MODAL',
  CLOSE_MODAL = 'CLOSE_MODAL',
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
  color?: string; // Individual event color (e.g., '#3b82f6', 'rgb(59, 130, 246)', etc.)

  draggingToggle?: boolean;

  // Allow user to pass any key to event.
  [key: string]: unknown;
}

export enum IMHCalendarViewType {
  DAY = 'DAY',
  MONTH = 'MONTH',
  WEEK = 'WEEK',
  MULTI_DAY = 'MULTI_DAY',
  AGENDA = 'AGENDA',
}

export interface IModalState {
  isOpen: boolean;
  content?: any;
  position?: {
    x?: number;
    y?: number;
    element?: HTMLElement;
    alignment?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    rect?: { top: number; left: number; width: number; height: number };
  };
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

  // Modal state
  modal?: IModalState;
}

export interface IMHCalendarStore {
  state: IMHCalendarState;
  daysInRange: number;
  hoursInDay: number;
  getEventById: (id: string) => MHCalendarEvents[];
  getEvents: () => MHCalendarEvents[];
  nextPeriod: () => void;
  previousPeriod: () => void;
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
