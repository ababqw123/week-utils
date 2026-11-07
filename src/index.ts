export type WeekStart = "monday" | "sunday";

/* -------------------------
   Month-based week (월 주차)
-------------------------- */

/**
 * Date -> 해당 월의 몇 주차인지 (1~5/6)
 * weekStart: "monday"(기본) or "sunday"
 */
export function getMonthWeek(dateInput: Date | string, weekStart: WeekStart = "monday") {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");

  const currentDate = date.getDate();

  // 1일이 포함된 달력 행을 1주차로 계산한다.
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
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
  if (month < 1 || month > 12) throw new Error("month must be 1~12");
  if (weekNumber < 1 || weekNumber > 6) throw new Error("weekNumber must be 1~6");

  const firstDay = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDay.getDay(); // 0(일)~6(토)

  // 해당 주차의 시작 날짜(월/일 시작 기준에 따라 달라짐)
  const start = new Date(firstDay);

  let diffToStart = 0;
  if (weekStart === "monday") {
    // 월요일 시작: 월(1)~일(0)
    const first = firstDayOfWeek === 0 ? 7 : firstDayOfWeek; // 1~7
    diffToStart = 1 - first; // 월요일까지 back
  } else {
    // 일요일 시작
    diffToStart = -firstDayOfWeek;
  }

  start.setDate(1 + diffToStart + (weekNumber - 1) * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

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
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");

  // UTC로 변환해서 "목요일" 기준으로 ISO year 결정
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // 1~7 (월~일)
  date.setUTCDate(date.getUTCDate() + 4 - day); // 해당 주의 목요일로 이동
  return date.getUTCFullYear();
}

/**
 * ISO week number (1~52/53)
 */
export function getISOWeek(dateInput: Date | string): number {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid date");

  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day); // 목요일

  const isoYearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const diffDays = Math.floor((date.getTime() - isoYearStart.getTime()) / 86400000);

  // 1월 1일이 포함된 주가 아니라 "첫 목요일 포함 주"가 1주차라서 +1 조정
  return Math.ceil((diffDays + 1) / 7);
}

/**
 * ISO year/week -> 그 주의 시작(월)~끝(일)
 */
export function getISOWeekRange(isoYear: number, isoWeek: number) {
  if (isoWeek < 1 || isoWeek > 53) throw new Error("isoWeek must be 1~53");

  // ISO 1주차는 해당 isoYear의 첫 번째 목요일이 있는 주
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7; // 1~7

  // ISO week1의 월요일
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));

  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (isoWeek - 1) * 7);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);

  // 반환은 Date 객체 (UTC 기준이지만 Date는 로컬 출력)
  return { start: new Date(start), end: new Date(end) };
}
