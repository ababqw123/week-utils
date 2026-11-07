import {
  getISOWeekInfo, getISOWeek, getISOWeekYear, getISOWeeksInYear, getISOWeekRange,
  getMonthWeek, getMonthWeekRange, getWeeksInMonth, getWeekInterval, getMonthWeeks, isSameWeek,
  type DateOptions, type WeekOptions, type WeekRange, type WeekInterval,
  type ISOWeekInfo, type MonthWeek, type TimeZone, type WeekStart,
} from "@jaeyeong/week-utils";

const timeZone: TimeZone = "KST";
const weekStart: WeekStart = "sunday";
const dateOptions: DateOptions = { timeZone };
const options: WeekOptions = { timeZone, weekStart };
const info: ISOWeekInfo = getISOWeekInfo("2024-01-01", dateOptions);
const week: number = getISOWeek("2024-01-01", dateOptions);
const year: number = getISOWeekYear("2024-01-01", dateOptions);
const count: number = getISOWeeksInYear(2024);
const rows: number = getWeeksInMonth(2024, 1, { weekStart });
const monthWeek: number = getMonthWeek("2024-01-01", options);
const legacy: number = getMonthWeek("2024-01-01", "sunday");
const interval: WeekInterval = getWeekInterval("2024-01-01", options);
const range: WeekRange = getMonthWeekRange(2024, 1, 6, { ...options, allowOverflow: true });
const isoRange: WeekRange = getISOWeekRange(2021, 53, { timeZone, allowOverflow: true });
const calendar: MonthWeek[] = getMonthWeeks(2024, 1, options);
const same: boolean = isSameWeek("2024-01-01", new Date(), options);

// @ts-expect-error Only documented time zones are supported.
getISOWeekInfo("2024-01-01", { timeZone: "UTD" });
// @ts-expect-error ISO weeks always begin on Monday.
getISOWeekInfo("2024-01-01", { weekStart: "sunday" });
// @ts-expect-error Overflow policy is boolean.
getISOWeekRange(2024, 1, { allowOverflow: "yes" });
