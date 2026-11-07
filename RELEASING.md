# npm 자동 배포

GitHub의 정식 Release를 게시하면 `.github/workflows/publish.yml`이 타입 검사와 테스트를 통과한 버전을 npm에 공개 배포합니다. 일반 커밋과 pull request는 CI만 실행합니다. 사전 릴리스는 이 워크플로에서 배포하지 않습니다.

## 최초 연결: npm Trusted Publisher

패키지 소유자가 [npm 패키지 설정](https://www.npmjs.com/package/@jaeyeong/week-utils/access)에서 **Trusted publishing → GitHub Actions**를 추가합니다.

| 설정 | 값 |
| --- | --- |
| Organization or user | `ababqw123` |
| Repository | `week-utils` |
| Workflow filename | `publish.yml` |
| Environment name | 비워 둠 |
| Allowed actions | `npm publish` 직접 게시 허용 |

GitHub Actions는 OIDC로 인증하므로 `NPM_TOKEN`을 저장할 필요가 없습니다. 최초 연결은 npm 웹사이트의 계정 인증이 필요합니다. 새 연결은 2일 이내 첫 배포에 성공해야 하며, 만료되면 다시 등록합니다. 자세한 조건은 [npm 공식 문서](https://docs.npmjs.com/trusted-publishers/)를 참고하세요.

이 저장소는 `v0.1.2`의 자동 배포로 연결을 검증했습니다. 연결을 삭제하거나 워크플로 이름을 바꾸지 않았다면 매 릴리스마다 다시 설정할 필요가 없습니다.

## 릴리스

1. 변경 사항과 `CHANGELOG.md`를 커밋하고 CI 통과를 확인합니다.
2. 버전과 태그를 생성하고 GitHub에 올립니다.

   ```bash
   npm version patch
   git push origin main --follow-tags
   ```

3. GitHub Releases에서 생성된 `vX.Y.Z` 태그로 정식 릴리스를 게시합니다. 릴리스 설명에는 `CHANGELOG.md`의 해당 버전 내용을 사용합니다.
4. Actions의 **Publish to npm** 성공과 npm의 새 버전을 확인합니다. npm이 게시를 접수한 뒤 조회와 설치에 반영되기까지 몇 분 걸릴 수 있습니다.

   ```bash
   npm view @jaeyeong/week-utils version --prefer-online
   ```

워크플로는 릴리스 태그와 `package.json`의 버전이 같은지, 릴리스 커밋이 `main`에 포함되어 있는지 확인합니다. 빌드 결과와 소스 출처 정보(provenance)를 함께 게시합니다. npm은 같은 버전을 다시 게시할 수 없으므로, 이미 게시한 버전은 새 버전으로 올려야 합니다.

인증 설정 문제로 실패했다면 Trusted Publisher 값을 확인한 뒤 실패한 워크플로를 재실행합니다. 실제 npm 게시가 이미 완료된 실행은 재실행하지 않습니다.
