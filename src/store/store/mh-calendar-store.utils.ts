import { DEFAULT_THEME } from '../../const/default-theme';
import { MHCalendarEvents, IMHCalendarConfigBaseStyle } from '../../types';
import { IDateRange, IMHCalendarViewType } from './mh-calendar-store.types';

type StylesWithoutProperties = Omit<IMHCalendarConfigBaseStyle, 'properties'>;
export class MHCalendarStoreUtils {
  protected mergeStyles(
    userStyles: Partial<StylesWithoutProperties>
  ): Partial<IMHCalendarConfigBaseStyle> {
    const mergedStyles: Partial<IMHCalendarConfigBaseStyle> = {
      ...DEFAULT_THEME,
    };

    (Object.keys(userStyles) as (keyof StylesWithoutProperties)[]).forEach(
      (key) => {
        mergedStyles[key] = {
          ...userStyles[key],
          ...mergedStyles[key],
        };
      }
    );

    return mergedStyles;
  }

  protected calculateEventDuration(event: MHCalendarEvents): number {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    const startTimeInMs = startDate.getTime();
    const endTimeInMs = endDate.getTime();

    const differenceInMs = endTimeInMs - startTimeInMs;

    const differenceInMinutes = differenceInMs / (1000 * 60);

    return differenceInMinutes;
  }

  /**
   * Based on start date, function return correct dates
   * for week view. If user start date is wednesday then
   * it will return monday before and sunday after.
   *
   * Func always return monday and sunday.
   */
  protected getDatesForWeekView(startDate: Date | string): IDateRange {
    const fromDate = (() => {
      const today = new Date(startDate);
      const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
      const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Calculate difference to nearest Monday
      const nearestMonday = new Date(today);
      nearestMonday.setDate(today.getDate() + diffToMonday);
      return nearestMonday;
    })();

    const toDate = (() => {
      const toDate = new Date(fromDate);
      toDate.setDate(fromDate.getDate() + 6);
      return toDate;
    })();
    return { fromDate, toDate };
  }

  protected updateDateRangeForViewType(
    viewType: IMHCalendarViewType,
    fromDate: Date
  ): IDateRange {
    switch (viewType) {
      case IMHCalendarViewType.MONTH:
        const year = fromDate.getFullYear();
        const month = fromDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        return {
          fromDate: firstDayOfMonth,
          toDate: lastDayOfMonth,
        };

      case IMHCalendarViewType.WEEK:
        const { fromDate: weekFrom, toDate: weekTo } =
          this.getDatesForWeekView(fromDate);
        return { fromDate: weekFrom, toDate: weekTo };

      case IMHCalendarViewType.DAY:
      case IMHCalendarViewType.MULTI_DAY:
      default:
        // For day view, set both dates to the same day
        return { fromDate, toDate: fromDate };
    }
  }

  protected shiftCalendar(
    by: IMHCalendarViewType,
    fromDate: Date,
    amount: number = 1
  ): IDateRange {
    let newFromDate = fromDate;

    switch (by) {
      case IMHCalendarViewType.DAY:
        newFromDate.setDate(newFromDate.getDate() + amount);
        break;
      case IMHCalendarViewType.WEEK:
        newFromDate.setDate(newFromDate.getDate() + 7 * amount);
        break;
      case IMHCalendarViewType.MONTH:
        newFromDate.setMonth(newFromDate.getMonth() + amount);
        break;
      case IMHCalendarViewType.MULTI_DAY:
        newFromDate.setDate(newFromDate.getDate() + amount);
      default:
        throw new Error(`Unsupported unit: ${by}`);
    }

    return this.updateDateRangeForViewType(by, newFromDate);
  }
}
