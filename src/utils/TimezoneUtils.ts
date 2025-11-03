import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Load dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export class TimezoneUtils {
  /**
   * Formats time for a specific timezone
   * @param hour - Hour in main timezone (0-23)
   * @param minute - Minute (0-59)
   * @param mainTimezone - Main timezone (for reference date)
   * @param targetTimezone - Target timezone to convert to
   * @param format - Display format (default: 'h A')
   * @returns Formatted time string
   */
  static formatTimeInTimezone(
    hour: number,
    minute: number,
    mainTimezone: string,
    targetTimezone: string,
    format: string = 'h A',
    referenceDate?: Date
  ): string {
    if (!targetTimezone) return '';

    try {
      // Use reference date if provided, otherwise use current date
      const baseDate = referenceDate || new Date();
      const dateString = dayjs(baseDate).format('YYYY-MM-DD');

      // Create a date in the main timezone
      const dateInMain = dayjs.tz(
        `${dateString} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`,
        mainTimezone
      );

      // Convert to target timezone
      const dateInTarget = dateInMain.tz(targetTimezone);

      return dateInTarget.format(format);
    } catch (error) {
      console.warn(`Invalid timezone: ${targetTimezone}`, error);
      return '';
    }
  }

  /**
   * Gets timezone abbreviation or short name
   * @param timezone - IANA timezone string
   * @returns Short timezone identifier (e.g., 'CET', 'BRT')
   */
  static getTimezoneAbbreviation(timezone: string): string {
    if (!timezone) return '';

    try {
      const now = dayjs().tz(timezone);
      // Use Intl to get timezone abbreviation
      const formatter = new Intl.DateTimeFormat('en', {
        timeZone: timezone,
        timeZoneName: 'short',
      });

      const parts = formatter.formatToParts(now.toDate());
      const tzName = parts.find((part) => part.type === 'timeZoneName');

      if (tzName) {
        return tzName.value;
      }

      // Fallback: try to extract from dayjs
      return now.format('z');
    } catch (error) {
      console.warn(
        `Could not get abbreviation for timezone: ${timezone}`,
        error
      );
      // Fallback: return first part of timezone string
      return timezone.split('/').pop()?.substring(0, 3).toUpperCase() || '';
    }
  }

  /**
   * Gets timezone offset in hours from UTC
   * @param timezone - IANA timezone string
   * @returns Offset in hours (e.g., 1, -3)
   */
  static getTimezoneOffset(timezone: string): number {
    if (!timezone) return 0;

    try {
      const now = dayjs().tz(timezone);
      return now.utcOffset() / 60; // Convert minutes to hours
    } catch (error) {
      console.warn(`Could not get offset for timezone: ${timezone}`, error);
      return 0;
    }
  }

  /**
   * Validates timezone array
   * @param timezones - Array of timezone strings
   * @returns Validated array (max 3, filtered invalid)
   */
  static validateTimezones(timezones?: string[]): string[] {
    if (!timezones || !Array.isArray(timezones)) return [];

    // Limit to max 3
    const limited = timezones.slice(0, 3);

    // Validate each timezone
    return limited.filter((tz) => {
      if (!tz || typeof tz !== 'string') return false;
      try {
        dayjs().tz(tz);
        return true;
      } catch {
        return false;
      }
    });
  }

  /**
   * Gets main timezone (first in array) or browser default
   * @param timezones - Array of timezone strings
   * @returns Main timezone string
   */
  static getMainTimezone(timezones?: string[]): string {
    if (timezones && timezones.length > 0) {
      return timezones[0];
    }

    // Fallback to browser timezone
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
}
