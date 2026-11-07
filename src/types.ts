export type WeekStart = "monday" | "sunday";

/** KST is a fixed UTC+09:00 offset. local uses the host's time zone. */
export type TimeZone = "UTC" | "KST" | "local";

export interface DateOptions {
  /** Defaults to UTC, independently of the host's time zone. */
  timeZone?: TimeZone;
}

export interface WeekStartOptions {
  /** Defaults to monday. */
  weekStart?: WeekStart;
}

export interface WeekOptions extends DateOptions, WeekStartOptions {}

export interface ISOWeekRangeOptions extends DateOptions {
  /** Allow week 53 in a 52-week year. Defaults to false. */
  allowOverflow?: boolean;
}

export interface MonthWeekRangeOptions extends WeekOptions {
  /** Allow week numbers up to 6 even when absent from the month. Defaults to false. */
  allowOverflow?: boolean;
}

export interface ISOWeekInfo {
  year: number;
  week: number;
}

export interface WeekRange {
  start: Date;
  /** Beginning of the last calendar day, not the end of that day. */
  end: Date;
}

export interface WeekInterval {
  start: Date;
  /** Beginning of the next week. Compare start <= date && date < endExclusive. */
  endExclusive: Date;
}

export interface MonthWeek extends WeekRange, WeekInterval {
  week: number;
}
