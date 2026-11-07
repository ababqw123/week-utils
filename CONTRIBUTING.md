# 기여 안내

버그는 [GitHub Issues](https://github.com/ababqw123/week-utils/issues)에 입력 날짜, 기대한 결과, 실제 결과, 실행 환경의 시간대와 Node.js 버전을 함께 남겨 주세요.

## 개발

Node.js 22 이상을 설치하고 다음 명령을 실행합니다.

```bash
npm ci
npm run check
```

소스는 `src/index.ts`, 회귀 테스트는 `test/week-utils.test.mjs`에 있습니다. 날짜 계산 변경에는 월 경계, 연도 경계, 윤년, 월요일/일요일 시작 조건을 검증하는 테스트를 추가해 주세요. 입력 `Date` 객체를 변경하지 않아야 합니다.

`dist/`와 `node_modules/`는 커밋하지 않습니다. 의존성을 변경한 경우 `package.json`과 `package-lock.json`을 함께 커밋합니다.

Pull request를 제출하면 GitHub Actions에서 타입 검사, 빌드, 테스트를 실행합니다. 배포 절차는 [RELEASING.md](./RELEASING.md)에 정리되어 있습니다.
