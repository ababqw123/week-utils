import {
  getISOWeekInfo, getMonthWeeks, getWeekInterval, isSameWeek,
  type WeekOptions, type ISOWeekInfo, type MonthWeek, type WeekInterval,
} from "@jaeyeong/week-utils";

const options: WeekOptions = { timeZone: "KST", weekStart: "monday" };
const info: ISOWeekInfo = getISOWeekInfo("2024-01-01", options);
const rows: MonthWeek[] = getMonthWeeks(2024, 1, options);
const interval: WeekInterval = getWeekInterval("2024-01-01", options);
const same: boolean = isSameWeek("2024-01-01", "2024-01-02", options);
// @ts-expect-error Misspelled week starts are rejected.
getWeekInterval("2024-01-01", { weekStart: "Monday" });
