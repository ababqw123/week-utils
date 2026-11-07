import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import {
  getMonthWeek, getMonthWeekRange, getISOWeek, getISOWeekYear, getISOWeekRange,
} from '@jaeyeong/week-utils';

const utcDate = (year, month, day) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};
const parts = (date) => [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];

test('month weeks start with the row containing the first day', () => {
  assert.equal(getMonthWeek(utcDate(2024, 1, 1)), 1);
  assert.equal(getMonthWeek(utcDate(2024, 1, 7)), 1);
  assert.equal(getMonthWeek(utcDate(2024, 1, 8)), 2);
  assert.equal(getMonthWeek(utcDate(2024, 1, 22)), 4);
  assert.equal(getMonthWeek(utcDate(2024, 1, 28), 'sunday'), 5);
  assert.equal(getMonthWeek(utcDate(2024, 9, 1)), 1);
  assert.equal(getMonthWeek(utcDate(2024, 9, 2)), 2);
  assert.equal(getMonthWeek(utcDate(2024, 9, 30)), 6);
  assert.equal(getMonthWeek(utcDate(2024, 9, 7), 'sunday'), 1);
  assert.equal(getMonthWeek(utcDate(2024, 9, 8), 'sunday'), 2);
});

test('month ranges include neighboring months and default to UTC calendar dates', () => {
  const monday = getMonthWeekRange(2024, 1, 4);
  assert.deepEqual(parts(monday.start), [2024, 1, 22]);
  assert.deepEqual(parts(monday.end), [2024, 1, 28]);
  const sunday = getMonthWeekRange(2024, 1, 4, 'sunday');
  assert.deepEqual(parts(sunday.start), [2024, 1, 21]);
  assert.deepEqual(parts(sunday.end), [2024, 1, 27]);
  const overlap = getMonthWeekRange(2024, 9, 1);
  assert.deepEqual(parts(overlap.start), [2024, 8, 26]);
  assert.deepEqual(parts(overlap.end), [2024, 9, 1]);
  assert.equal(overlap.start.getUTCHours(), 0);
});

test('every UTC date maps back into its month week range, including leap days', () => {
  for (const weekStart of ['monday', 'sunday']) {
    for (let year = 2023; year <= 2026; year++) {
      for (let month = 1; month <= 12; month++) {
        const days = new Date(year, month, 0).getDate();
        for (let day = 1; day <= days; day++) {
          const date = utcDate(year, month, day);
          const week = getMonthWeek(date, weekStart);
          const { start, end } = getMonthWeekRange(year, month, week, weekStart);
          assert.ok(date >= start && date <= end, `${year}-${month}-${day} ${weekStart}`);
          assert.equal(start.getUTCDay(), weekStart === 'monday' ? 1 : 0);
          assert.equal(end.getUTCDay(), weekStart === 'monday' ? 0 : 6);
        }
      }
    }
  }
});

test('ISO weeks handle week 53 and year boundaries', () => {
  for (const [year, month, day, isoYear, week] of [
    [2015, 12, 31, 2015, 53], [2016, 1, 1, 2015, 53],
    [2016, 1, 4, 2016, 1], [2018, 12, 31, 2019, 1],
    [2021, 1, 3, 2020, 53], [2021, 1, 4, 2021, 1],
    [2024, 2, 29, 2024, 9], [2024, 12, 30, 2025, 1],
  ]) {
    const date = utcDate(year, month, day);
    assert.equal(getISOWeekYear(date), isoYear);
    assert.equal(getISOWeek(date), week);
    const { start, end } = getISOWeekRange(isoYear, week);
    const utcTimestamp = Date.UTC(year, month - 1, day);
    assert.ok(utcTimestamp >= start.getTime() && utcTimestamp <= end.getTime());
  }
});

test('ISO ranges return Monday through Sunday at UTC midnight', () => {
  const { start, end } = getISOWeekRange(2020, 53);
  assert.equal(start.toISOString(), '2020-12-28T00:00:00.000Z');
  assert.equal(end.toISOString(), '2021-01-03T00:00:00.000Z');
});

test('ISO strings default to UTC without mutating Date inputs', () => {
  const date = utcDate(2024, 1, 22);
  const timestamp = date.getTime();
  for (const fn of [getMonthWeek, getISOWeek, getISOWeekYear]) {
    assert.equal(fn('2024-01-22T12:00:00'), fn(new Date('2024-01-22T12:00:00Z')));
    assert.equal(fn('2024-01-22'), fn(new Date('2024-01-22')));
    fn(date);
    assert.equal(date.getTime(), timestamp);
    assert.throws(() => fn('not-a-date'), /Invalid date/);
    assert.throws(() => fn(new Date(NaN)), /Invalid date/);
  }
});

test('out-of-range months and weeks are rejected', () => {
  for (const month of [0, 13]) assert.throws(() => getMonthWeekRange(2024, month, 1), /month/);
  for (const week of [0, 7]) assert.throws(() => getMonthWeekRange(2024, 1, week), /weekNumber/);
  for (const week of [0, 54]) assert.throws(() => getISOWeekRange(2024, week), /isoWeek/);
});

test('CommonJS and ESM package entry points expose the same public functions', () => {
  const require = createRequire(import.meta.url);
  const cjs = require('@jaeyeong/week-utils');
  assert.deepEqual(Object.keys(cjs).sort(), [
    'getMonthWeek', 'getMonthWeekRange', 'getISOWeek', 'getISOWeekYear', 'getISOWeekRange',
    'getISOWeekInfo', 'getWeeksInMonth', 'getISOWeeksInYear', 'getWeekInterval', 'isSameWeek', 'getMonthWeeks',
  ].sort());
  assert.equal(cjs.getMonthWeek(utcDate(2024, 1, 1)), 1);
  assert.equal(cjs.getISOWeek(utcDate(2021, 1, 1)), 53);
});

test('range arguments must be finite integers without implicit coercion', () => {
  for (const invalid of [NaN, Infinity, -Infinity, 1.5, '1', null, undefined, true]) {
    assert.throws(() => getMonthWeekRange(invalid, 1, 1), /year/);
    assert.throws(() => getMonthWeekRange(2024, invalid, 1), /month/);
    assert.throws(() => getMonthWeekRange(2024, 1, invalid), /weekNumber/);
    assert.throws(() => getISOWeekRange(invalid, 1), /isoYear/);
    assert.throws(() => getISOWeekRange(2024, invalid), /isoWeek/);
  }
});

test('unknown week start options are rejected consistently', () => {
  for (const invalid of ['friday', '', null, 0, true]) {
    assert.throws(() => getMonthWeek(utcDate(2024, 1, 7), invalid), TypeError);
    assert.throws(() => getMonthWeekRange(2024, 1, 1, invalid), TypeError);
  }
  assert.equal(getMonthWeek(utcDate(2024, 1, 7), undefined), 1);
});

test('date functions accept Date objects from other realms and reject other input types', () => {
  const foreignDate = runInNewContext('new Date("2024-01-22T00:00:00Z")');
  for (const fn of [getMonthWeek, getISOWeek, getISOWeekYear]) {
    assert.equal(fn(foreignDate), fn(utcDate(2024, 1, 22)));
    for (const invalid of [null, undefined, 0, true, {}, [], { valueOf: () => 0 }]) {
      assert.throws(() => fn(invalid), TypeError);
    }
  }
});

test('years 0 through 99 retain their literal year in all week functions', () => {
  for (const year of [-1, 0, 1, 4, 50, 99, 100]) {
    for (const [month, day] of [[1, 1], [1, 4], [2, 28], [3, 1], [12, 31]]) {
      const date = utcDate(year, month, day);
      const shifted = utcDate(year + 400, month, day);
      // Gregorian weekdays and leap years repeat every 400 years.
      assert.equal(getISOWeekYear(date), getISOWeekYear(shifted) - 400);
      assert.equal(getISOWeek(date), getISOWeek(shifted));
      for (const weekStart of ['monday', 'sunday']) {
        const week = getMonthWeek(date, weekStart);
        assert.equal(week, getMonthWeek(shifted, weekStart));
        const range = getMonthWeekRange(year, month, week, weekStart);
        assert.ok(date >= range.start && date <= range.end);
        for (const boundary of ['start', 'end']) {
          const later = getMonthWeekRange(year + 400, month, week, weekStart)[boundary];
          assert.deepEqual(parts(range[boundary]), [later.getUTCFullYear() - 400, later.getUTCMonth() + 1, later.getUTCDate()]);
        }
      }
      const isoRange = getISOWeekRange(getISOWeekYear(date), getISOWeek(date));
      const isoLater = getISOWeekRange(getISOWeekYear(shifted), getISOWeek(shifted));
      for (const boundary of ['start', 'end']) {
        assert.equal(isoRange[boundary].getUTCFullYear(), isoLater[boundary].getUTCFullYear() - 400);
        assert.equal(isoRange[boundary].getUTCMonth(), isoLater[boundary].getUTCMonth());
        assert.equal(isoRange[boundary].getUTCDate(), isoLater[boundary].getUTCDate());
      }
    }
  }
  assert.equal(getISOWeekRange(1, 1).start.toISOString(), '0001-01-01T00:00:00.000Z');
  assert.equal(getISOWeek(utcDate(0, 2, 29)), getISOWeek(utcDate(400, 2, 29)));
});

test('dates outside the JavaScript Date range fail instead of returning Invalid Date', () => {
  for (const year of [1e10, -1e10]) {
    assert.throws(() => getMonthWeekRange(year, 1, 1), RangeError);
    assert.throws(() => getISOWeekRange(year, 1), RangeError);
  }
  assert.throws(() => getMonthWeekRange(275760, 9, 6), RangeError);
  assert.throws(() => getISOWeekRange(275760, 53), RangeError);
});

test('month ranges normalize each boundary independently across a midnight DST change', () => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
    import assert from 'node:assert/strict';
    import { getMonthWeekRange } from '@jaeyeong/week-utils';
    const { start, end } = getMonthWeekRange(2018, 11, 2, { weekStart: 'sunday', timeZone: 'local' });
    assert.equal(start.getDate(), 4);
    assert.equal(start.getHours(), 1); // Midnight did not exist on this date.
    assert.equal(end.getDate(), 10);
    assert.equal(end.getHours(), 0);
    const october = getMonthWeekRange(2017, 10, 3, { weekStart: 'sunday', timeZone: 'local' });
    assert.equal(october.start.getDate(), 15);
    assert.equal(october.start.getHours(), 1);
    assert.equal(october.end.getDate(), 21);
    assert.equal(october.end.getHours(), 0);
  `], { encoding: 'utf8', env: { ...process.env, TZ: 'America/Sao_Paulo' } });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test('extra calendar weeks require explicit allowOverflow', () => {
  assert.throws(() => getMonthWeekRange(2021, 2, 6), RangeError);
  assert.throws(() => getISOWeekRange(2021, 53), RangeError);
  const month = getMonthWeekRange(2021, 2, 6, { allowOverflow: true });
  assert.deepEqual(parts(month.start), [2021, 3, 8]);
  const iso = getISOWeekRange(2021, 53, { allowOverflow: true });
  assert.equal(iso.start.toISOString(), '2022-01-03T00:00:00.000Z');
});
