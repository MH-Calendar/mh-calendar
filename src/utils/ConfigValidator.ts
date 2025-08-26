import { IMHCalendarFullOptions } from '../types';

export enum ConfigErrorCodes {
  VIRTUAL_SCROLL_1 = 'Error [VIRTUAL_SCROLL_1] Both fixedHeight and virtualScrollHeight must be set for virtual scrolling to work.',
  SHOW_TIME_HOURS = 'Error [SHOW_TIME_HOURS] showTimeTo and showTimeFrom must be greater than 0',
  
  SLOT_TIME_HOURS = 'Error [SLOT_TIME_HOURS] Need to have correct shape'
}

type ValidationRule = {
  name: string;
  validate: (config: IMHCalendarFullOptions) => boolean;
  error: ConfigErrorCodes;
};

export class ConfigValidator {
  private rules: ValidationRule[];

  constructor(private config: IMHCalendarFullOptions) {
    this.rules = [
      {
        name: 'VIRTUAL_SCROLL',
        validate: ({ fixedHeight, virtualScrollHeight }) =>
          !( (!!virtualScrollHeight && !fixedHeight) || (!virtualScrollHeight && !!fixedHeight) ),
        error: ConfigErrorCodes.VIRTUAL_SCROLL_1
      },
      {
        name: 'SHOW_TIME_HOURS',
        validate: ({ showTimeFrom, showTimeTo }) =>
          showTimeFrom !== 0 && showTimeTo !== 0,
        error: ConfigErrorCodes.SHOW_TIME_HOURS
      },
      {
        name: 'SLOT_TIME_HOURS',
        validate: ({ slotInterval, hoursSlotInterval }) => {
          if (!slotInterval && !hoursSlotInterval) return true;

          if (typeof slotInterval === 'object' ) {
            return slotInterval.hasOwnProperty('hours') && slotInterval.hasOwnProperty('minutes')
          }

          if (typeof hoursSlotInterval === 'object' ) {
            return hoursSlotInterval.hasOwnProperty('hours') && hoursSlotInterval.hasOwnProperty('minutes')
          }

          return false;
        },
        error: ConfigErrorCodes.SLOT_TIME_HOURS
      }
    ];
  }

  public validateConfig(): boolean {
    for (const rule of this.rules) {
      if (!rule.validate(this.config)) {
        console.error(`Validation failed: ${rule.name}`);
        throw new Error(rule.error);
      }
    }
    return true;
  }
}
