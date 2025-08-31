// import newMhCalendarStore from './mh-calendar-store';
import {
  IMHCalendarState,
  IMHCalendarStore,
  UserErrors,
} from './mh-calendar-store.types';

const allowedKeys = ['calendarDateRange', 'viewType'] as const;
type AllowedKeys = (typeof allowedKeys)[number];
type PublicState = Pick<IMHCalendarState, AllowedKeys>;

const allowedGetters = [
  'daysInRange',
  'getEventById',
  'getEvents',
  'nextPeriod',
  'previousPeriod',
] as const;
type AllowedGetters = (typeof allowedGetters)[number];
type PublicGetters = Pick<IMHCalendarStore, AllowedGetters>;

type AllowedAPI = PublicGetters & PublicState;

export interface IMHCalendarStoreUserApi extends Readonly<AllowedAPI> {}

export function createUserAPI(
  store: IMHCalendarStore
): IMHCalendarStoreUserApi {
  const proxy = {} as Partial<IMHCalendarStoreUserApi>;

  // Proxy state fields
  for (const key of allowedKeys) {
    Object.defineProperty(proxy, key, {
      get: () => store.state[key],
      set: () => {
        console.error(UserErrors.DIRECT_STORE_SET);
      },
      enumerable: true,
    });
  }

  // Proxy methods or getter functions
  for (const key of allowedGetters) {
    Object.defineProperty(proxy, key, {
      get: () => {
        const value = store[key as keyof IMHCalendarStore];
        return typeof value === 'function'
          ? (value as Function).bind(store)
          : value;
      },
      enumerable: true,
    });
  }

  return proxy as IMHCalendarStoreUserApi;
}
