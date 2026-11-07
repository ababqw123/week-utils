# Changelog

## 0.2.0

### Added

- Add `getISOWeekInfo`, `getWeeksInMonth`, `getISOWeeksInYear`, `getWeekInterval`, `isSameWeek`, and `getMonthWeeks`.
- Add explicit `timeZone: "UTC" | "KST" | "local"` options. KST is a fixed UTC+09:00 offset independent of the host time zone.
- Add exclusive-end week intervals and month calendar rows with both `end` and `endExclusive`.
- Export option/result types and test ESM and CommonJS TypeScript consumers in CI.

### Changed (migration required)

- Default all date calculations and returned ranges to UTC. Use `{ timeZone: "local" }` to request host-local behavior, or `{ timeZone: "KST" }` for Korean standard time.
- Interpret date-only and offset-free ISO strings in the selected time zone. Explicit offsets and Date objects represent absolute instants.
- Accept strict ISO date/datetime strings only; reject impossible calendar dates, ambiguous formats, invalid clock values, and offsets.
- Reject nonexistent month/ISO week numbers by default. Range functions accept `{ allowOverflow: true }` for the previous overflow behavior.
- Preserve the positional `"monday"` / `"sunday"` argument as a shorthand; its time zone now defaults to UTC.
- Reject skipped local calendar dates instead of silently moving a range boundary to another day.

See README's migration section before upgrading from 0.1.x.

## 0.1.3

- Reject non-integer/non-finite range arguments, unsupported date input types, and invalid week start options instead of silently coercing them or returning invalid dates.
- Preserve literal years 0 through 99 in month and ISO calculations, including ISO year transitions through year 0.
- Calculate local month range boundaries independently so midnight DST transitions do not shift the end of the week by an hour.
- Throw `RangeError` when a required date exceeds the JavaScript Date range.
- Add regression coverage for validation, historical years, date limits, midnight DST transitions, and the existing extra-week overflow behavior.
- Update the locked build dependencies `picomatch` and `rollup` to resolve known vulnerabilities; runtime dependencies remain empty.
- Document the input/error contracts and update release instructions now that trusted publishing is connected.

## 0.1.2

- Fix month week numbers to use the first day of the current month. Week 1 is the calendar row containing that day, consistent with `getMonthWeekRange`.
- Correct README examples and document local/UTC date behavior.
- Provide separate TypeScript declarations for ESM and CommonJS consumers.
- Add reproducible development dependencies, regression tests, CI, and npm publishing through GitHub Releases.
- Add the public repository links and MIT license file.

## 0.1.1

- Previously published npm version before the public GitHub repository was created.
