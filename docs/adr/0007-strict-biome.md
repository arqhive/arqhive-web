# 0007. 린트는 Biome을 최대한 엄격하게 쓴다

- 상태: 채택
- 날짜: 2026-10-03

## 맥락

- 혼자 만드는 프로젝트라 코드 리뷰어가 없다. 도구가 리뷰어 역할을 해야 한다.
- 운영자는 린트를 최대한 엄격하게 하기를 원한다.

## 결정

- 린트와 포맷은 **Biome 2.5** 하나로 한다(설정: `biome.jsonc`).
- **모든 규칙을 켠다**(`preset: all`). 그룹(a11y, complexity, correctness, performance, security, style, suspicious)은 전부 **오류**로 처리한다. 경고로 두면 쌓이기만 하기 때문이다.
- 실험 단계 규칙(nursery)은 오탐 위험이 있어 켜지 않는다.
- 규칙 묶음(domain)은 쓰는 기술(react, next, project, types, test, playwright, drizzle, tailwind, turborepo)을 전부 켜고, 쓰지 않는 프레임워크(solid, qwik, vue, svelte, astro, reactNative)는 끈다.
- **예외는 이유가 있을 때만**, 설정 파일에 이유를 주석으로 적는다. 현재 예외는 아래와 같다.

| 규칙 | 범위 | 이유 |
|---|---|---|
| `noBarrelFile` | 전체 | FSD는 조각마다 공개 창구(index.ts)로 다시 내보내기를 요구한다. 경계 검사는 Steiger가 맡는다 |
| `useImportExtensions` | 전체 | FSD 조각은 폴더 단위로 가져온다(`@/pages/home`). 상대 경로는 확장자를 직접 붙여 쓴다 |
| `noJsxLiterals` | 전체 | 다국어 계획이 없다. 화면 문구는 컴포넌트 옆에 두는 편이 읽기 쉽다 |
| Solid·Qwik 전용 규칙 | 전체 | 그룹을 오류로 켜면 domains에서 끈 규칙도 다시 켜진다. React JSX에 잘못 걸린다 |
| `noDefaultExport`, `useComponentExportOnlyModules` | `apps/web/app/**` | Next.js 라우팅 규약상 기본 내보내기와 `metadata` 내보내기가 필요하다 |
| `noDefaultExport` | 설정 파일, Workers 진입점 | 도구가 기본 내보내기를 읽는다 |
| `noMagicNumbers` | 테스트 | 기대값(상태 코드 등)은 숫자 그대로 적는 편이 읽기 쉽다 |
| `noTernary` | 전체 | 삼항 연산자는 React 조건부 렌더링·조건부 클래스의 기본 문법이다. 금지하면 더 읽기 어려운 우회 코드가 생긴다(2026-10-03 추가) |
| `noJsxPropsBind` | 전체 | React 공식 문서상 인라인 함수 자체는 문제가 아니다. 지키려면 모든 곳에 useCallback이 필요하다. 성능 문제가 측정되면 그 지점만 대응한다(2026-10-03 추가) |
| `noHexColors` | `apps/web/src/app/styles/globals.css` | 디자인 토큰을 정의하는 유일한 파일이다. 다른 곳에서는 색을 직접 쓰지 못하게 해서 토큰 사용을 강제한다(2026-10-03 추가) |

- 한 줄만 예외가 필요하면 `biome-ignore` 주석에 이유를 적는다(예: Hono의 `Bindings` 키 이름).
- TypeScript도 엄격하게 한다: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, `noUnusedLocals` 등.
- 커밋 전(lefthook)과 CI(`biome ci`)에서 검사한다.

## 검토한 대안

- **ESLint + Prettier**: 플러그인 생태계가 넓지만(예: FSD 경계, Next.js 전용 규칙) 설정 파일과 의존성이 많고 느리다. FSD 경계는 Steiger가, Next.js 전용 규칙은 Biome의 next 묶음이 일부 맡는다.
- **권장 규칙만 켜기**: 시작은 편하지만 리뷰어 역할로는 부족하다.

## 결과

- 코드 스타일과 흔한 실수가 자동으로 걸러진다.
- 처음 코드를 쓸 때 걸리는 규칙이 많다. 규칙을 끄고 싶을 때마다 이유를 적어야 한다.
- Biome에 없는 Next.js 전용 규칙 일부는 빠질 수 있다.
