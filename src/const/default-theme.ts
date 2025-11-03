export const DEFAULT_THEME_COLOR = '#00b536';
export const CURRENT_TIME_LINE_COLOR = '#db372d';
export const BORDERS_COLOR = '#eaeaeaff';

export const VIEW_HEADER_HEIGHT = '70px';
export const VIEW_HEIGHT = `calc(100% - ${VIEW_HEADER_HEIGHT})`;

export const NAVIGATION_HEIGHT = '20%';
export const CALENDAR_HEIGHT = `calc(100% - ${NAVIGATION_HEIGHT})`;

export const TIME_HOLDER_WIDTH = '70px';

export const DEFAULT_THEME = {
  properties: {
    timeSlotWidth: TIME_HOLDER_WIDTH,
    bordersColor: BORDERS_COLOR,
    eventBackgroundColor: DEFAULT_THEME_COLOR,
    eventResizeHandleColor: DEFAULT_THEME_COLOR,
    eventTimeLabelBg: '#fff',
    eventTimeLabelColor: '#222',
    eventTimeDiffColor: '#3578fa',
    nonBusinessHoursOverlayColor: 'rgba(0, 0, 0, 0.03)',
    headerTodayBackgroundColor: DEFAULT_THEME_COLOR,
    currentTimeColor: CURRENT_TIME_LINE_COLOR,

    // TLDR: 'View' is what is underneath the navigation. TODO: explain this in documentation
    viewHeaderHeight: VIEW_HEADER_HEIGHT,
    viewHeight: VIEW_HEIGHT,

    calendarNavigationHeight: NAVIGATION_HEIGHT,
    // Combined height of view header and view itself
    calendarViewHolderHeight: CALENDAR_HEIGHT,
  },
};
