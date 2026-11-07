# @jaeyeong/week-utils

[![CI](https://github.com/ababqw123/week-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/ababqw123/week-utils/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@jaeyeong/week-utils.svg)](https://www.npmjs.com/package/@jaeyeong/week-utils)

월 주차(Month-based week)와 ISO-8601 주차(ISO week) 유틸리티 함수를 제공하는 TypeScript 라이브러리입니다.
런타임 의존성 없이 ESM, CommonJS, TypeScript 타입을 제공합니다.

## 설치

```bash
npm i @jaeyeong/week-utils
```

```ts
import { getMonthWeek, getISOWeek } from "@jaeyeong/week-utils";

getMonthWeek(new Date(2024, 0, 22)); // 4
getISOWeek(new Date(2024, 0, 22));   // 4
```

CommonJS에서는 `const { getMonthWeek } = require("@jaeyeong/week-utils")`로 사용합니다.

## 날짜와 주차 기준

- 월 주차는 해당 월의 **1일이 포함된 주를 1주차**로 계산합니다. 월 주차 범위에는 이전 달 또는 다음 달 날짜가 포함될 수 있습니다.
- 날짜를 받는 함수는 JavaScript의 `new Date(input)`으로 해석한 뒤 **실행 환경의 로컬 날짜**를 사용합니다.
- `"2024-01-22"` 같은 날짜 전용 문자열은 JavaScript에서 UTC 자정으로 해석되어, 일부 시간대에서는 로컬 날짜가 전날이 됩니다. 달력 날짜를 다룰 때는 `new Date(2024, 0, 22)`를 사용하세요. `Date` 생성자의 월은 0부터 시작합니다.
- `getMonthWeekRange`는 로컬 자정, `getISOWeekRange`는 **UTC 자정**의 `Date` 객체를 반환합니다. 종료일은 마지막 날의 자정이며, 하루의 마지막 시각이 아닙니다.
- 연도·월·주차에는 정수를 전달하세요. 범위 함수는 월 `1~12`, 월 주차 `1~6`, ISO 주차 `1~53` 범위를 검사하지만, 해당 월이나 ISO 연도에 그 주차가 실제로 존재하는지는 검사하지 않습니다.

## 기능

### 1. 월 주차 (Month-based week)

해당 월의 몇 주차인지 계산하고, 특정 주차의 날짜 범위를 구할 수 있습니다.

#### `getMonthWeek(dateInput, weekStart?)`

날짜를 받아서 해당 월의 몇 주차인지 반환합니다 (1~5/6).

**파라미터:**
- `dateInput`: `Date` 객체 또는 날짜 문자열
- `weekStart`: 주의 시작일 (`"monday"` | `"sunday"`), 기본값: `"monday"`

**반환값:** `number` (1~5/6)

**예시:**
```ts
import { getMonthWeek } from "@jaeyeong/week-utils";

getMonthWeek(new Date(2024, 0, 22)); // 4 (월요일 기준)
getMonthWeek(new Date(2024, 0, 28), "sunday"); // 5 (일요일 기준)
getMonthWeek(new Date(2024, 0, 15)); // 3
```

#### `getMonthWeekRange(year, month, weekNumber, weekStart?)`

연/월/주차를 받아서 해당 주차의 시작일과 종료일을 반환합니다.

**파라미터:**
- `year`: 연도 (예: 2024)
- `month`: 월 (1~12)
- `weekNumber`: 주차 (1~6)
- `weekStart`: 주의 시작일 (`"monday"` | `"sunday"`), 기본값: `"monday"`

**반환값:** `{ start: Date, end: Date }`

**예시:**
```ts
import { getMonthWeekRange } from "@jaeyeong/week-utils";

// 2024년 1월 4주차의 날짜 범위
const { start, end } = getMonthWeekRange(2024, 1, 4);
console.log(start); // 로컬 날짜 2024-01-22 (월요일)
console.log(end);   // 로컬 날짜 2024-01-28 (일요일)

// 일요일 기준으로 계산
const { start: sunStart, end: sunEnd } = getMonthWeekRange(2024, 1, 4, "sunday");
console.log(sunStart); // 로컬 날짜 2024-01-21 (일요일)
console.log(sunEnd);   // 로컬 날짜 2024-01-27 (토요일)
```

### 2. ISO 주차 (ISO-8601 week)

ISO 8601 표준에 따른 연간 주차를 계산합니다. ISO 주차는 월요일을 주의 시작으로 하며, 연말/연초에 ISO 주차 연도가 바뀔 수 있습니다.

#### `getISOWeekYear(dateInput)`

ISO week-year를 구합니다. 연말/연초에 ISO 주차 연도가 바뀔 수 있습니다.

**파라미터:**
- `dateInput`: `Date` 객체 또는 날짜 문자열

**반환값:** `number` (ISO week-year)

**예시:**
```ts
import { getISOWeekYear } from "@jaeyeong/week-utils";

getISOWeekYear(new Date(2024, 0, 1)); // 2024
getISOWeekYear(new Date(2023, 11, 31)); // 2023
getISOWeekYear(new Date(2021, 0, 1)); // 2020 (2020년 ISO 53주차)
```

#### `getISOWeek(dateInput)`

ISO week number를 반환합니다 (1~52/53).

**파라미터:**
- `dateInput`: `Date` 객체 또는 날짜 문자열

**반환값:** `number` (1~52/53)

**예시:**
```ts
import { getISOWeek } from "@jaeyeong/week-utils";

getISOWeek(new Date(2024, 0, 28)); // 4
getISOWeek(new Date(2024, 0, 1)); // 1
```

#### `getISOWeekRange(isoYear, isoWeek)`

ISO year/week를 받아서 해당 주의 시작일(월요일)과 종료일(일요일)을 반환합니다.

**파라미터:**
- `isoYear`: ISO week-year
- `isoWeek`: ISO week number (1~53)

**반환값:** `{ start: Date, end: Date }`

**예시:**
```ts
import { getISOWeekRange } from "@jaeyeong/week-utils";

// 2024년 ISO 4주차의 날짜 범위
const { start, end } = getISOWeekRange(2024, 4);
console.log(start.toISOString()); // 2024-01-22T00:00:00.000Z (월요일)
console.log(end.toISOString());   // 2024-01-28T00:00:00.000Z (일요일)
```

## 전체 예시

```ts
import {
  getMonthWeek,
  getMonthWeekRange,
  getISOWeek,
  getISOWeekYear,
  getISOWeekRange,
  type WeekStart,
} from "@jaeyeong/week-utils";

// 월 주차
const week = getMonthWeek(new Date(2024, 0, 22)); // 4
const { start, end } = getMonthWeekRange(2024, 1, 4);

// ISO 주차
const isoWeek = getISOWeek(new Date(2024, 0, 28)); // 4
const isoYear = getISOWeekYear(new Date(2024, 0, 1)); // 2024
const { start: isoStart, end: isoEnd } = getISOWeekRange(2024, 4);
```

## 타입

```ts
type WeekStart = "monday" | "sunday";
```

## 라이선스

[MIT](./LICENSE)

## 개발과 배포

개발 환경은 Node.js 22 이상과 npm을 사용합니다. CI는 Node.js 22/24, Windows/Linux, UTC/서울/뉴욕 시간대에서 검증합니다.

```bash
npm ci
npm run check
npm pack --dry-run
```

- `npm run build`: CommonJS, ESM, 타입 선언을 `dist/`에 생성합니다.
- `npm test`: 빌드한 패키지의 공개 API를 테스트합니다.
- `npm run check`: 타입 검사와 테스트를 실행합니다.

버그 제보와 기여 방법은 [CONTRIBUTING.md](./CONTRIBUTING.md), npm 자동 배포 설정과 릴리스 절차는 [RELEASING.md](./RELEASING.md)를 참고하세요.
