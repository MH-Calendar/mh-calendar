import { IMHCalendarViewType } from '../store/store/mh-calendar-store.types';
import {
  IMHCalendarConfigBaseUserActions,
  IMHCalendarConfigBase,
  IMHCalendarWeekConfig,
} from '../types';
import { DEFAULT_THEME } from './default-theme';

export const base64Svg =
  'PHN2ZyBzdHlsZT0icG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtsZWZ0OjUwJTtwb2ludGVyLWV2ZW50czpub25lO3otaW5kZXg6LTE7IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8dGV4dCB4PSIwIiB5PSIxNSIgZmlsbD0iZ3JheSIgZm9udC1zaXplPSIxMCIgb3BhY2l0eT0iMC4zIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPgpQb3dlcmVkIGJ5IE1ILUNhbGVuZGFyIM6gIGxpY2Vuc2UgcmVxdWlyZWQgZm9yIGNvbW1lcmNpYWwgdXNlLgo8L3RleHQ';

export const DEF_USER_ACTIONS: Partial<IMHCalendarConfigBaseUserActions> = {
  onEventClick: undefined,
  onRightEventClick: undefined,

  onDayClick: undefined,
  onRightDayClick: undefined,

  /** To implement */

  // onDateChange: undefined,
  // onViewTypeChange: undefined,
};

export const DEFAULT_CALENDAR_CONFIG: IMHCalendarConfigBase = {
  style: DEFAULT_THEME,
  viewType: IMHCalendarViewType.MONTH,
  eventContent: undefined,
  showDateSwitcher: true,
  showViewTypeSwitcher: true,
  showCalendarNavigation: true,
  allowEventDragging: true,
  showViewHeader: true,
  ...DEF_USER_ACTIONS,
};

export const DEFAULT_WEEK_VIEW_CONFIG: IMHCalendarWeekConfig = {
  ...DEFAULT_CALENDAR_CONFIG,
  showTimeFrom: 9,
  showTimeTo: 22,
  startDate: new Date(),
  showWeekends: true,
  customWeekView: false,
  showAllDayTasks: true,
  allDayEventsHeight: 100,
  makeAllDaysSticky: false,
  slotInterval: {
    hours: 1,
    minutes: 0,
  },
  hoursSlotInterval: {
    hours: 1,
    minutes: 0,
  },
  hoursDisplayFormat: 'h A',
};
