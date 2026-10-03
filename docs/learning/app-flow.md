# 앱 흐름 (1단계 진행 중 기준)

지금까지 만들어진 것이 **어떤 순서로 움직이는지** 정리한 문서입니다. 커밋마다 흐름이 바뀌면 갱신합니다.

| 갱신 | 바뀐 흐름 |
|---|---|
| 0단계 | 골격: web·api·shared, 검사·CI |
| 1단계 (콘텐츠·토큰) | 콘텐츠 파이프라인(MDX → Velite), 디자인 토큰(@theme, 글꼴, 화면 모드) — 8·9절 |
| 1단계 (케이스 열기 시제품) | 서버 → 클라이언트 데이터 전달, 케이스 열기 연출 — 10절 |
| 1단계 (홈 진열장) | 공통 레이아웃(헤더·푸터), 화면 모드 저장·초기화, 진열장 화면 구성 — 11절. 시제품 페이지 `/lab/case`는 삭제 |

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

## 10. 케이스 열기 (지금은 홈 진열장에서 사용)

### 데이터가 화면까지

```mermaid
flowchart LR
  c["@arqhive/content<br/>patches(본문 포함, 큼)"] --> p["pages/case-lab<br/>case-lab-page.tsx (서버 컴포넌트)"]
  p -- "toCaseData()로 필요한 필드만" --> cl["case-lab-client.tsx<br/>('use client')"]
  cl -- "표지 목록" --> cover["entities/patch<br/>CaseCover"]
  cl -- "고른 작품" --> v["widgets/case-viewer<br/>CaseViewer"]
  v --> m["model/use-case-dialog.ts<br/>열기·닫기 상태"]
  v --> ui["ui/case-viewer.tsx · case-liner.tsx<br/>표지·속지·매체 배치"]
```

- **서버 → 클라이언트 경계에서 데이터 줄이기**: 서버 컴포넌트는 콘텐츠 전체를 읽지만, 클라이언트 컴포넌트에 넘기는 값은 브라우저로 전송됩니다. 그래서 `toCaseData()`로 케이스에 필요한 10개 필드만 골라 넘깁니다(MDX 본문 제외).
- **FSD 층 나누기**: 작품이 "어떻게 생겼나"(표지·디스크·팩)는 `entities/patch`, "어떻게 열리나"(연출·상태)는 `widgets/case-viewer`, 화면 조립은 `pages/case-lab`이 맡습니다. 위젯 안에서도 상태 로직은 `model/`, 화면은 `ui/` 칸으로 나눴습니다.

### 열고 닫는 순서

```mermaid
sequenceDiagram
  participant U as 사용자
  participant L as case-lab-client
  participant H as useCaseDialog
  participant D as <dialog>
  U->>L: 표지 클릭
  L->>L: originRef = 누른 표지, 그 표지는 invisible(자리만 남김)
  L->>H: selected = 작품
  H->>D: showModal() (포커스 가두기·ESC·배경 제공)
  H->>D: flyIn — 케이스를 누른 표지 자리에 겹쳐 두고(Invert) 가운데로 이동(Play)
  Note over D: Web Animations API, 0.65초<br/>표지 크기 → 한 칸 최대 480×640
  H->>H: 이동이 끝나면(finished) isOpen = true
  Note over D: CSS transition<br/>표지가 넘어감(데스크톱 rotateY / 휴대폰 rotateX)<br/>케이스가 반 칸 옮겨져 펼친 전체가 가운데로<br/>디스크 회전·팩 올라옴
  U->>D: ESC 또는 빈 곳 클릭
  D->>H: cancel / click(대상이 dialog일 때만)
  H->>H: isOpen = false (표지가 덮임, 0.9초)
  H->>D: flyOut — 누른 표지 자리로 돌아감
  H->>D: close()
  H->>L: onClosed → selected = null, 원래 표지 다시 보임
```

- **"동작 줄이기"** 설정을 켠 사용자는 transition 없이 바로 열고 닫습니다(`motion-reduce:`).
- **반응형**: md(768px) 이상은 가로로 펼침(왼쪽 속지·오른쪽 케이스), 그보다 좁으면 세로로 펼침(위 속지·아래 케이스)입니다.
- **크기**: 데스크톱은 케이스 한 칸 최대 480×640(펼치면 960×640), 화면이 작으면 높이 86%·폭 61% 안에 맞춰 줄어듭니다. 휴대폰은 펼친 전체가 화면 높이 88% 안에 들어가게 맞춥니다.
- **기종별 크기**: 실물 치수(mm)를 Wii 킵 케이스(190×135) 대비 비율로 맞춥니다(`case-spec.ts`의 `scale`·`aspect`·`faceHeight`·`viewerHeight`, 선반은 `SPINE_SIZES`). GC는 0.763배, 3DS·NDS는 0.611배이고 가로가 조금 긴 정사각형에 가깝습니다. 작은 케이스는 속지에서 줄거리를 빼고 글자를 줄입니다(`CaseLiner`의 compact).
- **FLIP**: First(처음 위치) → Last(끝 위치) → Invert(끝 위치의 요소를 처음 위치로 보이게 transform) → Play(transform을 없애며 이동). 위치를 바꾸는 대신 transform만 움직여서 부드럽습니다.

### GC·SFC·GB·GBA: 종이상자에서 꺼내 여는 단계

GC 소프트는 검은 킵 케이스가 종이상자에 한 번 더 들어 있습니다. 그래서 열기·닫기를 **단계(phase)** 로 나눴습니다.

```mermaid
stateDiagram-v2
  [*] --> closed
  closed --> lid: flyIn이 끝남 (GC만)
  lid --> unboxed: 0.45초 뒤 — 뚜껑이 열림
  unboxed --> open: 0.65초 뒤 — 상자가 아래로 빠짐
  closed --> open: flyIn이 끝남 (GC 말고는 바로)
  open --> unboxed: 닫기 — 표지 덮기 0.9초 (GC)
  unboxed --> lid: 상자가 다시 올라옴 0.65초
  lid --> closed: 뚜껑이 닫힘 0.45초
  closed --> [*]: flyOut → dialog 닫기
```

- **순서는 데이터로**: `widgets/case-viewer/lib/phases.ts`의 `openSteps`·`closeSteps`가 "어느 단계로 바꾸고 몇 ms 기다릴지" 목록을 돌려주고, `runSteps`가 차례로 밟습니다. 훅(`model/use-case-dialog.ts`)은 순서를 몰라도 됩니다.
- **취소**: 열기 도중 닫으면 앞 순서가 남은 단계를 계속 밟으면 안 됩니다. 순서마다 번호(`runRef`)를 받고, 번호가 바뀌면 멈춥니다.
- **화면은 단계만 읽음**: 상자 `CaseOuterBox`는 `lidOpen = phase !== 'closed'`, `unboxed = phase가 unboxed·open`을 받아 CSS transition으로 움직입니다. 표지가 넘어가는 조건은 `phase === 'open'`입니다.
- **카트리지 상자(SFC·GB·GBA, form `carton`)**: 같은 단계를 밟습니다. 상자가 빠지면 설명서(`ManualFront`)와 그 아래 카트리지(`Cartridge`)가 드러나고, 설명서가 펼쳐지면 안쪽 면(`ManualInner`)에 패치 정보가 보입니다. 상자가 있는지는 `hasOuterBox(spec)` 하나로 판단합니다.
- **앞면**: 넘어가는 앞면은 `CaseFront`입니다. GC는 표지가 상자에 인쇄되어 있으므로 게임 이름만 쓴 검은 케이스 앞면이고, 진열장의 표지(`CaseCover`)는 상자 앞면입니다. 선반 등줄기도 상자 옆면이라 흰 종이에 윗부분만 검은 기종 띠(`paper-band`)이고, 윗뚜껑은 상자 앞면과 같은 기종 색(`caseClass`)에 판지 테두리(`paper-lid`)만 더합니다.

## 11. 홈 진열장 (`/`)

### 화면이 조립되는 길

```mermaid
flowchart TB
  root["app/layout.tsx (루트)<br/>글꼴·전역 CSS·화면 모드 초기화 스크립트"] --> grp["app/(site)/layout.tsx"]
  grp --> sl["src/app/layouts/site-layout.tsx (FSD app 층)<br/>SiteHeader + main + SiteFooter"]
  grp --> page["app/(site)/page.tsx → src/pages/home"]
  page --> hp["home-page.tsx (서버)<br/>콘텐츠 읽기 → toCaseData → 분류 번호 순 정렬<br/>최근 갱신 3개 고르기"]
  hp --> hc["home-client.tsx ('use client')<br/>상태: 필터 · 보기(진열장/목록) · 꺼낸 작품"]
  hc --> tb["home-toolbar.tsx<br/>기종 필터 · 보기 전환"]
  hc --> fo["widgets/shelf FaceOutRow<br/>최근 갱신 표지"]
  hc --> sh["widgets/shelf Shelf<br/>기종별 선반(등줄기)"]
  hc --> pt["widgets/patch-table<br/>목록(표·카드)"]
  hc --> cv["widgets/case-viewer"]
```

- **왜 헤더·푸터가 app 층인가**: 모든 공개 페이지에 공통이라 화면(pages)이 아니라 앱 전체 틀(app 층)의 일입니다. Next.js의 `app/(site)/layout.tsx`는 FSD의 `SiteLayout`을 불러오기만 합니다.
- **필터·보기 전환을 features로 빼지 않은 이유**: 지금은 홈에서만 씁니다. FSD도 "여러 곳에서 쓰이기 전까지는 쓰는 곳 가까이"를 권합니다.
- **누른 요소 감추기**: 같은 작품이 "최근 갱신"과 선반에 동시에 있을 수 있어서, 작품이 아니라 **실제로 누른 요소**(`element.style.visibility`)를 감추고 닫힐 때 되돌립니다.

### 화면 모드(밝게·어둡게)

```mermaid
sequenceDiagram
  participant B as 브라우저
  participant S as 초기화 스크립트(head)
  participant R as React
  participant T as ThemeToggle
  B->>S: HTML을 받자마자 실행(beforeInteractive)
  S->>B: localStorage에 저장값 있으면 <html data-theme> 설정
  Note over B: 첫 화면부터 올바른 색(번쩍임 없음)
  R->>T: hydration (처음엔 theme=null → "화면")
  T->>T: useEffect에서 현재 모드 읽기 → "밝게"/"어둡게"
  T->>B: 누르면 data-theme 변경 + localStorage 저장
```

- 저장값이 없으면 시스템 설정(`prefers-color-scheme`)을 따릅니다(globals.css의 미디어 쿼리).
- 버튼 글자를 처음에 `null`("화면")로 두는 이유: 서버는 사용자의 모드를 모르므로, 서버 HTML과 브라우저 첫 렌더를 같게 해야 hydration 오류가 나지 않습니다.

## 12. 다음 단계에서 이어질 부분

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
