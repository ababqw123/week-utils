# @jaeyeong/week-utils

[![CI](https://github.com/ababqw123/week-utils/actions/workflows/ci.yml/badge.svg)](https://github.com/ababqw123/week-utils/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@jaeyeong/week-utils.svg)](https://www.npmjs.com/package/@jaeyeong/week-utils)

월 주차와 ISO 8601 주차를 계산하는 TypeScript 라이브러리입니다. **UTC를 기본값**으로 사용하며, 옵션으로 **KST(한국 표준시)** 또는 실행 환경의 로컬 시간대를 선택할 수 있습니다. 런타임 의존성 없이 ESM, CommonJS, 타입 선언을 제공합니다.

> 0.2.0은 기본 시간대와 문자열 해석이 변경되었습니다. 0.1.x 사용자는 아래 마이그레이션 안내를 확인하세요.

## 설치

```bash
npm install @jaeyeong/week-utils
```

## 빠른 시작: UTC와 한국 시간

```ts
import { getISOWeekInfo, getMonthWeek, getWeekInterval } from "@jaeyeong/week-utils";

const instant = "2024-12-29T15:00:00Z"; // UTC 일요일 / KST 월요일 00:00

getISOWeekInfo(instant);                      // { year: 2024, week: 52 }
getISOWeekInfo(instant, { timeZone: "KST" }); // { year: 2025, week: 1 }

getMonthWeek("2024-01-22", { timeZone: "KST" }); // 4
getMonthWeek("2024-01-28", { timeZone: "KST", weekStart: "sunday" }); // 5

const { start, endExclusive } = getWeekInterval("2024-01-10", { timeZone: "KST" });
start.toISOString();        // "2024-01-07T15:00:00.000Z" = KST 1/8 월요일 00:00
endExclusive.toISOString(); // "2024-01-14T15:00:00.000Z" = KST 1/15 월요일 00:00
```

CommonJS에서는 `const { getISOWeekInfo } = require("@jaeyeong/week-utils")`로 사용합니다.

## 옵션과 날짜 입력

```ts
type TimeZone = "UTC" | "KST" | "local";
type WeekStart = "monday" | "sunday";

interface DateOptions {
  timeZone?: TimeZone; // 기본값 UTC
}

interface WeekOptions extends DateOptions {
  weekStart?: WeekStart; // 기본값 monday
}
```

| timeZone | 기준 |
| --- | --- |
| `"UTC"` | UTC 날짜와 자정. 기본값이며 호스트 설정에 영향을 받지 않습니다. |
| `"KST"` | 고정 UTC+09:00의 날짜와 자정. 해외 서버에서도 동일한 한국 표준시 결과를 냅니다. |
| `"local"` | 실행 환경의 시간대. 서머타임과 역사적인 시간대 변경을 따릅니다. |

`KST`는 고정 오프셋입니다. 과거 한국의 UTC+08:30 또는 서머타임 같은 `Asia/Seoul`의 역사적 규칙을 재현하는 옵션은 아닙니다. 임의의 IANA 시간대 이름은 받지 않습니다.

| 입력 | 해석 |
| --- | --- |
| `Date` 객체 | 해당 순간을 선택한 시간대의 날짜로 변환 |
| `"2024-01-08"` | 선택한 시간대의 1월 8일 |
| `"2024-01-08T00:00"` | 선택한 시간대의 1월 8일 00:00 |
| `"2024-01-08T00:00:00+09:00"` | 오프셋이 지정한 순간을 선택한 시간대로 변환 |
| `"2024-01-07T15:00:00Z"` | UTC 순간을 선택한 시간대로 변환 |

문자열은 `YYYY-MM-DD`와 `YYYY-MM-DDTHH:mm[:ss[.SSS]][Z 또는 ±HH:mm]` 형식만 받습니다. 초는 생략 가능하고, 소수 초는 1~3자리입니다. 확장 연도는 부호와 6자리(`+010000`, `-000001`)로 지정합니다.

- `"2024-02-30"`, `"2023-02-29"`처럼 존재하지 않는 날짜는 `RangeError`를 발생시킵니다.
- `01/02/2024`, 공백을 포함한 문자열, `24:00`, 윤초 `:60`은 허용하지 않습니다.
- `new Date(2024, 0, 8)` 자체는 **호스트의 로컬 시간**으로 생성됩니다. 달력 날짜를 지정하려면 `"2024-01-08"` 문자열이 명확합니다.
- 입력 `Date`와 옵션 객체는 변경하지 않습니다.
- 숫자로 받는 연도·월·주차는 유한한 정수여야 합니다. 월은 1~12이며, 연도 0~99도 해당 연도 그대로 계산합니다.

반환된 `Date`는 실제 순간을 나타냅니다. `toISOString()`은 항상 UTC의 `Z` 표기이므로 KST 자정은 전날 `15:00Z`로 보이는 것이 정상입니다. 화면에서 한국 날짜로 표시하려면 다음처럼 포맷합니다.

```ts
new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "medium",
  timeStyle: "short",
}).format(start);
```

## 함수

### getMonthWeek(dateInput, options?) → number

월의 **1일이 포함된 주를 1주차**로 계산합니다. 결과는 1~6입니다.

```ts
getMonthWeek("2024-01-22"); // 4, UTC / 월요일 시작
getMonthWeek("2024-01-28", { weekStart: "sunday", timeZone: "KST" }); // 5
getMonthWeek("2024-01-28", "sunday"); // 5, 기존 문자열 인자도 지원 / UTC
```

### getWeeksInMonth(year, month, options?) → number

한 달을 표시하는 데 필요한 주차 수(달력 행 수) 4~6을 반환합니다. 옵션은 `{ weekStart }` 또는 기존 문자열 형태입니다. 연·월 숫자로 결정되는 개수이므로 시간대 옵션은 필요하지 않습니다.

```ts
getWeeksInMonth(2021, 2); // 4
getWeeksInMonth(2021, 2, { weekStart: "sunday" }); // 5
getWeeksInMonth(2024, 9); // 6
```

### getMonthWeekRange(year, month, weekNumber, options?) → { start, end }

선택한 주의 첫날 시작과 마지막 날 시작을 반환합니다. 범위에는 이전·다음 달 날짜가 포함될 수 있습니다. 옵션은 `WeekOptions`와 `allowOverflow?: boolean`입니다.

```ts
const range = getMonthWeekRange(2024, 1, 4, { timeZone: "KST" });
range.start.toISOString(); // "2024-01-21T15:00:00.000Z" = KST 1/22 00:00
range.end.toISOString();   // "2024-01-27T15:00:00.000Z" = KST 1/28 00:00

getMonthWeekRange(2021, 2, 6); // RangeError: 해당 월에 없는 주차
getMonthWeekRange(2021, 2, 6, { allowOverflow: true }); // UTC 3/8 ~ 3/14
```

`end`는 마지막 날 전체를 포함하는 시각이 아닙니다. 데이터 조회에는 `getWeekInterval`의 `endExclusive`를 사용하세요.

### getMonthWeeks(year, month, options?) → MonthWeek[]

월 달력의 모든 주차를 반환합니다. 옵션은 `WeekOptions`이며 각 항목은 `{ week, start, end, endExclusive }`입니다. 모든 범위는 완전한 달력 주 단위이며 이전·다음 달 날짜를 자르지 않습니다.

```ts
const weeks = getMonthWeeks(2024, 9, { timeZone: "KST" });
weeks.length; // 6
weeks[0].week; // 1
// 첫 주: KST 8/26 ~ 9/1, endExclusive는 KST 9/2 00:00
// 마지막 주: KST 9/30 ~ 10/6, endExclusive는 KST 10/7 00:00
```

### getISOWeekInfo(dateInput, options?) → { year, week }

ISO 주차 연도와 주 번호를 한 번에 반환합니다. 연말·연초에는 날짜의 연도와 ISO 주차 연도가 다를 수 있습니다. 옵션은 `DateOptions`입니다.

```ts
getISOWeekInfo("2021-01-01"); // { year: 2020, week: 53 }
getISOWeekInfo("2024-12-29T15:00:00Z", { timeZone: "KST" }); // { year: 2025, week: 1 }
```

### getISOWeek(dateInput, options?) → number

ISO 주 번호 1~52/53을 반환합니다. 옵션은 `DateOptions`입니다.

```ts
getISOWeek("2021-01-01"); // 53
```

### getISOWeekYear(dateInput, options?) → number

ISO 주차 연도를 반환합니다. 옵션은 `DateOptions`입니다.

```ts
getISOWeekYear("2021-01-01"); // 2020
```

### getISOWeeksInYear(isoYear) → number

ISO 주차 연도에 속하는 주의 개수 52 또는 53을 반환합니다. 숫자로 지정한 ISO 연도 자체의 속성이므로 시간대 옵션은 없습니다.

```ts
getISOWeeksInYear(2020); // 53
getISOWeeksInYear(2021); // 52
```

### getISOWeekRange(isoYear, isoWeek, options?) → { start, end }

월요일 시작부터 일요일 시작까지를 선택한 시간대의 `Date`로 반환합니다. ISO 주는 항상 월요일부터 시작합니다. 옵션은 `DateOptions`와 `allowOverflow?: boolean`입니다.

```ts
const options = { timeZone: "KST" } as const;
const range = getISOWeekRange(2025, 1, options);
getISOWeekInfo(range.start, options); // { year: 2025, week: 1 }
getISOWeekInfo(range.end, options);   // { year: 2025, week: 1 }

getISOWeekRange(2021, 53); // RangeError: 2021년은 ISO 52주까지
getISOWeekRange(2021, 53, { allowOverflow: true }); // UTC 2022-01-03 ~ 2022-01-09
```

### getWeekInterval(dateInput, options?) → { start, endExclusive }

입력 날짜를 포함하는 주의 시작과 **다음 주 시작**을 반환합니다. 옵션은 `WeekOptions`입니다. 주간 데이터 필터링에 적합합니다.

```ts
const { start, endExclusive } = getWeekInterval("2024-01-10", { timeZone: "KST" });
const eventsInWeek = events.filter(event => {
  const date = new Date(event.createdAt);
  return start <= date && date < endExclusive;
});
```

`local`의 서머타임 전환 주는 168시간보다 짧거나 길 수 있습니다. 달력 날짜 기준으로 계산하므로 마지막 날의 데이터도 포함됩니다.

### isSameWeek(a, b, options?) → boolean

두 입력이 같은 주에 속하는지 확인합니다. 옵션은 `WeekOptions`이며 월·연도가 달라도 같은 주일 수 있습니다.

```ts
isSameWeek("2024-12-30", "2025-01-05"); // true
isSameWeek("2024-01-07", "2024-01-08"); // false
isSameWeek("2024-01-07", "2024-01-08", { weekStart: "sunday", timeZone: "KST" }); // true
```

## 오류와 범위

- 잘못된 입력 타입, 시간대, 주 시작일, 옵션 타입은 `TypeError`를 발생시킵니다.
- 존재하지 않는 날짜, 정수가 아닌 숫자, 허용 범위를 벗어난 월·주차, 표현 범위를 벗어난 날짜는 `RangeError`를 발생시킵니다.
- 범위 함수는 기본적으로 실제 존재하는 주차만 허용합니다. `allowOverflow: true`이면 월 주차 1~6, ISO 주차 1~53까지 이전 버전처럼 계산합니다.
- `local`에서 자정만 사라진 경우 JavaScript의 서머타임 보정 시각을 사용합니다. 날짜 하루 전체가 사라진 경우에는 다음 날로 넘기지 않고 `RangeError`를 발생시킵니다.
- 입력과 계산에 필요한 중간 날짜 모두 JavaScript `Date`의 표현 범위 안에 있어야 합니다.

## 0.1.x에서 0.2.0으로 마이그레이션

1. `getMonthWeek`, `getMonthWeekRange`, `getISOWeek`, `getISOWeekYear`의 기본 기준이 로컬에서 **UTC**로 변경되었습니다. 한국 기준이면 `{ timeZone: "KST" }`, 기존 호스트 기준이면 `{ timeZone: "local" }`을 명시하세요. `getISOWeekRange`의 기존 UTC 기본값은 유지됩니다.
2. `"monday"` / `"sunday"` 위치 인자는 계속 지원합니다. 시간대도 지정하려면 `{ weekStart: "sunday", timeZone: "KST" }`로 바꾸세요.
3. 날짜 전용 문자열과 오프셋 없는 날짜·시각 문자열은 선택한 시간대의 달력 값으로 해석합니다. 기존 문자열이 나타내던 절대 시각을 유지하려면 `Z`나 `±HH:mm`을 명시하거나 `Date` 객체를 전달하세요.
4. JavaScript가 임의로 해석하던 비 ISO 문자열과 잘못된 날짜의 자동 보정은 지원하지 않습니다.
5. 존재하지 않는 주차를 넘겨 다음 달·연도의 범위를 얻던 코드는 `{ allowOverflow: true }`를 명시하세요.
6. `{ start, end }`의 `end`는 계속 마지막 날의 시작입니다. 전체 주간 데이터를 조회할 때는 새 `{ start, endExclusive }` API로 변경하세요.

## 개발

Node.js 22 이상과 npm을 사용합니다.

```bash
npm ci
npm run check
npm pack --dry-run
```

- `npm run build`: CommonJS, ESM, 타입 선언을 `dist/`에 생성
- `npm test`: 공개 API, 시간대 경계, 서머타임, 입력 검증 테스트
- `npm run test:types`: ESM/CommonJS 사용자의 TypeScript 타입 검사
- `npm run check`: 소스 타입 검사, 빌드와 테스트, 사용자 타입 검사를 모두 실행

CI는 Node.js 22/24, Windows/Linux에서 실행합니다. 별도 프로세스에서 호스트 시간대를 바꿔도 UTC/KST 결과가 같다는 것을 검증합니다.

[기여 안내](https://github.com/ababqw123/week-utils/blob/main/CONTRIBUTING.md) · [릴리스 절차](https://github.com/ababqw123/week-utils/blob/main/RELEASING.md) · [변경 내역](https://github.com/ababqw123/week-utils/blob/main/CHANGELOG.md)

## 라이선스

[MIT](./LICENSE)
