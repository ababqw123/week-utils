export type WeekStart = "monday" | "sunday";

function validDate(date: Date): Date {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid date or date outside the supported range");
  }
  return date;
}

function parseDate(dateInput: Date | string): Date {
  if (typeof dateInput === "string") return validDate(new Date(dateInput));

  let timestamp: number;
  try {
    // 다른 realm의 Date도 허용하며 입력 객체는 변경하지 않는다.
    timestamp = Date.prototype.getTime.call(dateInput);
  } catch {
    throw new TypeError("dateInput must be a Date or string");
  }
  return validDate(new Date(timestamp));
}

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) throw new RangeError(`${name} must be a finite integer`);
}

function assertWeekStart(weekStart: WeekStart): void {
  if (weekStart !== "monday" && weekStart !== "sunday") {
    throw new TypeError('weekStart must be "monday" or "sunday"');
  }
}

function localDate(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  // Date 생성자의 0~99년 -> 1900~1999년 변환을 피한다.
  date.setFullYear(year, monthIndex, day);
  return validDate(date);
}

function utcDate(year: number, monthIndex: number, day: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, monthIndex, day);
  return validDate(date);
}

function isoThursday(dateInput: Date | string): Date {
  const input = parseDate(dateInput);
  const date = utcDate(input.getFullYear(), input.getMonth(), input.getDate());
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  return validDate(date);
}

/* -------------------------
   Month-based week (월 주차)
-------------------------- */

/**
 * Date -> 해당 월의 몇 주차인지 (1~5/6)
 * weekStart: "monday"(기본) or "sunday"
 */
export function getMonthWeek(dateInput: Date | string, weekStart: WeekStart = "monday"): number {
  assertWeekStart(weekStart);
  const date = parseDate(dateInput);

  const currentDate = date.getDate();

  // 1일이 포함된 달력 행을 1주차로 계산한다.
  const firstDay = localDate(date.getFullYear(), date.getMonth(), 1);
  const firstDayIndex = firstDay.getDay(); // 0(일)~6(토)

  // weekStart 기준 변환: monday면 0(일) -> 6, 1(월)->0 ...
  const shift =
    weekStart === "monday"
      ? firstDayIndex === 0
        ? 6
        : firstDayIndex - 1
      : firstDayIndex;

  return Math.ceil((currentDate + shift) / 7);
}

/**
 * 연/월/주차 -> 해당 주차의 시작~끝 날짜 범위 (Date 반환)
 * month는 1~12
 */
export function getMonthWeekRange(
  year: number,
  month: number,
  weekNumber: number,
  weekStart: WeekStart = "monday"
) {
  assertInteger(year, "year");
  assertInteger(month, "month");
  assertInteger(weekNumber, "weekNumber");
  assertWeekStart(weekStart);
  if (month < 1 || month > 12) throw new RangeError("month must be 1~12");
  if (weekNumber < 1 || weekNumber > 6) throw new RangeError("weekNumber must be 1~6");

  const firstDay = localDate(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0(일)~6(토)

  // 해당 주차의 시작 날짜(월/일 시작 기준에 따라 달라짐)
  let diffToStart = 0;
  if (weekStart === "monday") {
    // 월요일 시작: 월(1)~일(0)
    const first = firstDayOfWeek === 0 ? 7 : firstDayOfWeek; // 1~7
    diffToStart = 1 - first; // 월요일까지 back
  } else {
    // 일요일 시작
    diffToStart = -firstDayOfWeek;
  }

  const startDay = 1 + diffToStart + (weekNumber - 1) * 7;
  // 자정 DST 전환으로 시작이 01:00이 되어도 종료일에 전파하지 않는다.
  const start = localDate(year, month - 1, startDay);
  const end = localDate(year, month - 1, startDay + 6);

  return { start, end };
}

/* -------------------------
   ISO Week (연간 주차, ISO-8601)
-------------------------- */

/**
 * ISO week-year를 구한다.
 * 연말/연초에 ISO 주차 연도가 바뀔 수 있음.
 */
export function getISOWeekYear(dateInput: Date | string): number {
  return isoThursday(dateInput).getUTCFullYear();
}

/**
 * ISO week number (1~52/53)
 */
export function getISOWeek(dateInput: Date | string): number {
  const date = isoThursday(dateInput);
  const isoYearStart = utcDate(date.getUTCFullYear(), 0, 1);
  const diffDays = Math.floor((date.getTime() - isoYearStart.getTime()) / 86400000);

  // 1월 1일이 포함된 주가 아니라 "첫 목요일 포함 주"가 1주차라서 +1 조정
  return Math.ceil((diffDays + 1) / 7);
}

/**
 * ISO year/week -> 그 주의 시작(월)~끝(일)
 */
export function getISOWeekRange(isoYear: number, isoWeek: number) {
  assertInteger(isoYear, "isoYear");
  assertInteger(isoWeek, "isoWeek");
  if (isoWeek < 1 || isoWeek > 53) throw new RangeError("isoWeek must be 1~53");

  // ISO 1주차는 해당 isoYear의 첫 번째 목요일이 있는 주
  const jan4 = utcDate(isoYear, 0, 4);
  const jan4Day = jan4.getUTCDay() || 7; // 1~7

  const startDay = 4 - (jan4Day - 1) + (isoWeek - 1) * 7;
  const start = utcDate(isoYear, 0, startDay);
  const end = utcDate(isoYear, 0, startDay + 6);
  return { start, end };
}
