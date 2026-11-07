import type { DateOptions, TimeZone, WeekOptions, WeekStart, WeekStartOptions } from "./types";

export const DAY_MS = 86_400_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function validDate(date: Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date or date outside the supported range");
  }
  return date;
}

export function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) throw new RangeError(`${name} must be a finite integer`);
}

function assertOptions(options: object): void {
  if (options === null || typeof options !== "object" || Array.isArray(options)) {
    throw new TypeError("options must be an object");
  }
}

export function resolveTimeZone(options: DateOptions = {}): TimeZone {
  assertOptions(options);
  const timeZone = options.timeZone === undefined ? "UTC" : options.timeZone;
  if (timeZone !== "UTC" && timeZone !== "KST" && timeZone !== "local") {
    throw new TypeError('timeZone must be "UTC", "KST", or "local"');
  }
  return timeZone;
}

export function resolveWeekStart(options: WeekStart | WeekStartOptions = {}): WeekStart {
  if (typeof options !== "string") assertOptions(options);
  const value = typeof options === "string" ? options : options.weekStart;
  const weekStart = value === undefined ? "monday" : value;
  if (weekStart !== "monday" && weekStart !== "sunday") {
    throw new TypeError('weekStart must be "monday" or "sunday"');
  }
  return weekStart;
}

export function resolveWeekOptions(options: WeekStart | WeekOptions = {}): Required<WeekOptions> {
  return {
    weekStart: resolveWeekStart(options),
    timeZone: resolveTimeZone(typeof options === "string" ? {} : options),
  };
}

export function resolveOverflow(options: { allowOverflow?: boolean } | WeekStart): boolean {
  const value = typeof options === "string" ? undefined : options.allowOverflow;
  if (value !== undefined && typeof value !== "boolean") {
    throw new TypeError("allowOverflow must be a boolean");
  }
  return value === true;
}

// Internal calendar days use UTC fields only. They are not zoned instants.
export function calendarDay(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  return validDate(date);
}

export function addDays(day: Date, amount: number): Date {
  const result = new Date(day.getTime());
  result.setUTCDate(result.getUTCDate() + amount);
  return validDate(result);
}

export function firstOfMonth(year: number, month: number): Date {
  assertInteger(year, "year");
  assertInteger(month, "month");
  if (month < 1 || month > 12) throw new RangeError("month must be 1~12");
  return calendarDay(year, month - 1, 1);
}

export function weekStartDay(day: Date, weekStart: WeekStart): Date {
  const offset = (day.getUTCDay() - (weekStart === "monday" ? 1 : 0) + 7) % 7;
  return addDays(day, -offset);
}

export function toInstant(day: Date, timeZone: TimeZone): Date {
  if (timeZone !== "local") {
    return validDate(new Date(day.getTime() - (timeZone === "KST" ? KST_OFFSET_MS : 0)));
  }
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  validDate(date);
  assertLocalDay(date, day);
  return date;
}

function assertLocalDay(date: Date, day: Date): void {
  if (date.getFullYear() !== day.getUTCFullYear() || date.getMonth() !== day.getUTCMonth() || date.getDate() !== day.getUTCDate()) {
    throw new RangeError("Date does not exist in the local time zone");
  }
}

function fromInstant(date: Date, timeZone: TimeZone): Date {
  validDate(date);
  if (timeZone === "local") {
    return calendarDay(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const shifted = validDate(new Date(date.getTime() + (timeZone === "KST" ? KST_OFFSET_MS : 0)));
  return calendarDay(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
}

// A deliberately small ISO grammar avoids host-dependent Date.parse fallbacks.
const ISO_INPUT = /^(\d{4}|[+-]\d{6})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})?)?$/;

function parseString(input: string, timeZone: TimeZone): Date {
  const match = ISO_INPUT.exec(input);
  if (!match || match[0] !== input || match[1] === "-000000") {
    throw new RangeError("Invalid date: use an ISO date or datetime");
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction, offset] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const dayNumber = Number(dayText);
  const day = calendarDay(year, month - 1, dayNumber);
  if (day.getUTCFullYear() !== year || day.getUTCMonth() !== month - 1 || day.getUTCDate() !== dayNumber) {
    throw new RangeError("Invalid date: calendar day does not exist");
  }
  if (hourText === undefined) {
    toInstant(day, timeZone);
    return day;
  }
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText ?? 0);
  const millisecond = Number((fraction ?? "").padEnd(3, "0"));
  if (hour > 23 || minute > 59 || second > 59) throw new RangeError("Invalid date: time is out of range");
  const clockMs = ((hour * 60 + minute) * 60 + second) * 1000 + millisecond;
  if (offset !== undefined) {
    let offsetMs = 0;
    if (offset !== "Z") {
      const offsetHour = Number(offset.slice(1, 3));
      const offsetMinute = Number(offset.slice(4, 6));
      if (offsetHour > 23 || offsetMinute > 59) throw new RangeError("Invalid date: UTC offset is out of range");
      offsetMs = (offsetHour * 60 + offsetMinute) * 60_000 * (offset[0] === "+" ? 1 : -1);
    }
    return fromInstant(new Date(day.getTime() + clockMs - offsetMs), timeZone);
  }
  if (timeZone === "local") {
    const date = toInstant(day, timeZone);
    date.setHours(hour, minute, second, millisecond);
    validDate(date);
    assertLocalDay(date, day);
  } else {
    validDate(new Date(day.getTime() + clockMs - (timeZone === "KST" ? KST_OFFSET_MS : 0)));
  }
  return day;
}

export function parseDay(dateInput: Date | string, timeZone: TimeZone): Date {
  if (typeof dateInput === "string") return parseString(dateInput, timeZone);
  let timestamp: number;
  try {
    timestamp = Date.prototype.getTime.call(dateInput);
  } catch {
    throw new TypeError("dateInput must be a Date or ISO string");
  }
  return fromInstant(new Date(timestamp), timeZone);
}
