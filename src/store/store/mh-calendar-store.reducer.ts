import { MHCalendarActions } from './mh-calendar-store.actions';
import {
  IMHCalendarAction,
  IMHCalendarReducer,
  IMHCalendarState,
  MHCalendarReducerStoreActions,
} from './mh-calendar-store.types';

export class MHCalendarReducer
  extends MHCalendarActions
  implements IMHCalendarReducer
{
  reduce(state: IMHCalendarState, action: IMHCalendarAction): IMHCalendarState {
    const { type, payload } = action;
    let newState = { ...state };
    switch (type) {
      case MHCalendarReducerStoreActions.SET_CONFIG:
        return this.setConfig(newState, payload);
      case MHCalendarReducerStoreActions.SHOW_EVENT:
        return this.showEvent(newState, payload);
      case MHCalendarReducerStoreActions.SET_DRAGGED_EVENT:
        return this.setDraggedEvent(newState, payload);
      case MHCalendarReducerStoreActions.CHANGE_VIEW:
        return this.changeView(newState, payload);
      case MHCalendarReducerStoreActions.NEXT_DATE_RANGE:
        return this.shiftDateRange(newState, {
          amount: 1,
        });
      case MHCalendarReducerStoreActions.PREV_DATE_RANGE:
        return this.shiftDateRange(newState, {
          amount: -1,
        });
      case MHCalendarReducerStoreActions.SET_TO_TODAY:
        return this.setDateToToday(newState);
      case MHCalendarReducerStoreActions.EVENT_DROP:
        return this.handleEventDrop(newState, payload);
      default:
        return state;
    }
  }
}
