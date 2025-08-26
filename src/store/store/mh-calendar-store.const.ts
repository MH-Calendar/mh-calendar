import { IMHCalendarConfigBaseStyle } from '../../types';
import { IMHCalendarState } from './mh-calendar-store.types';

export const DEFAULT_HOUR_HEIGHT = 50;
export const DEFAULT_ALL_EVENTS_HEADER_WIDTH = 100;

export const initialState: IMHCalendarState = {
  // Common with config
  showAllDayTasks: true,
  allDayEventsHeight: DEFAULT_ALL_EVENTS_HEADER_WIDTH,
  showTimeFrom: 10,
  showTimeTo: 24,
  viewType: undefined,
  style: {} as IMHCalendarConfigBaseStyle,
  fixedHeight: undefined,
  virtualScrollHeight: undefined,
  showDateSwitcher: true,
  showViewTypeSwitcher: true,
  showCalendarNavigation: true,
  makeAllDaysSticky: false,
  slotInterval: {
    hours: 1,
    minutes: 0,
  },
  hoursSlotInterval: {
    hours: 1,
    minutes: 0,
  },
  allowEventDragging: true,
  showViewHeader: true,
  hoursDisplayFormat: 'h A',

  // Set internally
  calendarDateRange: {
    fromDate: undefined,
    toDate: undefined,
  },
  reactiveEvents: new Map(),
  heightOfCalendarHour: DEFAULT_HOUR_HEIGHT,
  heightOfCalendarDay: undefined,
  draggedEvent: null,
  properties: {},

  // IMHCalendarCustomRenderConfig
  eventContent: undefined,

  // IMHCalendarConfigBaseUserActions
  onRightEventClick: undefined,
  onEventClick: undefined,
  onDayClick: undefined,
};
