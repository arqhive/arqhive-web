# 앱 흐름 (0단계 기준)

0단계(골격)까지 만들어진 것이 **어떤 순서로 움직이는지** 정리한 문서입니다. 단계가 진행되면 갱신합니다.

> 아직 web과 api는 서로 연결되어 있지 않습니다. 둘을 잇는 `/api/*` 프록시는 3단계에서 붙입니다(마지막 절 참고).

## 1. 전체 그림

```mermaid
flowchart LR
  subgraph repo["모노레포 arqhive-web"]
    shared["packages/shared<br/>기종 목록·Zod 스키마"]
    tsconfig["packages/tsconfig<br/>엄격한 TS 설정"]
    web["apps/web<br/>Next.js + FSD"]
    api["apps/api<br/>Hono on Workers"]
  end
  shared -- "import @arqhive/shared" --> web
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
  s1 --> s2["biome ci (린트·포맷)"]
  s2 --> s3["turbo run typecheck lint:fsd test build"]
  s3 --> ok["✓ 통과 → 병합 가능<br/>(main 보호 설정 시)"]
```

| 검사 | 도구 | 잡는 것 |
|---|---|---|
| 린트·포맷 | Biome | 코드 스타일, 흔한 실수, 접근성, 보안 패턴 |
| 타입 | tsc (+ next typegen, wrangler types) | 타입 오류, 없는 라우트 링크 |
| FSD 규칙 | Steiger | 층 import 방향, 공개 창구 우회 |
| 테스트 | Vitest | shared 스키마, api health |
| 빌드 | next build, wrangler | 실제로 배포 가능한 결과물이 나오는지 |

## 8. 다음 단계에서 이어질 부분

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
