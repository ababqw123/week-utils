import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getISOWeekInfo, getISOWeekRange, getISOWeeksInYear, getMonthWeek,
  getWeeksInMonth, getMonthWeeks,
} from '@jaeyeong/week-utils';

const DAY = 86_400_000;
const leap = year => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
const isoYearWeeks = year => {
  const weekday = new Date(Date.UTC(year, 0, 1)).getUTCDay() || 7;
  return weekday === 4 || (weekday === 3 && leap(year)) ? 53 : 52;
};

test('a full 400-year cycle matches independent calendar formulas in UTC and KST', () => {
  for (let year = 2000; year < 2400; year++) {
    const yearStart = Date.UTC(year, 0, 1);
    assert.equal(getISOWeeksInYear(year), isoYearWeeks(year));
    for (let dayIndex = 0; dayIndex < (leap(year) ? 366 : 365); dayIndex++) {
      const calendar = new Date(yearStart + dayIndex * DAY);
      const weekday = calendar.getUTCDay() || 7;
      let isoYear = year;
      let week = Math.floor((dayIndex + 1 - weekday + 10) / 7);
      if (week < 1) { isoYear--; week = isoYearWeeks(isoYear); }
      else if (week > isoYearWeeks(year)) { isoYear++; week = 1; }
      const firstWeekday = new Date(Date.UTC(year, calendar.getUTCMonth(), 1)).getUTCDay();
      for (const [timeZone, offset] of [['UTC', 0], ['KST', 9 * 3600000]]) {
        const instant = new Date(calendar.getTime() - offset);
        const options = { timeZone };
        assert.deepEqual(getISOWeekInfo(instant, options), { year: isoYear, week });
        const range = getISOWeekRange(isoYear, week, options);
        assert.equal(range.start.getTime(), calendar.getTime() - (weekday - 1) * DAY - offset);
        assert.equal(range.end.getTime(), calendar.getTime() + (7 - weekday) * DAY - offset);
        for (const [weekStart, firstIndex] of [['monday', 1], ['sunday', 0]]) {
          const shift = (firstWeekday - firstIndex + 7) % 7;
          const monthWeek = Math.floor((calendar.getUTCDate() - 1 + shift) / 7) + 1;
          assert.equal(getMonthWeek(instant, { timeZone, weekStart }), monthWeek);
        }
      }
    }
  }
});

test('month calendars cover exactly the expected rows throughout a Gregorian cycle', () => {
  for (let year = 2000; year < 2400; year++) {
    for (let month = 1; month <= 12; month++) {
      const first = Date.UTC(year, month - 1, 1);
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const weekday = new Date(first).getUTCDay();
      for (const [weekStart, firstIndex] of [['monday', 1], ['sunday', 0]]) {
        const shift = (weekday - firstIndex + 7) % 7;
        const count = Math.ceil((lastDay + shift) / 7);
        assert.equal(getWeeksInMonth(year, month, { weekStart }), count);
        for (const [timeZone, offset] of [['UTC', 0], ['KST', 9 * 3600000]]) {
          const rows = getMonthWeeks(year, month, { weekStart, timeZone });
          assert.equal(rows.length, count);
          rows.forEach((row, index) => {
            const expectedStart = first + (index * 7 - shift) * DAY - offset;
            assert.equal(row.week, index + 1);
            assert.equal(row.start.getTime(), expectedStart);
            assert.equal(row.end.getTime(), expectedStart + 6 * DAY);
            assert.equal(row.endExclusive.getTime(), expectedStart + 7 * DAY);
          });
        }
      }
    }
  }
});
