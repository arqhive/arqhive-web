# 공부해 볼 것 (1단계 진행 중 기준)

> 커밋마다 새로 등장한 도구·개념을 더합니다. 맨 아래 "갱신 기록"에 무엇이 추가됐는지 적습니다.

프론트엔드 경력 8년을 전제로, **이미 익숙할 부분은 빼고** 이 저장소에서 새로 만나는 도구와 개념만 골랐습니다.

- ★★★ 지금 코드에 있고, 이해해야 다음 단계를 따라갈 수 있는 것
- ★★ 지금 코드에 있지만 쓰면서 익혀도 되는 것
- ★ 다음 단계에서 만날 것(미리 훑어 두면 좋은 것)

---

## 1. 모노레포와 패키지 관리

### pnpm workspaces ★★★
- **볼 것**: `pnpm-workspace.yaml`, 각 `package.json`의 `"workspace:*"`
- **핵심**
  - `workspace:*`는 "npm에서 받지 말고 이 저장소 안의 패키지를 연결하라"는 뜻입니다.
  - pnpm은 패키지를 한 곳에 저장하고 링크로 연결합니다. 그래서 `package.json`에 적지 않은 패키지는 가져다 쓸 수 없습니다(유령 의존성 차단).
  - `onlyBuiltDependencies`: pnpm 10부터 설치 스크립트(postinstall)를 기본으로 막습니다. 허용 목록에 있는 것만 실행합니다(공급망 공격 대비).
  - `pnpm --filter @arqhive/web <명령>`으로 특정 패키지에서만 실행합니다.
- **문서**: https://pnpm.io/workspaces

### Turborepo ★★★
- **볼 것**: `turbo.jsonc`
- **핵심**
  - `tasks`는 각 패키지의 같은 이름 스크립트를 묶어 실행합니다.
  - `dependsOn: ["^build"]`의 `^`는 "내가 의존하는 패키지의 build를 먼저"라는 뜻입니다.
  - **캐시**: 입력(파일, 환경 변수)이 같으면 다시 실행하지 않고 저장한 결과를 되살립니다. 로그 끝의 `FULL TURBO`가 그 표시입니다.
  - `outputs`는 캐시에 담을 결과물입니다.
- **문서**: https://turborepo.com/docs

### 빌드 없는 내부 패키지 ★★
- **볼 것**: `packages/shared/package.json`의 `"exports": { ".": "./src/index.ts" }`, `apps/web/next.config.ts`의 `transpilePackages`
- **핵심**: npm에 배포하지 않을 패키지는 `dist/`로 빌드하지 않고 TS 원본을 그대로 내보낼 수 있습니다. 대신 쓰는 쪽이 컴파일할 줄 알아야 합니다(Next.js는 `transpilePackages`, wrangler는 esbuild가 자동으로 처리).
- **문서**: Turborepo의 "Internal Packages" 문서

### package.json 읽는 법 (이 저장소 기준) ★★

| 항목 | 의미 |
|---|---|
| `"private": true` | 실수로 npm에 배포되지 않게 막습니다 |
| `"packageManager": "pnpm@10.34.6"` | 이 저장소에서 쓸 패키지 관리자 버전입니다. CI와 Corepack이 이걸 읽습니다 |
| `"engines": { "node": ">=24" }` | 필요한 Node 버전입니다 |
| `"type": "module"` | `.js` 파일을 ES 모듈(import/export)로 봅니다 |
| `"exports"` | 패키지 바깥에 공개할 진입점입니다. 여기에 없는 경로는 가져다 쓸 수 없습니다 |
| `"scripts"` | `pnpm <이름>`으로 실행하는 명령입니다. Turborepo는 이 이름으로 작업을 묶습니다 |
| `"prepare": "lefthook install"` | `pnpm install` 뒤에 자동으로 실행됩니다. git hook을 설치합니다 |
| 버전에 `^`가 없음 | 정확한 버전으로 고정했습니다. 업데이트는 Renovate PR로만 합니다 |

## 2. TypeScript

### 엄격한 tsconfig 옵션 ★★★
- **볼 것**: `packages/tsconfig/base.json`(옵션마다 주석 있음)
- **특히 볼 것**
  - `noUncheckedIndexedAccess`: `arr[0]`이 `T | undefined`가 됩니다. 처음엔 귀찮지만 실제 버그를 많이 막습니다.
  - `exactOptionalPropertyTypes`: `{ a?: string }`에 `a: undefined`를 넣을 수 없습니다.
  - `verbatimModuleSyntax`: 타입은 `import type`으로만 가져옵니다.
  - `moduleResolution: "Bundler"`: Node 방식이 아니라 번들러 방식으로 import를 해석합니다.
- **문서**: https://www.typescriptlang.org/tsconfig

### `as const`, `satisfies`, `z.infer` ★★★
- **볼 것**: `packages/shared/src/platform.ts`
- **핵심**: 값 목록 하나에서 **실행 중 검사(Zod)와 타입을 함께** 만들어 내는 패턴입니다. 앞으로 제보 입력, MDX frontmatter, API 응답에서 계속 씁니다.
- **문서**: TS 핸드북의 `satisfies` 연산자, https://zod.dev

### TypeScript 7(네이티브 컴파일러) ★
- 이 저장소는 일부러 6.0을 씁니다(ADR 0003). 7은 Go로 다시 만든 컴파일러라 매우 빠르지만, 도구가 쓰는 기존 TS API가 없습니다. 생태계가 따라오는 과정을 지켜볼 만합니다.

## 3. Next.js 16 (App Router)

이미 익숙할 수 있지만, 이 저장소에서 쓰는 부분만 짚습니다.

- **라우트 그룹 `(site)`** ★★: 주소에 나타나지 않는 폴더입니다. 레이아웃을 묶는 데 씁니다.
- **서버 컴포넌트 기본** ★★: `'use client'`가 없으면 서버에서만 실행되고 JS가 내려가지 않습니다.
- **`metadata` 내보내기** ★: `<head>` 내용을 선언적으로 정합니다.
- **`typedRoutes`, `next typegen`** ★★: 없는 주소로 링크하면 타입 오류가 납니다. 라우트 타입은 `next typegen`이 만듭니다.
- **정적 생성** ★★: 데이터 요청이 없는 페이지는 빌드 때 HTML로 만들어 둡니다(빌드 로그의 `○`).
- **Turbopack** ★: Next.js 16의 기본 번들러입니다.
- **문서**: https://nextjs.org/docs

## 4. FSD (Feature-Sliced Design) ★★★

- **볼 것**: `apps/web/src/README.md`, `apps/web/pages/README.md`, ADR 0006
- **핵심 개념 세 가지**
  - **층(layer)**: `app → pages → widgets → features → entities → shared`. 위는 아래만 가져다 씁니다.
  - **조각(slice)**: 층 안을 업무 단위로 나눈 것입니다(예: `pages/home`, `features/report-submit`). 같은 층의 조각끼리는 서로 모릅니다.
  - **칸(segment)**: 조각 안을 용도로 나눈 것입니다(`ui`, `model`, `api`, `lib`, `config`).
- **공개 창구(public API)**: 조각마다 `index.ts`로만 바깥에 공개합니다.
- **가장 헷갈리는 판단**: "이건 feature인가 entity인가?"
  - entity = **명사**(작품, 제보). 데이터와 그 표시
  - feature = **사용자 행동**(제보하기, 기종 거르기). 버튼·폼·상호작용
  - 판단이 애매하면 ADR로 남깁니다.
- **Next.js와 함께 쓰기**: `app`, `pages` 이름 충돌 처리(이 저장소의 방식)
- **Steiger**: FSD 규칙을 검사하는 린터입니다. 일부러 규칙을 어겨 보고 오류 메시지를 읽어 보면 빨리 익힙니다(예: shared에서 pages를 import해 보기).
- **문서**: https://feature-sliced.design, https://github.com/feature-sliced/steiger

## 5. 백엔드: Hono와 Cloudflare Workers

### Cloudflare Workers ★★★
- **볼 것**: `apps/api/wrangler.jsonc`, `apps/api/src/index.ts`
- **핵심**
  - **실행 모델**: 서버를 계속 켜 두지 않습니다. 요청마다 전 세계 거점에서 가벼운 V8 isolate가 코드를 실행합니다. Node.js가 아니어서 `fs` 같은 API가 없거나 제한됩니다(`nodejs_compat`로 일부 지원).
  - **진입점**: 기본 내보내기의 `fetch`(HTTP), `queue`(큐), `scheduled`(Cron)
  - **바인딩(bindings)**: DB 주소, 큐, AI 같은 외부 자원을 코드에 넣지 않고 설정(wrangler.jsonc)으로 연결합니다. 코드에서는 `env`로 받습니다.
  - **`compatibility_date`**: 런타임 동작 기준일입니다. 배포해도 동작이 갑자기 바뀌지 않게 합니다.
  - **무료 플랜 한도**: 요청당 CPU 10ms, 하루 10만 요청. 이 한도가 설계에 영향을 줬습니다(ADR 0004의 비밀번호 해시 문제).
  - **wrangler**: `wrangler dev`(로컬 실행), `wrangler types`(Env 타입 생성), `wrangler deploy`(배포)
- **문서**: https://developers.cloudflare.com/workers/

### Hono ★★★
- **볼 것**: `apps/api/src/app.ts`, `modules/health/health.route.ts`, `test/health.test.ts`
- **핵심**
  - Express와 비슷한 라우터지만 Web 표준(`Request`/`Response`) 위에서 동작해서 Workers, Node, Bun 어디서나 실행됩니다.
  - **메서드 체이닝과 타입**: `.route()`를 이어 붙여야 `typeof app`에 모든 경로 타입이 쌓입니다. 3단계에서 이 타입으로 **Hono RPC 클라이언트**를 만들어 web에서 자동완성되는 API 호출을 합니다.
  - **`app.request()`**: 서버 없이 앱에 요청을 보내 테스트합니다.
- **문서**: https://hono.dev/docs

### 백엔드 기초 개념 (다음 단계 대비) ★
- HTTP 상태 코드와 REST 설계, 입력 검증(Zod)과 오류 응답 형식
- **멱등성과 재시도**: 큐는 같은 메시지를 두 번 보낼 수 있습니다(at-least-once). 이슈가 두 번 생기지 않게 설계해야 합니다(4단계).
- **아웃박스 패턴**: 알림을 DB(`notifications`)에 먼저 쓰고 보내는 방식이 이 패턴의 단순한 형태입니다(ADR 0005).
- **요청 제한(rate limiting)** 알고리즘: 고정 창, 슬라이딩 창, 토큰 버킷
- **비밀값 관리**: 토큰을 코드·로그·브라우저에 남기지 않기(`wrangler secret`)

## 6. 코드 품질 도구

### Biome ★★
- **볼 것**: `biome.jsonc`(예외마다 주석), ADR 0007
- **핵심**: 린트 + 포맷을 한 도구로 합니다. `preset`, 규칙 그룹, `domains`(프레임워크별 규칙 묶음), `overrides`(경로별 예외), `biome-ignore` 주석(한 줄 예외)
- **해 볼 것**: 오류가 난 규칙은 `pnpm biome explain <규칙이름>`으로 설명과 예시를 읽어 보세요. 예: `pnpm biome explain noNonNullAssertion`
- **문서**: https://biomejs.dev

### Vitest ★★
- Jest와 거의 같은 API입니다. 4단계부터 `@cloudflare/vitest-pool-workers`로 **실제 Workers 환경**에서 테스트합니다.
- **문서**: https://vitest.dev

### lefthook ★
- git hook(커밋 전·푸시 전 자동 실행)을 관리합니다. `lefthook.yml`의 `stage_fixed: true`는 Biome이 고친 파일을 다시 커밋에 담습니다.
- **문서**: https://github.com/evilmartians/lefthook

## 7. CI/CD와 저장소 운영

### GitHub Actions ★★★
- **볼 것**: `.github/workflows/ci.yml`(줄마다 주석)
- **핵심**: `on`(언제), `jobs`/`steps`(무엇을), `concurrency`(중복 취소), `permissions`(최소 권한), `actions/cache`(캐시)
- **해 볼 것**: 첫 푸시 뒤 GitHub 저장소의 Actions 탭에서 실행 로그를 단계별로 펼쳐 보세요.
- **문서**: https://docs.github.com/actions

### Renovate ★
- 의존성 업데이트 PR을 자동으로 만듭니다. `renovate.json`에 묶음 규칙과 버전 상한(TS 7, Vitest 5 막기)을 두었습니다.
- **문서**: https://docs.renovatebot.com

### 줄바꿈(LF/CRLF)과 `.gitattributes` ★
- 윈도우 git은 줄바꿈을 CRLF로 바꾸려 합니다. `.gitattributes`의 `eol=lf`로 저장소 안에서는 LF를 유지합니다. 여러 OS에서 협업할 때 흔한 함정입니다.

### ADR ★★
- `docs/adr/`. 결정의 이유와 버린 대안을 남기는 습관은 면접에서 설계 판단을 설명할 때 그대로 쓰입니다.

## 8. 1단계에서 새로 등장한 것

### 콘텐츠: MDX · frontmatter · Velite ★★★
- **볼 것**: `content/patches/star-fox-assault/index.mdx`, `packages/content/velite.config.ts`
- **핵심**
  - **MDX**: 마크다운 안에 JSX 컴포넌트를 쓸 수 있는 형식입니다. `{`, `<`가 코드로 해석되므로 본문에 그대로 쓰면 오류가 납니다(`\{`, `&lt;`로 씁니다).
  - **frontmatter**: 파일 맨 위 `---` 사이의 YAML 데이터입니다. 제목, 기종, 버전 같은 "구조화된 정보"를 여기에 둡니다. YAML 주석(`# 확인 필요`)도 쓸 수 있습니다.
  - **Velite**: frontmatter를 Zod 스키마로 검사하고, 타입이 붙은 JSON + `.d.ts`로 내보냅니다. "콘텐츠도 타입 검사를 받는다"가 핵심입니다.
  - **Velite의 Zod는 3판**입니다(`s`). 우리 `shared`는 Zod 4라서 스키마 객체를 섞지 않고 값 목록(`PLATFORMS`)만 공유합니다. 라이브러리가 의존성을 안에 묶어 배포할 때 생기는 버전 차이의 예입니다.
- **해 볼 것**: 작품 MDX의 `platform`을 틀린 값으로 바꾸고 `pnpm --filter @arqhive/content build`를 실행해 오류 메시지를 읽어 보세요.
- **문서**: https://velite.js.org, https://mdxjs.com

### 디자인 토큰: Tailwind v4 `@theme` · CSS 변수 · 화면 모드 ★★★
- **볼 것**: `apps/web/src/app/styles/globals.css`(단계별 주석)
- **핵심**
  - Tailwind v4는 설정 파일 대신 **CSS 안의 `@theme`**에 토큰을 적습니다. `--color-paper`를 정의하면 `bg-paper`, `text-paper` 같은 클래스가 생깁니다.
  - `@theme inline`과 그냥 `@theme`의 차이: inline은 변수 참조를 그대로 넣어 런타임에 값이 바뀔 수 있게 합니다(화면 모드용).
  - `@custom-variant dark (…)`: `dark:` 접두사가 무엇을 기준으로 동작할지 정합니다(여기서는 `data-theme`).
  - `prefers-color-scheme`(시스템 설정)과 `color-scheme` 속성(스크롤바·폼 컨트롤 색까지 맞춤)
- **문서**: https://tailwindcss.com/docs/theme, MDN `prefers-color-scheme`

### next/font ★★
- **볼 것**: `apps/web/src/app/styles/fonts.ts`
- **핵심**: 빌드 때 글꼴을 받아 자체 호스팅합니다(개인정보·속도). `variable`로 CSS 변수를 만들고 `<html>`에 클래스를 붙입니다. 대체 글꼴의 크기를 자동으로 맞춰 글꼴이 바뀔 때 화면이 덜 흔들립니다(`… Fallback`).
- **문서**: Next.js 문서의 Font Optimization

### "내 PC에선 되는데 CI에서만 실패" ★★
- 원인은 대개 **git에 없는 파일**(빌드 결과물, 캐시, 환경 변수)입니다. 로컬에는 남아 있어서 통과하고, 깨끗한 CI 머신에는 없어서 실패합니다.
- 1단계 첫 푸시 때 실제로 겪었습니다: `.velite/`가 로컬에만 있었습니다.
- **확인 방법**: 저장소를 새 폴더에 `git clone`해서 CI와 같은 순서로 명령을 돌려 봅니다.

### 글꼴 라이선스 ★
- Google Fonts에 없는 글꼴(제목·본문 Pretendard)은 npm 패키지의 CSS를 import 합니다. 이 CSS의 `unicode-range`가 글자 범위별 파일을 나눠 두어, 화면에 쓰인 범위의 파일만 내려갑니다(통파일 약 2MB 대신 몇십 KB씩).
- 사이트에 쓰는 글꼴은 **SIL Open Font License(OFL)**입니다. 상업적 이용과 웹 포함이 허용되지만, 글꼴 파일 자체를 따로 판매할 수는 없습니다. 패치에 쓴 글꼴을 사이트에 쓰려면 라이선스를 먼저 확인합니다.

## 9. 케이스 열기 시제품에서 새로 등장한 것

### FSD 실전: 어디에 둘까 ★★★
- **볼 것**: `src/entities/patch`, `src/widgets/case-viewer`, `src/pages/case-lab`
- **이번 판단**
  - 표지·디스크·팩 = 작품이 **어떻게 생겼나** → `entities/patch/ui`
  - 케이스 열기 = **큰 화면 블록 + 동작** → `widgets/case-viewer` (상태 로직은 `model/`, 화면은 `ui/`)
  - 기종별 케이스 모양 = 작품 표시에 딸린 규칙 → `entities/patch/lib` (기종 entity를 따로 만들면 entity끼리 import하게 되어 FSD 규칙 위반)
- **Steiger `insignificant-slice`**: "한 곳에서만 쓰는 조각은 합쳐라". 만들어 가는 중에는 흔히 걸려서 경고로 낮췄습니다. 1단계가 끝날 때 남은 경고를 정리합니다.

### `<dialog>` 요소 ★★
- `showModal()`만 부르면 포커스 가두기, ESC로 닫기(`cancel` 이벤트), 배경(`::backdrop`), 맨 위 레이어 표시를 브라우저가 해 줍니다. 모달 라이브러리 없이 접근성 좋은 모달을 만들 수 있습니다.
- **문서**: MDN `<dialog>`

### CSS 3D 변형과 transition ★★
- `perspective`(원근), `transform-style: preserve-3d`(Tailwind `transform-3d`), `backface-visibility: hidden`(뒷면 숨기기), `rotateX`/`rotateY`
- **transition이 시작되려면 "이전 스타일"이 계산돼 있어야** 합니다. 요소를 띄우자마자 클래스를 바꾸면 연출이 생략됩니다. 레이아웃을 강제로 한 번 계산(`getBoundingClientRect()`)하면 해결됩니다.
- **가려진 탭에서는** `requestAnimationFrame`이 실행되지 않고 애니메이션도 멈춥니다. 처음엔 rAF로 다음 프레임을 기다렸다가 이 때문에 열리지 않는 문제를 겪었습니다.
- `prefers-reduced-motion`: 움직임을 줄이고 싶은 사용자를 위한 설정(Tailwind `motion-reduce:`)
- **문서**: MDN `transform`, `transition`, `prefers-reduced-motion`

### FLIP 애니메이션과 Web Animations API ★★
- **볼 것**: `src/widgets/case-viewer/lib/motion.ts`
- **FLIP**: 요소를 A에서 B로 옮기는 연출의 정석입니다. 요소를 실제로는 B에 두고, A에 있는 것처럼 보이게 `transform`을 걸었다가 그 transform을 없애며 움직입니다. `top`·`left`·`width`를 직접 바꾸면 매 프레임 레이아웃을 다시 계산해서 버벅이지만, transform은 GPU가 처리해서 부드럽습니다.
- **Web Animations API**: `element.animate(keyframes, options)`. CSS 애니메이션을 JS에서 만들고, `finished` Promise로 끝나는 시점을 알 수 있습니다. "이동이 끝나면 연다"처럼 순서가 중요한 연출에 좋습니다.
- **해 볼 것**: `MOVE_MS`나 `MOVE_EASING`을 바꿔 느낌이 어떻게 달라지는지 보세요.
- 같은 문제를 푸는 최신 방법으로 **View Transitions API**도 있습니다(페이지 이동에 강함). 케이스 → 상세 페이지 전환에서 검토합니다.
- **문서**: MDN `Element.animate()`, "FLIP your animations"(Paul Lewis)

### 컨테이너 쿼리 단위(cqw)와 한글 줄바꿈 ★★
- **볼 것**: `src/entities/patch/ui/case-cover.tsx`
- **문제**: 작은 표지가 날아가며 큰 표지가 될 때 제목 줄바꿈이 바뀌었습니다(작은 표지는 한 줄, 큰 표지는 두 줄). 글자 크기를 픽셀로 따로 정해서 표지 폭과 글자 크기의 비율이 달랐기 때문입니다.
- **해결 1, `cqw`**: `@container`로 지정한 요소의 폭 1%가 1cqw입니다. 글자 크기·여백을 cqw로 쓰면 표지 크기가 바뀌어도 비율이 같아서 줄바꿈이 똑같습니다(Tailwind v4 `@container`, `text-[10cqw]`). 화면 폭 기준인 `vw`와 달리 **요소 폭 기준**이라 재사용 컴포넌트에 좋습니다.
- **해결 2, `word-break: keep-all`**(Tailwind `break-keep`): 브라우저 기본값은 한글을 아무 음절 사이에서나 끊어서 "무/쌍"처럼 단어가 쪼개집니다. keep-all은 띄어쓰기에서만 끊습니다. 한글 제목에는 거의 항상 필요합니다.
- **문서**: MDN "CSS container queries", `word-break`

### 서버 컴포넌트와 클라이언트 컴포넌트의 경계 ★★★
- `'use client'` 파일만 브라우저에서 실행됩니다. 서버 컴포넌트가 클라이언트 컴포넌트에 넘기는 props는 **직렬화되어 HTML과 함께 전송**됩니다. 큰 데이터를 그대로 넘기면 페이지가 무거워집니다.
- **문서**: Next.js 문서의 Server and Client Components

### 엄격한 린트와 타협하는 법 ★
- 이번에 끈 규칙: `noTernary`(삼항 금지), `noJsxPropsBind`(인라인 함수 금지). 지켰을 때 코드가 더 나빠지는 규칙은 이유를 적고 끕니다.
- 지킨 규칙: `noExcessiveLinesPerFunction`(함수 50줄) → 속지·상태 훅을 분리, `noLeakedRender`(`&&` 렌더링) → 명시적 조건, `useGlobalThis`
- 도구 차이: Steiger의 파일 패턴이 윈도우 경로(역슬래시)에서 맞지 않는 문제가 있었습니다. 로컬(윈도우)과 CI(리눅스)의 결과가 달라지는 설정은 피합니다.

## 10. 홈 진열장에서 새로 등장한 것

### FSD: 위젯끼리는 서로 가져다 쓸 수 없다 ★★★
- 목록 위젯이 선반 위젯의 타입(`PickHandler`)을 가져오려다 규칙에 걸렸습니다. **같은 층끼리는 import 금지**라서, 두 위젯이 함께 쓰는 것은 **아래 층**(`entities/patch`)으로 내렸습니다. FSD에서 가장 자주 하게 되는 판단입니다.
- 헤더·푸터처럼 모든 페이지에 공통인 틀은 **app 층**(`src/app/layouts`)에서 조립합니다. app 층에서 쓰는 위젯은 Steiger의 "한 곳에서만 쓰임" 검사에서도 제외됩니다.

### 깜빡임 없는 화면 모드 ★★
- **FOUC**(잘못된 스타일이 잠깐 보이는 현상): 저장된 모드를 React가 실행된 뒤에 적용하면, 어두운 모드 사용자에게 밝은 화면이 잠깐 번쩍입니다. 그래서 `<head>`에서 아주 작은 스크립트로 먼저 적용합니다(`next/script`의 `strategy="beforeInteractive"`).
- **hydration 불일치 피하기**: 서버가 모르는 값(사용자 모드, 지금 시각, 브라우저 시간대)은 첫 렌더에서 서버와 같은 값으로 그리고, `useEffect` 이후에 바꿉니다.
- **문서**: Next.js `Script` 컴포넌트, React "Hydration" 오류 설명

### 날짜와 시간대 ★★
- Velite는 날짜를 `2026-10-02T00:00:00.000Z` 같은 ISO 문자열로 내보냅니다. 문자열을 잘라 쓰다가 `10.02T00:00…`가 화면에 나온 적이 있습니다.
- `Intl.DateTimeFormat`에 `timeZone: 'Asia/Seoul'`을 **명시**하면 서버(보통 UTC)와 브라우저(KST)가 같은 날짜를 그립니다. 시간대를 안 정하면 자정 근처에서 서버와 브라우저의 날짜가 달라 hydration 오류가 날 수 있습니다.

### hydration 에러를 받았을 때 가르는 법 ★★
- **실제 사례**: 개발 중 "A tree hydrated but some attributes … didn't match" 에러가 났는데, 모든 요소에 `style="user-select: auto"`가 붙어 있었습니다. 코드에도 서버 HTML에도 없는 값이었고, **브라우저 확장 프로그램**(복사·우클릭 허용류)이 React 실행 전에 DOM을 고친 것이었습니다.
- **가르는 순서**
  1. 에러의 차이(diff)가 어떤 속성인지 본다. 내가 쓴 적 없는 속성이 **모든 요소에** 붙어 있으면 거의 확장 프로그램이다.
  2. 서버 HTML을 직접 받아(`curl http://localhost:3000/`) 그 속성이 있는지 본다. 없으면 브라우저 쪽 문제다.
  3. 시크릿 창(확장 프로그램 꺼짐)에서 다시 열어 본다. 사라지면 확장 프로그램이 원인이다.
- 코드 쪽 원인이라면 대개 날짜·시간대, `Math.random()`, `typeof window` 분기, 잘못된 HTML 중첩입니다(이 문서의 "깜빡임 없는 화면 모드", "날짜와 시간대" 참고).
- **덤으로 확인할 것**: 콘솔의 404. 이번에는 사이트 아이콘이 없어서 페이지마다 `/favicon.ico` 404가 났습니다. Next.js는 `app/icon.svg`를 두면 `<link rel="icon">`을 자동으로 넣어 줍니다.

### CSS로 실물 재질 그리기 (Wii 케이스) ★★
- **볼 것**: `src/entities/patch/ui/case-materials.css`, `keepcase.tsx`
- **Tailwind v4 `@utility`**: 긴 CSS를 이름 하나(`plastic-body`, `disc-surface` …)로 묶어 클래스처럼 씁니다. 재질처럼 여러 속성이 한 덩어리인 스타일에 좋습니다.
- **재질 표현 도구**
  - 플라스틱 광택: `linear-gradient`(빛 방향) + `box-shadow: inset …`(턱·오목한 면)
  - 디스크 금속 반사: `conic-gradient`(원뿔형, 각도에 따라 밝기가 바뀜) 두 겹(은빛 + 옅은 무지개)
  - 허브의 꽃잎 무늬: `repeating-conic-gradient`(같은 무늬를 각도마다 반복)
- **실물 색과 화면 모드 색을 나누기**: 케이스·디스크 라벨처럼 실제 물건의 색은 어두운 화면에서도 바뀌지 않아야 합니다. 라벨 글자에 화면 모드 토큰(`text-ink`)을 썼다가 어두운 화면에서 흰 라벨에 밝은 글자가 올라간 적이 있습니다.
- **색 묶음(변수)으로 같은 구조 재사용**: Wii와 Wii U 케이스는 구조가 같고 색만 다릅니다. 재질 utility는 색을 직접 쓰지 않고 `--p-hi`, `--p-groove` 같은 변수를 쓰며, 케이스 바깥에 `plastic-tone-white`/`plastic-tone-blue`를 붙이면 안쪽 부품 전체가 그 색을 따릅니다(CSS 변수는 자식에게 상속됨). 새 색 케이스는 색 묶음 하나만 추가하면 됩니다.
- **크기는 전부 비율로**: 케이스 폭·높이에 대한 %와 cqw로 잡아서, 진열장의 작은 표지와 열린 큰 케이스가 같은 그림입니다.
- **0으로 나누기 방어**: 화면이 접혀 크기가 0이면 이동 계산에서 `NaN`, `Infinity`가 나옵니다(콘솔 경고로 발견). 크기를 잴 수 없으면 연출을 건너뜁니다.
- **문서**: MDN `conic-gradient()`, `repeating-conic-gradient()`, Tailwind v4 "Adding custom utilities"

### 마우스를 따라가는 홀로그램 글자 ★★
- **볼 것**: `src/shared/ui/holo-text.tsx`, `holo-text.css`
- **글자 모양으로 그라데이션 자르기**: `background-clip: text` + `color: transparent`. 무지개 그라데이션(위)과 은빛 바탕(아래)을 `background-blend-mode: overlay`로 겹쳐 금속 홀로그램처럼 보이게 합니다.
- **마우스 따라가기**: 마우스 위치를 글자 중심 기준 비율로 바꿔 CSS 변수(`--holo-x`, `--holo-angle`)에 넣고, CSS가 그 변수로 그라데이션 위치·각도를 정합니다.
  - React 상태로 하면 마우스가 움직일 때마다 다시 렌더링되므로, **요소의 style을 직접** 바꿉니다(`style.setProperty`).
  - 마우스 이벤트는 화면 갱신보다 훨씬 자주 오므로 `requestAnimationFrame`으로 한 프레임에 한 번만 계산합니다.
- **마우스가 없을 때**(휴대폰): CSS `@keyframes`로 반사가 저절로 흐르게 하고, 마우스가 움직이면 그 애니메이션을 끄고(`holo-tracking`) 마우스를 따릅니다.
- **범용 효과는 shared**: 특정 작품·기종을 모르는 효과라 `shared/ui`에 두었습니다. 상세 페이지 제목 등에서 다시 쓸 수 있습니다.

### 엄격한 도구끼리 부딪칠 때 ★
- TS의 `noPropertyAccessFromIndexSignature`는 `obj['key']`를, Biome의 `useLiteralKeys`는 `obj.key`를 요구해서 서로 반대입니다(`dataset`, `Object.fromEntries` 결과에서 겪음). 둘 다 만족하는 다른 방법(`getAttribute`, 배열에서 `find`)을 썼습니다. 규칙을 끄기 전에 "둘 다 만족하는 표현"을 먼저 찾아봅니다.

### 접근성 기본기 ★★
- 버튼 묶음은 `<fieldset>` + `<legend>`(화면에는 `sr-only`로 숨김), 켜짐 상태는 `aria-pressed`
- 섹션 제목 연결은 `aria-labelledby` + `useId()`(고정 id 문자열은 컴포넌트를 여러 번 쓰면 겹침)
- 휴대폰 접는 메뉴는 JS 없이 `<details>`/`<summary>`
- 등줄기 버튼에는 `aria-label="○○ 케이스 꺼내기"`로 무엇을 하는지 알림

### 세로쓰기와 가로 넘기기 ★
- `writing-mode: vertical-rl`: 한글은 바로 서고 로마자는 눕습니다. 그래서 기종 이름(GC, Wii)은 가로로 따로 썼습니다.
- 세로쓰기에서도 `whitespace-nowrap` + `text-overflow: ellipsis`로 한 줄 말줄임이 됩니다.
- 휴대폰 선반은 `overflow-x-auto` + `scroll-snap`으로 손가락으로 넘길 때 케이스 단위로 멈춥니다.

### 단계(phase)로 연출 순서 짜기 ★★
- **볼 것**: `apps/web/src/widgets/case-viewer/lib/phases.ts`, `model/use-case-dialog.ts`
- **핵심**
  - 여러 단계가 이어지는 연출은 boolean 여러 개보다 **상태 하나(유니언 타입)** 가 다루기 쉽습니다. 불가능한 조합(뚜껑은 닫혔는데 케이스는 열림)이 생기지 않습니다.
  - 순서를 `{ phase, holdMs }` 목록(데이터)으로 두면, 열기·닫기를 목록만 바꿔 재사용합니다.
  - 비동기 순서를 중간에 멈추려면 "지금 순서 번호"를 ref에 두고 비교합니다(취소 토큰). AbortController와 같은 생각입니다.
  - `perspective` **속성**은 바로 아래 자식의 3D 회전에 원근을 줍니다. transform 안의 `perspective()` 함수와 결과는 같지만, 클래스가 간단해집니다.
- **문서**: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions

### 사이트 배율과 단위 고르기(rem·em·cqw·dvh) ★★
- **볼 것**: `src/app/styles/globals.css`(html font-size), `widgets/case-viewer/ui/case-liner.tsx`
- **핵심**
  - `html { font-size: 120% }` 하나로 rem 단위(Tailwind 간격·글자·크기)가 모두 1.2배가 된다. 그래서 크기를 px로 고정하지 말고 rem으로 쓴다.
  - 미디어 쿼리의 rem은 html 글자 크기와 상관없이 브라우저 기본값(16px) 기준이라, 배율을 바꿔도 반응형 기준점은 그대로다.
  - CSS `zoom`도 한 번에 키울 수 있지만, 좌표 계산(getBoundingClientRect)·transform 이동·dvh와 어긋날 수 있어 피했다.
  - 화면 크기에 묶인 상자(dvh·vw) 안의 글자를 rem으로 쓰면 배율을 올릴 때 넘친다. 이런 곳은 글자 기준을 상자 폭(cqw)에 두고 나머지를 em으로 쓰면 인쇄물처럼 같은 비율로 커지고 작아진다.
- **문서**: https://developer.mozilla.org/docs/Web/CSS/length

### 페이지 전체에 거는 동작은 전역 CSS 한 곳에서 ★★
- **볼 것**: `src/app/styles/globals.css`의 `@layer base`
- **핵심**
  - **손가락 커서**: Tailwind v4는 단추 커서를 화살표로 둡니다. 클릭할 수 있는 요소(`button`, `summary`, 체크박스 등)에 한 번에 `cursor: pointer`를 겁니다.
  - **모달이 열리면 뒤 페이지 스크롤 막기**: `html:has(dialog[open]) { overflow-y: hidden }`. `:has()`는 "이런 자식을 가진 요소"를 고르는 선택자라, 열고 닫는 코드 없이 CSS만으로 됩니다.
  - **스크롤바 때문에 화면이 덜컥거리지 않게**: `overflow-y: scroll`로 스크롤바 자리를 늘 두고, `scrollbar-gutter: stable`로 스크롤을 막을 때도 자리를 지킵니다. `scrollbar-color`로 홈을 투명하게 하면 스크롤할 게 없을 때 그 자리가 바탕색으로만 보입니다.
  - 측정해 보니 `scrollbar-gutter: stable`만으로는 스크롤이 없을 때 자리를 비워 두지 않았습니다. 문서의 설명과 실제 동작이 다를 수 있으니 **재서 확인**합니다.
- **문서**: https://developer.mozilla.org/docs/Web/CSS/:has, https://developer.mozilla.org/docs/Web/CSS/scrollbar-gutter

### 세로쓰기의 함정들 ★
- **볼 것**: `entities/patch/ui/case-spine.tsx`
- **핵심**
  - Tailwind v4의 `py`는 "글 흐름 기준 위아래"(`padding-block`)라 세로쓰기에서는 **좌우** 여백이 됩니다. 물리 방향이 필요하면 `pt`·`pb`를 씁니다.
  - `text-orientation: upright`로 로마자·숫자·기호도 한 글자씩 세웁니다. 이때 띄어쓰기도 한 글자 높이가 되므로 `word-spacing`을 음수로 줄입니다.
  - 세로쓰기에서는 줄 수 말줄임(`line-clamp`)이 듣지 않습니다. 폭을 `2lh`(줄 간격 두 배)로 묶어 두 줄까지 보이게 합니다. 줄을 정확히 나누고 싶으면 블록 요소 하나 = 한 열로 씁니다(`spineLines`).
- **문서**: https://developer.mozilla.org/docs/Web/CSS/text-orientation

### 레이아웃을 재서 나누기(ResizeObserver + 순수 계산) ★★
- **볼 것**: `widgets/shelf/model/use-content-width.ts`, `widgets/shelf/lib/pack-rows.ts`
- **핵심**
  - CSS 줄바꿈(flex-wrap)은 "어디서 줄이 바뀌었는지"를 알려 주지 않습니다. 줄 끝 요소를 다르게 그려야 하면 폭을 재서 직접 나눕니다.
  - 재는 일(훅, model 칸)과 나누는 계산(순수 함수, lib 칸)을 나눠 두면 계산만 따로 시험할 수 있습니다.
  - 서버는 폭을 모르므로 처음 값은 `null`로 두고, 그동안 쓸 대체 배치를 준비합니다(hydration 오류 방지).
  - 숨겨진 창(크기 0)에서 재면 엉뚱한 값이 나옵니다. 시험할 때 창 크기를 확인합니다.
- **문서**: https://developer.mozilla.org/docs/Web/API/ResizeObserver

### 여러 개 고르는 필터와 펼침 목록 ★★
- **볼 것**: `entities/patch/lib/platform-groups.ts`(`toggleFilter`), `pages/korean-translation/ui/platform-dropdown.tsx`
- **핵심**
  - 필터 값을 "고른 것들의 목록"으로 두고 빈 목록을 "전체"로 정하면, 전체·여러 개·하나를 같은 규칙으로 다룹니다.
  - 다음 상태가 이전 상태에 달려 있으면 `setState((prev) => …)`로 씁니다. 같은 순간 두 번 눌러도 앞 선택이 사라지지 않습니다.
  - 펼침 목록은 `<details>`로 JS 없이 열고 닫히게 하고, 바깥 누르기·ESC로 닫는 것만 더합니다.
- **문서**: https://react.dev/reference/react/useState#updating-state-based-on-the-previous-state

### 날짜에 따라 바뀌는 정적 페이지(ISR) ★★
- **볼 것**: `app/(site)/korean-translation/page.tsx`의 `revalidate`, `shared/lib/date.ts`의 `kstDayNumber`
- **핵심**
  - 미리 만들어 둔 페이지는 만든 시점의 "오늘"에 묶입니다. `export const revalidate = 초`를 라우트 파일에 두면 그 주기마다 다시 그립니다.
  - 이런 설정은 Next.js가 **라우트 파일에서만** 읽습니다(FSD pages 칸에 두면 무시됨).
  - 날짜 차이는 한국 시간 기준 "날 번호"로 바꿔 빼면 시간대 혼동이 없습니다.
- **문서**: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config

### 매체를 누르면 최신 릴리즈로(투명 링크 판) ★★
- **볼 것**: `entities/patch/ui/release-link.tsx`, `keepcase.tsx`(받침마다 링크 모양), `cartridge.tsx`
- **핵심**
  - GitHub는 `https://github.com/{owner}/{repo}/releases/latest`가 늘 최신 릴리즈로 넘겨 줍니다. 버전이 바뀌어도 링크를 고칠 필요가 없습니다.
  - 그림(디스크·카드·카트리지) 위에 같은 모양의 투명한 `<a>`를 덮어 누를 곳을 만듭니다. 그림 쪽 코드는 건드리지 않습니다.
  - 새 탭 링크에는 `rel="noopener noreferrer"`를 붙이고, 화면에 글자가 없으니 `sr-only`로 읽어 줄 이름을 넣습니다.
  - 공개(released) 작품에만 링크를 만듭니다. 비공개 릴리즈로 가는 링크는 남에게 404가 됩니다.
- **문서**: https://docs.github.com/repositories/releasing-projects-on-github/linking-to-releases

### 넘칠 때만 정해 둔 곳에서 줄 바꾸기 ★
- **볼 것**: `entities/patch/ui/title-lines.tsx`
- **핵심**
  - 덩어리마다 `inline-block`으로 감싸면, 한 줄에 다 들어갈 때는 한 줄 그대로이고 넘칠 때만 덩어리 사이에서 줄이 바뀝니다. 미디어 쿼리나 폭 측정이 필요 없습니다.
  - 줄 나눔 위치는 등줄기용 `spineLines`를 다시 씁니다. 다만 등줄기 줄은 문장부호를 빼고 적은 경우가 있어, 글자는 원래 제목에서 잘라 씁니다(콜론 유지).
- **문서**: https://developer.mozilla.org/docs/Web/CSS/display#inline-block

### CSS 변수 하나로 연출 속도 바꾸기 ★★
- **볼 것**: `widgets/case-viewer/lib/motion.ts`(`CLOSE_TEMPO`), `ui/case-viewer.tsx`(dialog의 `--case-tempo`)
- **핵심**
  - 시간을 `duration-[calc(700ms*var(--case-tempo,1))]`처럼 변수 곱으로 써 두면, 바깥(dialog)에서 변수 하나만 바꿔 안쪽 부품 전체를 한꺼번에 빠르게 할 수 있습니다. CSS 변수는 자식에게 상속됩니다.
  - JS가 기다리는 시간(단계 `holdMs`, `flyOut`)에도 같은 상수를 곱해야 화면과 순서가 어긋나지 않습니다. 값은 한 곳(`CLOSE_TEMPO`)에서 정해 CSS 변수(style)로 넘깁니다.
  - 속도 변수를 바꾸는 상태 변경과 단계 변경이 같은 렌더에 들어가야 첫 transition부터 빨라집니다(React가 한 이벤트 안의 setState를 묶어서 그림).
- **문서**: https://developer.mozilla.org/docs/Web/CSS/Using_CSS_custom_properties

### transition이 모두 끝난 때 알기 ★★
- **볼 것**: `widgets/case-viewer/lib/motion.ts`의 `transitionsSettled`, `model/use-case-dialog.ts`
- **핵심**
  - `element.getAnimations({ subtree: true })`는 안쪽에서 진행 중인 CSS transition·animation을 모두 돌려주고, 각각의 `finished` Promise로 끝을 기다릴 수 있습니다. 시간을 손으로 더해 맞추지 않아도 됩니다.
  - 상태를 바꾼 직후에는 transition이 아직 만들어지지 않았으므로 화면을 두 번 그린 뒤(`requestAnimationFrame` 두 번) 모읍니다.
  - 무한 반복 애니메이션은 끝나지 않으니 `CSSTransition`만 고릅니다.
  - 닫기 단추는 이 시점(settled)에만 보입니다. 보임·닫는 중·다 열림을 boolean 셋으로 두지 않고 단계 하나(`'idle' | 'opening' | 'settled' | 'closing' | 'leaving'`)에서 끌어내면 서로 어긋나지 않습니다.
- **문서**: https://developer.mozilla.org/docs/Web/API/Element/getAnimations

### 규칙이 있는 표시는 판정 함수로 ★
- **볼 것**: `entities/patch/lib/release-stage.ts`, `widgets/case-viewer/ui/case-liner.tsx`
- **핵심**
  - "v1.0 미만은 공개 테스트, 이상은 검수판, 공개 전은 작업 중" 같은 규칙은 화면 코드가 아니라 판정 함수 하나(`releaseStage`)에 둡니다. 화면은 결과(단계 이름)만 받아 문구를 고릅니다.
  - 버전 문자열은 `v1.2f`·`v0.1.1`처럼 모양이 제각각이라, 맨 앞 숫자만 정규식으로 읽습니다(정규식은 함수 밖 상수로: Biome useTopLevelRegex).
  - 문구는 JSX 안에 씁니다(문자열 상수로 빼면 Biome noSecrets가 한글을 비밀값으로 오탐).
- **문서**: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/RegExp/exec

## 갱신 기록

| 커밋 | 추가한 내용 |
|---|---|
| 0단계 골격 | 1~7절 |
| 1단계 콘텐츠·디자인 토큰 | 8절: MDX·frontmatter·Velite, Tailwind v4 토큰·화면 모드, next/font, 글꼴 라이선스 |
| CI 수정(Velite 먼저) | 8절: "내 PC에선 되는데 CI에서만 실패" |
| 케이스 열기 시제품 | 9절: FSD 실전 배치, `<dialog>`, CSS 3D·transition, 서버/클라이언트 경계, 린트 타협 |
| 케이스가 제자리에서 날아와 열리게 수정 | 9절: FLIP 애니메이션과 Web Animations API |
| 표지 줄바꿈 고정, 적용 문구 한국어화 | 9절: 컨테이너 쿼리 단위(cqw)와 한글 줄바꿈(keep-all) |
| 홈 진열장 | 10절: FSD 같은 층 import 금지·app 층 레이아웃, 화면 모드(FOUC·hydration), 날짜·시간대, 도구 충돌, 접근성, 세로쓰기 |
| 콘솔 에러 정리 | 10절: hydration 에러를 가르는 법(확장 프로그램), 사이트 아이콘(app/icon.svg) |
| Wii 실물 케이스 | 10절: CSS로 실물 재질 그리기(@utility, conic-gradient), 실물 색과 화면 모드 색 |
| Wii 케이스 피드백 반영 | 10절: 마우스를 따라가는 홀로그램 글자(background-clip, CSS 변수, rAF). 경첩 쪽 모서리, cqw 기준 컨테이너 통일 |
| Wii U 케이스·Wii 순백색 | 10절: 색 묶음(CSS 변수 상속)으로 같은 구조 재사용 |
| 앞면 통일·등줄기 색 맞춤 | 10절(색 묶음): 앞면은 케이스 위에 바로 인쇄(--p-ink), 선반 등줄기도 같은 색 묶음(plastic-spine). 컴포넌트 파일에서는 컴포넌트만 내보내기(useComponentExportOnlyModules → 상수는 lib로) |
| GC 종이상자 케이스 | 10절: 단계(phase)로 연출 순서 짜기, 취소 토큰, perspective 속성. 홀로그램 색을 CSS 변수 기본값(`var(--holo-1, …)`)으로 열어 두고 `holo-cool`로 바꾸기, 기종별 디스크 라벨 표(DISC_PRINTS) |
| 3DS·NDS 킵 케이스·실물 비율 크기 | 10절(색 묶음): 같은 킵 케이스 부품에 받침(holder)만 바꿔 3DS 카드 받침 추가, NDS는 같은 구조에 차콜 색 묶음. 받침 안쪽(T자 경첩 표시·카드 틀·고정 탭·손가락 홈·긴 걸쇠)은 실물 사진 기준. 재질 파일이 300줄을 넘어 `cart-materials.css`로 나눔(noExcessiveLinesPerFile). 실물 치수를 기준 기종 대비 비율로 바꿔 Tailwind 고정 클래스로 적기, 작은 화면에서 내용 줄이기(compact) |
| SFC·GB·GBA 카트리지 상자·게임팩 모양 | 10절: 같은 열기 단계에 다른 부품(설명서·카트리지)을 끼우기, clip-path로 윤곽 자르기(그림자는 drop-shadow), 형태 판단을 함수 하나(`hasOuterBox`)로 모으기, CSS 파일 나누기(재질별) |
| 사이트 1.2배 | 10절: 사이트 배율과 단위 고르기(rem·em·cqw·dvh), 모양은 도면 좌표로 SVG 그리기 |
| 콘텐츠 최신화 | (흐름 문서 8절) 화면용 값도 frontmatter에(spineLines), 개발 중 콘텐츠 감시(`dev:web`), 날짜는 한국 시간 기준 |
| 글꼴과 전역 동작 | 8절(글꼴): Google Fonts에 없는 글꼴을 npm 패키지 CSS로(동적 부분집합). 10절: 페이지 전체 동작은 전역 CSS 한 곳에서(:has() 스크롤 잠금, 스크롤바 자리) |
| 홈 진열장 다듬기 | 10절: 세로쓰기의 함정들, 레이아웃을 재서 나누기(ResizeObserver + 순수 계산), 여러 개 고르는 필터와 펼침 목록, 날짜에 따라 바뀌는 정적 페이지(ISR) |
| 휴대폰 하단 메뉴 | (흐름 문서 11절) 메뉴 목록 한 곳에 두고 헤더·하단 메뉴가 함께 쓰기, 고정 요소가 내용을 가리지 않게 여백 주기(safe-area-inset), aria-current로 지금 페이지 알리기 |
| 최근 갱신 받침 선 | (재질 정리) 쓰지 않게 된 @utility(shelf-ledge)는 지워 재질 파일을 가볍게 유지 |
| 파비콘 q | (app/icon.svg) 작은 아이콘은 글꼴 글자 대신 도형으로 그려 어느 컴퓨터에서나 같은 모양, 실제 크기(16px)로 줄여 보고 확인 |
| 홈·메뉴 개편 | (흐름 문서 11절) 홈은 소개, 진열장은 /korean-translation. 메뉴 목록 한 곳 + 지금 주소 판단(isCurrent, usePathname은 그 부분만 클라이언트로), 페이지별 탭 제목(metadata), 없는 페이지는 링크 대신 '준비 중'(typedRoutes), useId로 제목-영역 잇기 |
| 케이스 그림 다듬기 | 10절: 매체를 누르면 최신 릴리즈로(투명 링크 판·`releases/latest`), 넘칠 때만 정해 둔 곳에서 줄 바꾸기(inline-block). GC는 모서리를 각지게(`hasSquareCorners` 판정 함수 하나), 3DS·NDS 카드 받침은 오목한 면 정중앙(오목한 면의 여백으로 중심 계산) |
| 케이스 열기 화면·속지 정보 | 10절: CSS 변수 하나로 연출 속도 바꾸기(닫기 1.5배), transition이 모두 끝난 때 알기(getAnimations, 단계 하나로 상태 합치기), 규칙이 있는 표시는 판정 함수로. 동그란 X 닫기 단추는 케이스 안에 두어 함께 움직임, em·cqw 클래스를 다른 요소로 옮기면 기준이 바뀜 |
| 푸터 저작권 표기 | 저작권 연도를 한국 시간 올해로 계산(연 해와 다르면 2026–2027), 고지는 홈 면책 조항으로 옮김 |

## 11. 다음 단계에서 만날 것 ★

| 단계 | 도구·개념 | 문서 |
|---|---|---|
| 1 | shadcn/ui + Radix(동작만 가져오고 모양은 재정의) | https://ui.shadcn.com |
| 1 | Storybook, Chromatic(컴포넌트 문서·화면 회귀 검사) | https://storybook.js.org |
| 1 | View Transitions(케이스에서 상세 페이지로 이어지는 전환) | MDN |
| 2 | Drizzle ORM(스키마·마이그레이션), Neon(브랜치) | https://orm.drizzle.team, https://neon.com/docs |
| 2 | ISR·재검증(`revalidateTag` 등) | Next.js 문서 |
| 3 | Next.js rewrites, Hono RPC 클라이언트 | Next.js·Hono 문서 |
| 4 | GitHub REST API·Octokit, fine-grained 토큰 | https://docs.github.com/rest |
| 4 | 카카오톡 메시지 API, OAuth 토큰 갱신 | https://developers.kakao.com |
| 4 | Turnstile, HMAC 서명 링크(승인·거절 링크) | Cloudflare 문서 |
| 4 | Playwright(E2E 테스트) | https://playwright.dev |
| 5 | Cloudflare Queues·Cron Triggers, es-hangul(초성 검색) | Cloudflare 문서 |
| 6 | Workers AI, Vectorize, 임베딩과 의미 검색 | Cloudflare 문서 |
| 7 | Sentry, Lighthouse CI | 각 문서 |

## 추천 순서

1. `docs/learning/app-flow.md`를 보며 파일을 하나씩 따라가 본다.
2. **FSD**와 **Workers 실행 모델**을 먼저 공부한다. 이 저장소에서 가장 낯설 두 가지다.
3. `pnpm dev`로 띄운 뒤 `http://localhost:8787/api/health`를 열어 보고, `health.route.ts`의 응답을 바꿔 본다.
4. 일부러 규칙을 어겨 본다(FSD import, `any` 쓰기, `arr[0].x`). 각 도구가 무엇을 잡는지 몸으로 익힌다.
5. 첫 푸시 뒤 GitHub Actions 로그를 읽어 본다.
