# 앱 흐름 (1단계 진행 중 기준)

지금까지 만들어진 것이 **어떤 순서로 움직이는지** 정리한 문서입니다. 커밋마다 흐름이 바뀌면 갱신합니다.

| 갱신 | 바뀐 흐름 |
|---|---|
| 0단계 | 골격: web·api·shared, 검사·CI |
| 1단계 (콘텐츠·토큰) | 콘텐츠 파이프라인(MDX → Velite), 디자인 토큰(@theme, 글꼴, 화면 모드) — 8·9절 |

> 아직 web과 api는 서로 연결되어 있지 않습니다. 둘을 잇는 `/api/*` 프록시는 3단계에서 붙입니다(마지막 절 참고).

## 1. 전체 그림

```mermaid
flowchart LR
  subgraph repo["모노레포 arqhive-web"]
    shared["packages/shared<br/>기종 목록·Zod 스키마"]
    content["packages/content<br/>MDX → Velite 데이터"]
    mdx[("content/<br/>작품 19 · 가이드 6 MDX")]
    tsconfig["packages/tsconfig<br/>엄격한 TS 설정"]
    web["apps/web<br/>Next.js + FSD"]
    api["apps/api<br/>Hono on Workers"]
  end
  shared -- "import @arqhive/shared" --> web
  shared -- "PLATFORMS 값 목록" --> content
  mdx -- "velite build" --> content
  content -. "(1단계 다음 작업) 진열장·상세 페이지" .-> web
  shared -. "(앞으로) 같은 스키마" .-> api
  tsconfig -- extends --> web
  tsconfig -- extends --> api
  tsconfig -- extends --> shared
  web -. "(3단계) /api/* 프록시" .-> api
```

- `shared`는 빌드 단계가 없는 **내부 패키지**입니다. TS 원본을 그대로 내보내고, web은 Next.js의 `transpilePackages` 설정으로 함께 컴파일합니다.
- 모든 패키지는 `packages/tsconfig`의 엄격한 설정을 물려받습니다.

## 2. 웹 페이지 요청 흐름 (`GET /`)

```mermaid
sequenceDiagram
  participant B as 브라우저
  participant N as Next.js 서버<br/>(개발: next dev / 운영: Vercel)
  participant L as app/layout.tsx
  participant P as app/(site)/page.tsx
  participant H as src/pages/home
  participant S as shared/config · @arqhive/shared

  B->>N: GET /
  N->>L: 루트 레이아웃 실행(metadata, 전역 CSS)
  L->>P: children으로 페이지 렌더
  P->>H: HomePage 불러오기(재내보내기)
  H->>S: SITE, PLATFORMS, PLATFORM_LABELS 읽기
  H-->>N: JSX
  N-->>B: HTML
```

- `(site)` 폴더는 **라우트 그룹**이라 주소에 나타나지 않습니다. 그래서 `app/(site)/page.tsx`가 `/` 주소를 맡습니다.
- `page.tsx`는 화면을 직접 그리지 않고, FSD의 `src/pages/home`에서 화면을 가져와 넘기기만 합니다.
- 전부 **서버 컴포넌트**라서 브라우저에는 HTML만 갑니다(이 페이지를 위한 React JS는 내려가지 않음).
- 이 페이지는 데이터 요청이 없어서, 빌드할 때 HTML을 **미리 만들어 둡니다**(빌드 로그의 `○ /  (Static)`). 운영에서는 요청 때마다 렌더하지 않고 만들어 둔 HTML을 바로 줍니다.

### FSD 층에서 본 같은 흐름

```mermaid
flowchart TB
  route["app/(site)/page.tsx<br/>Next.js 라우팅(얇게)"] --> pages
  subgraph fsd["src/ — FSD 층 (위 → 아래로만 import)"]
    app_layer["app 층<br/>styles/globals.css"]
    pages["pages 층<br/>home/ui/home-page.tsx"]
    widgets["widgets 층<br/>(1단계: 진열장)"]
    features["features 층<br/>(1·4단계)"]
    entities["entities 층<br/>(1단계)"]
    sharedL["shared 층<br/>config/site.ts"]
    pages --> sharedL
    pages -.-> widgets -.-> features -.-> entities -.-> sharedL
  end
  layout["app/layout.tsx"] --> app_layer
  layout --> sharedL
```

점선은 아직 비어 있는 층입니다. 반대 방향(예: shared → pages) import는 Steiger가 오류로 잡습니다.

## 3. API 요청 흐름 (`GET /api/health`)

```mermaid
sequenceDiagram
  participant C as 요청한 쪽<br/>(지금은 브라우저·curl, 3단계부터 web)
  participant W as Workers 런타임<br/>(개발: wrangler dev / 운영: Cloudflare)
  participant I as src/index.ts
  participant A as src/app.ts
  participant M as modules/health

  C->>W: GET /api/health
  W->>I: 기본 내보내기의 fetch(request, env, ctx)
  I->>A: app.fetch
  A->>A: basePath('/api') 제거 후 경로 매칭
  A->>M: /health → healthRoute
  M-->>C: 200 { "status": "ok" }
```

- Cloudflare는 `src/index.ts`의 **기본 내보내기**에서 `fetch`를 찾아 요청마다 부릅니다. 나중에 `queue`(큐 메시지), `scheduled`(Cron)도 같은 객체에 붙습니다.
- Workers는 서버를 계속 켜 두는 방식이 아닙니다. 요청이 오면 전 세계 Cloudflare 거점에서 가벼운 실행 환경(V8 isolate)을 띄워 처리합니다.

## 4. 개발할 때 (`pnpm dev`)

```mermaid
flowchart LR
  dev["pnpm dev"] --> turbo["turbo run dev<br/>(dev 스크립트가 있는 패키지를 동시에 실행)"]
  turbo --> nextdev["@arqhive/web: next dev<br/>http://localhost:3000"]
  turbo --> wrangler["@arqhive/api: wrangler dev<br/>http://localhost:8787/api/health"]
```

- 파일을 고치면 web은 화면이 바로 바뀌고(Fast Refresh), api는 Worker가 다시 로드됩니다.
- `shared`를 고치면 web이 그 변경을 바로 반영합니다(빌드 단계가 없으므로).

## 5. 빌드할 때 (`pnpm build`)

```mermaid
flowchart LR
  build["pnpm build"] --> tb["turbo run build"]
  tb --> nb["web: next build<br/>Turbopack 번들 → TS 검사 → 정적 페이지 생성 → .next/"]
  tb --> wb["api: wrangler deploy --dry-run<br/>esbuild로 한 파일로 묶기 → dist/ (실제 배포는 안 함)"]
  nb --> cache[("Turborepo 캐시<br/>입력이 같으면 다음엔 건너뜀")]
  wb --> cache
```

## 6. 타입이 만들어지고 흐르는 길

```mermaid
flowchart LR
  zod["shared: z.enum(PLATFORMS)"] -- "z.infer" --> ptype["Platform 타입"]
  ptype --> webT["web에서 사용"]
  wjson["wrangler.jsonc"] -- "wrangler types" --> env["worker-configuration.d.ts<br/>Env 타입 + Workers API 타입"]
  env --> apiT["api: Hono 앱의 Bindings = Env"]
  routes["app/ 라우트 폴더"] -- "next typegen" --> rtypes[".next/types<br/>라우트 타입(typedRoutes)"]
  apiT -- "typeof app (AppType)" --> rpc["(3단계) web의 Hono RPC 클라이언트"]
```

- `worker-configuration.d.ts`, `next-env.d.ts`, `.next/types`는 **도구가 만드는 파일**이라 git에 올리지 않고, 타입 검사 스크립트가 먼저 만들게 했습니다(`typecheck` 스크립트 참고).

## 7. 코드가 검사되는 길 (커밋 → CI)

```mermaid
flowchart TB
  commit["git commit"] --> hook["lefthook pre-commit<br/>바뀐 파일만 biome check --write"]
  hook -- "고칠 수 없는 오류" --> stop1["커밋 중단"]
  hook -- 통과 --> push["git push / PR"]
  push --> gha["GitHub Actions (ci.yml)"]
  gha --> s1["pnpm install --frozen-lockfile"]
  s1 --> s1b["콘텐츠 데이터 생성<br/>(velite build → .velite/)"]
  s1b --> s2["biome ci (린트·포맷)"]
  s2 --> s3["turbo run typecheck lint:fsd test build"]
  s3 --> ok["✓ 통과 → 병합 가능<br/>(main 보호 설정 시)"]
```

> **왜 Biome보다 Velite가 먼저인가**: Biome은 import한 파일이 실제로 있는지도 검사합니다(`noUnresolvedImports`). `.velite/`는 git에 없는 빌드 결과물이라, 먼저 만들지 않으면 "파일 없음" 오류가 납니다. 로컬에서는 이미 만들어 둔 파일이 있어 통과하고 CI에서만 실패했던 사례가 있습니다(1단계 첫 푸시).

| 검사 | 도구 | 잡는 것 |
|---|---|---|
| 린트·포맷 | Biome | 코드 스타일, 흔한 실수, 접근성, 보안 패턴 |
| 타입 | tsc (+ next typegen, wrangler types) | 타입 오류, 없는 라우트 링크 |
| FSD 규칙 | Steiger | 층 import 방향, 공개 창구 우회 |
| 테스트 | Vitest | shared 스키마, api health |
| 빌드 | next build, wrangler | 실제로 배포 가능한 결과물이 나오는지 |

## 8. 콘텐츠가 데이터가 되는 길 (MDX → Velite)

```mermaid
flowchart LR
  mdx["content/patches/&lt;slug&gt;/index.mdx<br/>frontmatter(YAML) + 본문(MDX)"] --> v["velite build<br/>(packages/content)"]
  g["content/guides/*.mdx"] --> v
  v -- "frontmatter를 스키마로 검사<br/>틀리면 빌드 실패" --> out[".velite/<br/>patches.json · guides.json<br/>index.js · index.d.ts(타입)"]
  out --> idx["packages/content/src/index.ts<br/>patches, guides, Patch, Guide 내보내기"]
  idx -. "1단계 다음 작업" .-> web["web: 진열장·목록·상세·가이드"]
```

- **작품 하나 = 폴더 하나**(`content/patches/<slug>/index.mdx`). 나중에 스크린샷 원본도 같은 폴더에 둡니다.
- frontmatter의 각 항목(`platform`, `status`, `patchMethod` 등)은 `packages/content/velite.config.ts`의 스키마로 검사됩니다. 예를 들어 `platform: "ps2"`라고 쓰면 빌드가 실패합니다.
- 본문(MDX)은 Velite가 미리 **함수 코드 문자열**로 컴파일해 둡니다. web은 그 문자열을 React 컴포넌트로 바꿔 그립니다(다음 작업).
- `.velite/`는 빌드 결과물이라 git에 올리지 않습니다. `content`의 `typecheck`·`build` 스크립트가 먼저 `velite build`를 실행합니다.
- `patchMethod`는 가이드 slug를 가리킵니다. 작품 페이지의 "적용하기"가 해당 가이드로 연결되는 근거입니다.

## 9. 디자인 토큰이 화면에 닿는 길

```mermaid
flowchart TB
  subgraph css["src/app/styles/globals.css"]
    vars[":root 의미 변수<br/>--paper, --ink, --stamp …"]
    media["@media (prefers-color-scheme: dark)<br/>시스템이 어두우면 값 교체"]
    attr[":root[data-theme=dark]<br/>사용자가 고르면 값 교체"]
    theme["@theme inline<br/>--color-paper: var(--paper) …"]
  end
  fonts["src/app/styles/fonts.ts<br/>next/font: 나눔명조·고딕 A1·IBM Plex Mono"] -- "--font-* 변수" --> theme
  vars --> theme
  media --> vars
  attr --> vars
  theme -- "Tailwind가 클래스 생성" --> cls["bg-paper · text-ink · font-title …"]
  cls --> ui["컴포넌트 className"]
  layout["app/layout.tsx<br/>&lt;html className={fontVariables}&gt;"] --> fonts
```

- **토큰은 두 겹**입니다. 아래 겹은 의미 변수(`--paper`), 위 겹은 Tailwind 토큰(`--color-paper`)입니다. 화면 모드가 바뀌면 아래 겹의 값만 바뀌고, 컴포넌트 코드는 그대로입니다.
- `@theme inline`은 "값이 아니라 변수 참조를 그대로 넣어라"는 뜻입니다. 그래서 모드 전환이 즉시 반영됩니다.
- **화면 모드 우선순위**: 사용자가 고른 값(`data-theme`) > 시스템 설정(`prefers-color-scheme`) > 밝은 화면(기본)
- **글꼴**: `next/font`가 빌드할 때 Google Fonts에서 파일을 받아 사이트에 함께 올립니다. 방문자는 Google 서버에 요청하지 않습니다. 한글 글꼴은 글자 범위별로 나뉜 파일 중 필요한 것만 받습니다.
- 16진수 색은 `globals.css`에서만 쓸 수 있습니다(Biome `noHexColors`). 다른 파일은 토큰을 써야 합니다.

## 10. 다음 단계에서 이어질 부분

```mermaid
flowchart LR
  B["브라우저"] --> V["Vercel: Next.js"]
  V -- "/api/* (3단계 rewrites)" --> Wk["Workers: Hono"]
  Wk --> DB[("Neon Postgres (2단계)")]
  Wk --> GH["GitHub API (4단계 제보 → 이슈)"]
  Wk --> KK["카카오톡 알림 (4단계)"]
  Wk --> Q["Queues · Cron (5단계)"]
  Wk --> AI["Workers AI · Vectorize (6단계)"]
```
