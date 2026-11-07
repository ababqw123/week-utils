import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
  getMonthWeek, getMonthWeekRange, getISOWeek, getISOWeekYear, getISOWeekRange,
  getISOWeekInfo, getWeeksInMonth, getISOWeeksInYear, getWeekInterval, isSameWeek, getMonthWeeks,
} from '@jaeyeong/week-utils';

const kst = Object.freeze({ timeZone: 'KST' });
const runInZone = (zone, code) => {
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], {
    encoding: 'utf8', env: { ...process.env, TZ: zone },
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return result.stdout.trim();
};

test('the same instant can be in different UTC/KST weeks, months, and ISO years', () => {
  assert.equal(getMonthWeek('2024-01-07T15:00:00Z'), 1);
  assert.equal(getMonthWeek('2024-01-07T15:00:00Z', kst), 2);
  assert.equal(getMonthWeek('2024-01-31T15:00:00Z'), 5);
  assert.equal(getMonthWeek('2024-01-31T15:00:00Z', kst), 1);
  assert.deepEqual(getISOWeekInfo('2024-12-29T15:00:00Z'), { year: 2024, week: 52 });
  assert.deepEqual(getISOWeekInfo('2024-12-29T15:00:00Z', kst), { year: 2025, week: 1 });
  assert.equal(getISOWeekYear('2024-12-29T15:00:00Z', kst), 2025);
  assert.equal(getISOWeek('2024-12-29T15:00:00Z', kst), 1);
  assert.equal(getISOWeek(new Date('2024-12-29T15:00:00Z'), kst), 1);
});

test('KST ranges return actual instants at Korean midnight', () => {
  const month = getMonthWeekRange(2024, 1, 2, kst);
  assert.equal(month.start.toISOString(), '2024-01-07T15:00:00.000Z');
  assert.equal(month.end.toISOString(), '2024-01-13T15:00:00.000Z');
  const iso = getISOWeekRange(2025, 1, kst);
  assert.equal(iso.start.toISOString(), '2024-12-29T15:00:00.000Z');
  assert.equal(iso.end.toISOString(), '2025-01-04T15:00:00.000Z');
});

test('ISO range boundaries round-trip using the same time zone', () => {
  for (const timeZone of ['UTC', 'KST', 'local']) {
    for (const [year, week] of [[1, 1], [2020, 53], [2024, 52], [2025, 1]]) {
      const options = { timeZone };
      const range = getISOWeekRange(year, week, options);
      for (const date of [range.start, range.end]) {
        assert.deepEqual(getISOWeekInfo(date, options), { year, week });
      }
    }
  }
});

test('date-only and offset-free strings use the selected zone as calendar input', () => {
  for (const timeZone of ['UTC', 'KST', 'local']) {
    const options = { timeZone };
    for (const input of ['2024-01-08', '2024-01-08T00:00', '2024-01-08T23:59:59.999']) {
      assert.equal(getMonthWeek(input, options), 2);
      assert.deepEqual(getISOWeekInfo(input, options), { year: 2024, week: 2 });
    }
  }
  assert.equal(getISOWeek('2024-01-08T00:00:00+09:00'), 1);
  assert.equal(getISOWeek('2024-01-08T00:00:00+09:00', kst), 2);
  assert.equal(getISOWeek('2024-01-07T10:00:00-05:00', kst), 2);
  assert.equal(getISOWeek('2024-01-07T14:59:59.999Z', kst), 1);
  assert.equal(getISOWeek('2024-01-07T15:00:00.000Z', kst), 2);
});

test('strict ISO parsing rejects impossible calendar dates, times, offsets, and ambiguous formats', () => {
  const inputs = [
    '2024-02-30', '2023-02-29', '1900-02-29', '2024-04-31', '2024-00-01',
    '2024-13-01', '2024-01-00', '2024-01-32', '2024-02-30T12:00:00Z',
    '2024-01-01T24:00:00Z', '2024-01-01T12:60:00Z', '2024-01-01T12:00:60Z',
    '2024-01-01T00:00:00+24:00', '2024-01-01T00:00:00+09:60',
    '2024-01-01T00:00:00.1234Z', '2024-01-01T12:00.5', '2024-01-01+09:00',
    '01/02/2024', '2024-1-1', '2024', '2024-01-01 ', '2024-01-01\n', '', '-000000-01-01',
  ];
  for (const timeZone of ['UTC', 'KST', 'local']) {
    for (const input of inputs) {
      for (const fn of [getMonthWeek, getISOWeek, getISOWeekYear, getISOWeekInfo, getWeekInterval]) {
        assert.throws(() => fn(input, { timeZone }), RangeError, input);
      }
    }
  }
  for (const date of ['0000-02-29', '2000-02-29', '2024-02-29', '+010000-01-01', '-000001-01-01']) {
    assert.ok(Number.isInteger(getISOWeek(date)));
  }
  for (const fraction of ['1', '12', '123']) {
    assert.equal(getISOWeek(`2024-01-08T00:00:00.${fraction}Z`), 2);
  }
});

test('month and ISO year counts support selection validation', () => {
  assert.equal(getWeeksInMonth(2021, 2), 4);
  assert.equal(getWeeksInMonth(2021, 2, 'sunday'), 5);
  assert.equal(getWeeksInMonth(2024, 9, { weekStart: 'monday' }), 6);
  assert.equal(getWeeksInMonth(2024, 9, { weekStart: 'sunday' }), 5);
  assert.equal(getISOWeeksInYear(2020), 53);
  assert.equal(getISOWeeksInYear(2021), 52);
  assert.equal(getISOWeeksInYear(2026), 53);
  assert.equal(getISOWeeksInYear(0), getISOWeeksInYear(400));
  assert.throws(() => getMonthWeekRange(2021, 2, 5), /weekNumber/);
  assert.throws(() => getISOWeekRange(2021, 53), /isoWeek/);
  assert.doesNotThrow(() => getMonthWeekRange(2021, 2, 5, { weekStart: 'sunday' }));
  assert.doesNotThrow(() => getISOWeekRange(2020, 53));
});

test('week intervals include all of the last day and exclude the next week', () => {
  const interval = getWeekInterval('2024-01-10', kst);
  assert.equal(interval.start.toISOString(), '2024-01-07T15:00:00.000Z');
  assert.equal(interval.endExclusive.toISOString(), '2024-01-14T15:00:00.000Z');
  const includes = date => date >= interval.start && date < interval.endExclusive;
  assert.ok(includes(new Date('2024-01-07T15:00:00Z')));
  assert.ok(includes(new Date('2024-01-14T14:59:59.999Z')));
  assert.equal(includes(new Date('2024-01-14T15:00:00Z')), false);
  assert.equal(includes(new Date('2024-01-07T14:59:59.999Z')), false);
  const sunday = getWeekInterval('2024-01-10', { ...kst, weekStart: 'sunday' });
  assert.equal(sunday.start.toISOString(), '2024-01-06T15:00:00.000Z');
});

test('isSameWeek compares full calendar weeks across months and years', () => {
  assert.ok(isSameWeek('2024-12-30', '2025-01-05'));
  assert.ok(isSameWeek('2024-01-29', '2024-02-04'));
  assert.equal(isSameWeek('2024-01-07', '2024-01-08'), false);
  assert.ok(isSameWeek('2024-01-07', '2024-01-08', { weekStart: 'sunday' }));
  assert.equal(isSameWeek('2024-01-01', '2025-01-01'), false);
  const a = '2024-01-07T14:59:59.999Z';
  const b = '2024-01-07T15:00:00Z';
  assert.ok(isSameWeek(a, b));
  assert.equal(isSameWeek(a, b, kst), false);
});

test('month week arrays contain exactly the calendar rows and adjacent intervals', () => {
  for (const timeZone of ['UTC', 'KST', 'local']) {
    for (const weekStart of ['monday', 'sunday']) {
      for (const [year, month] of [[1, 1], [2021, 2], [2024, 9], [2024, 12]]) {
        const options = { timeZone, weekStart };
        const rows = getMonthWeeks(year, month, options);
        assert.equal(rows.length, getWeeksInMonth(year, month, { weekStart }));
        rows.forEach((row, index) => {
          assert.equal(row.week, index + 1);
          assert.deepEqual({ start: row.start, end: row.end }, getMonthWeekRange(year, month, index + 1, options));
          assert.ok(row.end < row.endExclusive);
          if (index > 0) assert.equal(rows[index - 1].endExclusive.getTime(), row.start.getTime());
        });
      }
    }
  }
  const rows = getMonthWeeks(2024, 9, kst);
  assert.equal(rows[0].start.toISOString(), '2024-08-25T15:00:00.000Z');
  assert.equal(rows.at(-1).endExclusive.toISOString(), '2024-10-06T15:00:00.000Z');
  rows[0].start.setTime(0);
  assert.notEqual(getMonthWeeks(2024, 9, kst)[0].start.getTime(), 0);
});

test('UTC and KST results are identical across host time zones', () => {
  const code = `
    import * as w from '@jaeyeong/week-utils';
    const output = ['UTC', 'KST'].map(timeZone => {
      const options = { timeZone };
      return [
        w.getMonthWeek('2024-01-07T15:00:00Z', options),
        w.getISOWeekInfo('2024-12-29T15:00:00Z', options),
        w.getISOWeekRange(2025, 1, options),
        w.getMonthWeekRange(2024, 1, 2, options),
        w.getWeekInterval('2024-03-10T12:00:00', options),
        w.getMonthWeeks(2024, 3, options),
        w.isSameWeek('2024-01-07T14:59:59Z', '2024-01-07T15:00:00Z', options),
      ];
    });
    console.log(JSON.stringify(output));
  `;
  const expected = runInZone('UTC', code);
  for (const zone of ['Asia/Seoul', 'America/New_York', 'Australia/Lord_Howe', 'Pacific/Apia']) {
    assert.equal(runInZone(zone, code), expected, zone);
  }
});

test('local intervals respect DST instead of adding a fixed number of hours', () => {
  runInZone('America/New_York', `
    import assert from 'node:assert/strict';
    import { getWeekInterval, getISOWeekInfo, getISOWeekRange } from '@jaeyeong/week-utils';
    const options = { timeZone: 'local' };
    const spring = getWeekInterval('2024-03-10', options);
    const fall = getWeekInterval('2024-11-03', options);
    assert.equal((spring.endExclusive - spring.start) / 3600000, 167);
    assert.equal((fall.endExclusive - fall.start) / 3600000, 169);
    assert.equal(spring.start.getHours(), 0);
    assert.equal(spring.endExclusive.getHours(), 0);
    assert.deepEqual(getISOWeekInfo(getISOWeekRange(2025, 1, options).start, options), { year: 2025, week: 1 });
  `);
});

test('skipped local calendar days fail explicitly instead of moving the range boundary', () => {
  runInZone('Pacific/Kwajalein', `
    import assert from 'node:assert/strict';
    import { getMonthWeekRange, getMonthWeek } from '@jaeyeong/week-utils';
    assert.throws(() => getMonthWeekRange(1993, 8, 3, { timeZone: 'local', weekStart: 'sunday' }), /does not exist/);
    assert.throws(() => getMonthWeek('1993-08-21', { timeZone: 'local' }), /does not exist/);
    assert.doesNotThrow(() => getMonthWeekRange(1993, 8, 3, { timeZone: 'KST', weekStart: 'sunday' }));
  `);
});

test('new options and numeric arguments are validated at runtime', () => {
  for (const timeZone of ['UTD', 'Asia/Seoul', 'kst', '', null, 9]) {
    for (const fn of [getMonthWeek, getISOWeek, getISOWeekYear, getISOWeekInfo, getWeekInterval]) {
      assert.throws(() => fn('2024-01-01', { timeZone }), /timeZone/);
    }
    assert.throws(() => getMonthWeeks(2024, 1, { timeZone }), /timeZone/);
    assert.throws(() => getISOWeekRange(2024, 1, { timeZone }), /timeZone/);
    assert.throws(() => isSameWeek('2024-01-01', '2024-01-02', { timeZone }), /timeZone/);
  }
  for (const options of [null, false, [], 4]) {
    assert.throws(() => getISOWeekInfo('2024-01-01', options), TypeError);
    assert.throws(() => getMonthWeeks(2024, 1, options), TypeError);
  }
  for (const value of [NaN, Infinity, 1.5, '2024', null, undefined]) {
    assert.throws(() => getISOWeeksInYear(value), /isoYear/);
    assert.throws(() => getWeeksInMonth(value, 1), /year/);
    assert.throws(() => getMonthWeeks(value, 1), /year/);
  }
  for (const value of [1, 'true', null]) {
    assert.throws(() => getMonthWeekRange(2024, 1, 1, { allowOverflow: value }), /allowOverflow/);
    assert.throws(() => getISOWeekRange(2024, 1, { allowOverflow: value }), /allowOverflow/);
  }
  assert.throws(() => isSameWeek('2024-01-01', '2024-02-30'), RangeError);
});

test('Date inputs and shared options remain unchanged across all new date APIs', () => {
  const input = new Date('2024-12-29T15:00:00Z');
  const timestamp = input.getTime();
  getISOWeekInfo(input, kst);
  getWeekInterval(input, kst);
  isSameWeek(input, input, kst);
  assert.equal(input.getTime(), timestamp);
  assert.deepEqual(kst, { timeZone: 'KST' });
});
