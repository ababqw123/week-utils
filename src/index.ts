import {
  DAY_MS, addDays, assertInteger, calendarDay, firstOfMonth, parseDay,
  resolveOverflow, resolveTimeZone, resolveWeekOptions, resolveWeekStart,
  toInstant, weekStartDay,
} from "./calendar";
import type {
  DateOptions, ISOWeekInfo, ISOWeekRangeOptions, MonthWeek, MonthWeekRangeOptions,
  TimeZone, WeekInterval, WeekOptions, WeekRange, WeekStart, WeekStartOptions,
} from "./types";

export type {
  DateOptions, ISOWeekInfo, ISOWeekRangeOptions, MonthWeek, MonthWeekRangeOptions,
  TimeZone, WeekInterval, WeekOptions, WeekRange, WeekStart, WeekStartOptions,
} from "./types";

function monthWeekCount(first: Date, weekStart: WeekStart): number {
  const last = calendarDay(first.getUTCFullYear(), first.getUTCMonth() + 1, 0);
  return Math.floor((last.getTime() - weekStartDay(first, weekStart).getTime()) / DAY_MS / 7) + 1;
}

function rangeFromStart(startDay: Date, timeZone: TimeZone): WeekRange {
  return { start: toInstant(startDay, timeZone), end: toInstant(addDays(startDay, 6), timeZone) };
}

function isoInfo(day: Date): ISOWeekInfo {
  const thursday = addDays(day, 4 - (day.getUTCDay() || 7));
  const year = thursday.getUTCFullYear();
  const january1 = calendarDay(year, 0, 1);
  const week = Math.ceil(((thursday.getTime() - january1.getTime()) / DAY_MS + 1) / 7);
  return { year, week };
}

/** Month week number. Week 1 contains the first day of the month. Defaults to UTC/Monday. */
export function getMonthWeek(dateInput: Date | string, options: WeekStart | WeekOptions = {}): number {
  const { timeZone, weekStart } = resolveWeekOptions(options);
  const day = parseDay(dateInput, timeZone);
  const first = calendarDay(day.getUTCFullYear(), day.getUTCMonth(), 1);
  return Math.floor((day.getTime() - weekStartDay(first, weekStart).getTime()) / DAY_MS / 7) + 1;
}

/** Number of calendar rows (4–6) in a month. Numeric calendar inputs do not need a time zone. */
export function getWeeksInMonth(year: number, month: number, options: WeekStart | WeekStartOptions = {}): number {
  return monthWeekCount(firstOfMonth(year, month), resolveWeekStart(options));
}

/** Month week boundaries at the beginning of the first and last day in the selected zone. */
export function getMonthWeekRange(
  year: number,
  month: number,
  weekNumber: number,
  options: WeekStart | MonthWeekRangeOptions = {},
): WeekRange {
  const { timeZone, weekStart } = resolveWeekOptions(options);
  const allowOverflow = resolveOverflow(options);
  const first = firstOfMonth(year, month);
  assertInteger(weekNumber, "weekNumber");
  const maximum = allowOverflow ? 6 : monthWeekCount(first, weekStart);
  if (weekNumber < 1 || weekNumber > maximum) throw new RangeError(`weekNumber must be 1~${maximum}`);
  return rangeFromStart(addDays(weekStartDay(first, weekStart), (weekNumber - 1) * 7), timeZone);
}

/** All weeks touching a month, including neighboring-month days and an exclusive end. */
export function getMonthWeeks(year: number, month: number, options: WeekStart | WeekOptions = {}): MonthWeek[] {
  const { timeZone, weekStart } = resolveWeekOptions(options);
  const first = firstOfMonth(year, month);
  const count = monthWeekCount(first, weekStart);
  const firstStart = weekStartDay(first, weekStart);
  return Array.from({ length: count }, (_, index) => {
    const startDay = addDays(firstStart, index * 7);
    return {
      week: index + 1,
      ...rangeFromStart(startDay, timeZone),
      endExclusive: toInstant(addDays(startDay, 7), timeZone),
    };
  });
}

/** ISO week-year and week number together, calculated in UTC by default. */
export function getISOWeekInfo(dateInput: Date | string, options: DateOptions = {}): ISOWeekInfo {
  return isoInfo(parseDay(dateInput, resolveTimeZone(options)));
}

/** ISO week-year, which may differ from the calendar year near New Year. */
export function getISOWeekYear(dateInput: Date | string, options: DateOptions = {}): number {
  return getISOWeekInfo(dateInput, options).year;
}

/** ISO week number (1–52/53), calculated in UTC by default. */
export function getISOWeek(dateInput: Date | string, options: DateOptions = {}): number {
  return getISOWeekInfo(dateInput, options).week;
}

/** Number of weeks (52 or 53) belonging to an ISO week-year. */
export function getISOWeeksInYear(isoYear: number): number {
  assertInteger(isoYear, "isoYear");
  const january1 = calendarDay(isoYear, 0, 1);
  const weekday = january1.getUTCDay();
  const leap = isoYear % 4 === 0 && (isoYear % 100 !== 0 || isoYear % 400 === 0);
  return weekday === 4 || (weekday === 3 && leap) ? 53 : 52;
}

/** Monday through Sunday boundaries in the selected zone; nonexistent weeks are rejected. */
export function getISOWeekRange(isoYear: number, isoWeek: number, options: ISOWeekRangeOptions = {}): WeekRange {
  const timeZone = resolveTimeZone(options);
  const allowOverflow = resolveOverflow(options);
  assertInteger(isoYear, "isoYear");
  assertInteger(isoWeek, "isoWeek");
  const maximum = allowOverflow ? 53 : getISOWeeksInYear(isoYear);
  if (isoWeek < 1 || isoWeek > maximum) throw new RangeError(`isoWeek must be 1~${maximum}`);
  const firstMonday = weekStartDay(calendarDay(isoYear, 0, 4), "monday");
  return rangeFromStart(addDays(firstMonday, (isoWeek - 1) * 7), timeZone);
}

/** Whole-week interval: start inclusive, next week's start exclusive. */
export function getWeekInterval(dateInput: Date | string, options: WeekStart | WeekOptions = {}): WeekInterval {
  const { timeZone, weekStart } = resolveWeekOptions(options);
  const startDay = weekStartDay(parseDay(dateInput, timeZone), weekStart);
  return { start: toInstant(startDay, timeZone), endExclusive: toInstant(addDays(startDay, 7), timeZone) };
}

/** Compare calendar weeks across month/year boundaries, using one shared time zone. */
export function isSameWeek(a: Date | string, b: Date | string, options: WeekStart | WeekOptions = {}): boolean {
  const { timeZone, weekStart } = resolveWeekOptions(options);
  return weekStartDay(parseDay(a, timeZone), weekStart).getTime() === weekStartDay(parseDay(b, timeZone), weekStart).getTime();
}
