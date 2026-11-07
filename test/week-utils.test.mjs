import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
import {
  getMonthWeek, getMonthWeekRange, getISOWeek, getISOWeekYear, getISOWeekRange,
} from '@jaeyeong/week-utils';

const localDate = (year, month, day) => new Date(year, month - 1, day);
const parts = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];

test('month weeks start with the row containing the first day', () => {
  assert.equal(getMonthWeek(localDate(2024, 1, 1)), 1);
  assert.equal(getMonthWeek(localDate(2024, 1, 7)), 1);
  assert.equal(getMonthWeek(localDate(2024, 1, 8)), 2);
  assert.equal(getMonthWeek(localDate(2024, 1, 22)), 4);
  assert.equal(getMonthWeek(localDate(2024, 1, 28), 'sunday'), 5);
  assert.equal(getMonthWeek(localDate(2024, 9, 1)), 1);
  assert.equal(getMonthWeek(localDate(2024, 9, 2)), 2);
  assert.equal(getMonthWeek(localDate(2024, 9, 30)), 6);
  assert.equal(getMonthWeek(localDate(2024, 9, 7), 'sunday'), 1);
  assert.equal(getMonthWeek(localDate(2024, 9, 8), 'sunday'), 2);
});

test('month ranges include neighboring months and use local calendar dates', () => {
  const monday = getMonthWeekRange(2024, 1, 4);
  assert.deepEqual(parts(monday.start), [2024, 1, 22]);
  assert.deepEqual(parts(monday.end), [2024, 1, 28]);
  const sunday = getMonthWeekRange(2024, 1, 4, 'sunday');
  assert.deepEqual(parts(sunday.start), [2024, 1, 21]);
  assert.deepEqual(parts(sunday.end), [2024, 1, 27]);
  const overlap = getMonthWeekRange(2024, 9, 1);
  assert.deepEqual(parts(overlap.start), [2024, 8, 26]);
  assert.deepEqual(parts(overlap.end), [2024, 9, 1]);
  assert.equal(overlap.start.getHours(), 0);
});

test('every date maps back into its month week range, including leap days and DST', () => {
  for (const weekStart of ['monday', 'sunday']) {
    for (let year = 2023; year <= 2026; year++) {
      for (let month = 1; month <= 12; month++) {
        const days = new Date(year, month, 0).getDate();
        for (let day = 1; day <= days; day++) {
          const date = localDate(year, month, day);
          const week = getMonthWeek(date, weekStart);
          const { start, end } = getMonthWeekRange(year, month, week, weekStart);
          assert.ok(date >= start && date <= end, `${year}-${month}-${day} ${weekStart}`);
          assert.equal(start.getDay(), weekStart === 'monday' ? 1 : 0);
          assert.equal(end.getDay(), weekStart === 'monday' ? 0 : 6);
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
    const date = localDate(year, month, day);
    assert.equal(getISOWeekYear(date), isoYear);
    assert.equal(getISOWeek(date), week);
    const { start, end } = getISOWeekRange(isoYear, week);
    const utcDate = Date.UTC(year, month - 1, day);
    assert.ok(utcDate >= start.getTime() && utcDate <= end.getTime());
  }
});

test('ISO ranges return Monday through Sunday at UTC midnight', () => {
  const { start, end } = getISOWeekRange(2020, 53);
  assert.equal(start.toISOString(), '2020-12-28T00:00:00.000Z');
  assert.equal(end.toISOString(), '2021-01-03T00:00:00.000Z');
});

test('string inputs use JavaScript Date parsing without mutating Date inputs', () => {
  const date = localDate(2024, 1, 22);
  const timestamp = date.getTime();
  for (const fn of [getMonthWeek, getISOWeek, getISOWeekYear]) {
    assert.equal(fn('2024-01-22T12:00:00'), fn(new Date(2024, 0, 22, 12)));
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
  ].sort());
  assert.equal(cjs.getMonthWeek(localDate(2024, 1, 1)), 1);
  assert.equal(cjs.getISOWeek(localDate(2021, 1, 1)), 53);
});
