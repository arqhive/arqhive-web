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

## 갱신 기록

| 커밋 | 추가한 내용 |
|---|---|
| 0단계 골격 | 1~7절 |
| 1단계 콘텐츠·디자인 토큰 | 8절: MDX·frontmatter·Velite, Tailwind v4 토큰·화면 모드, next/font, 글꼴 라이선스 |
| CI 수정(Velite 먼저) | 8절: "내 PC에선 되는데 CI에서만 실패" |
| 케이스 열기 시제품 | 9절: FSD 실전 배치, `<dialog>`, CSS 3D·transition, 서버/클라이언트 경계, 린트 타협 |
| 케이스가 제자리에서 날아와 열리게 수정 | 9절: FLIP 애니메이션과 Web Animations API |
| 표지 줄바꿈 고정, 적용 문구 한국어화 | 9절: 컨테이너 쿼리 단위(cqw)와 한글 줄바꿈(keep-all) |

## 10. 다음 단계에서 만날 것 ★

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
