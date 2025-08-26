import { createStore } from '@stencil/store';
import { IMHCalendarState } from './store/mh-calendar-store.types';
import { initialState } from './store/mh-calendar-store.const';

export const stateManager = createStore<IMHCalendarState>(initialState);
const { state, onChange, reset, set, get } = stateManager;
export { state, onChange, reset, set, get };
