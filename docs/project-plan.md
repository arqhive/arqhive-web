# arqhive-web 기획 정리

- 작성일: 2026-10-03
- 상태: 기획 단계(코드 없음). 아래 결정은 언제든 바뀔 수 있으며, 바뀌면 이 문서와 ADR에 기록한다.

## 1. 개요

| 항목 | 내용 |
|---|---|
| 사이트 이름 | **arqhive** (읽기: **아카이브**) |
| 부제 | 한글 패치 아카이브 |
| 프로젝트(저장소) 이름 | `arqhive-web` |
| 목적 | 지금까지 만든 게임 한글 패치를 소개하는 사이트 + 포트폴리오 |
| 만드는 사람 | 8년 차 프론트엔드, 백엔드 경험 조금 → **풀스택**으로 보여 주기 |
| 주 언어 | **TypeScript** (Java 제외) |
| 운영 비용 | **0원.** 처음에는 카드 등록도 필요 없음 |
| 운영 방식 | **완전 서버리스.** Docker와 VM은 선택 사항(12장) |
| 계정 | **회원 기능 없음.** 제보는 로그인 없이 받아 사용자 이름으로 GitHub 이슈에 등록(13장) |
| 주소 | `arqhive.vercel.app` (쓰이고 있으면 `arqhive-patches`) |

### 기본 원칙

- 패치 파일은 지금처럼 **각 패치 저장소의 GitHub Releases**에 두고, 사이트는 소개와 링크만 맡는다.
- 롬·ISO 같은 원본 게임 파일은 어디에도 올리지 않는다.
- 기술은 많이 넣되, **이 사이트의 실제 기능에 연결되는 이유**가 있는 것만 넣는다. 보여 주기만을 위한 기술은 넣지 않는다.
- 직접 관리해야 하는 서버를 두지 않는다.
- 방문자의 개인정보를 받지 않는다.

## 2. 무료 운영 방침

### 검토한 안

| 안 | 구성 | 결론 |
|---|---|---|
| 정적 사이트 | Next.js 정적 내보내기 + Cloudflare Pages | 서버 기능이 없어 부족 |
| 서버리스 | Vercel + Cloudflare Workers + 서버리스 DB | **채택** |
| 무료 VM | Oracle Cloud Always Free + Docker | **선택 사항으로 뺌**(12장): 이 규모에서는 기능상 필요 없고, 로컬에만 Docker를 두는 건 보여 주기식이라 의미가 적음 |
| AWS | SST + Lambda/DynamoDB/CloudFront | **제외**: 2025년 7월 개편 후 새 계정은 크레딧 + 6개월이고, 이후 유료 전환이 필요함 |

### 무료를 유지하기 위한 규칙

- Vercel Hobby는 **비상업용**이다. 후원 버튼과 광고는 달지 않는다.
- 사이트 저장소는 **공개**로 둔다(GitHub Actions 무제한 + 포트폴리오 공개).
- 한도를 넘으면 요금이 붙지 않고 멈추는 서비스만 쓴다. 한도를 넘으면 과금되는 서비스(예: Cloudflare R2)는 지금 계획에 넣지 않는다.
- 무료 한도·요금처럼 바뀌는 수치는 **결정 근거로 쓰거나 문서에 적기 전에 검색해서 확인**하고 확인 날짜를 적는다. 확인하지 못한 수치는 "미확인"으로 표시한다.

## 3. 기술 스택

### 전체 구성

```
Next.js (Vercel) ── /api/* 프록시 ──▶ Hono (Cloudflare Workers)
                                        ├─ Neon Postgres + Drizzle   ← 작품·릴리즈·제보 사본
                                        ├─ Turnstile + 요청 제한      ← 제보 스팸 1차 차단
                                        ├─ Workers AI                 ← 제보 스팸·욕설 판별, 임베딩
                                        ├─ Vectorize                  ← 비슷한 제보 찾기
                                        ├─ Queues                     ← 이슈 생성, 동기화, 알림
                                        ├─ Cron Triggers              ← 다운로드 수·이슈 상태 동기화
                                        └─ GitHub API (개인 토큰)     ← 제보를 내 이름으로 이슈 등록
패치 파일 → GitHub Releases (링크만) / 제보 → 각 패치 저장소 Issues / 작품 소개 → MDX
댓글 → giscus / 통계 → Umami Cloud / 알림 → 카카오톡(나에게 보내기)
```

### 영역별 선택

| 영역 | 선택 | 무료 한도 | 카드 |
|---|---|---|---|
| 프론트 | Next.js (App Router, RSC) on **Vercel Hobby** | 개인·비상업 | 불필요 |
| API | **Hono** on **Cloudflare Workers** | 하루 10만 요청 | 불필요 |
| DB | **Neon** Postgres + **Drizzle** | 0.5GB, 자동 절전 | 불필요 |
| 계정 | **없음** | — | — |
| 제보 등록 | GitHub **fine-grained 개인 토큰**(이슈 쓰기 권한만, 패치 저장소만) | GitHub API 시간당 5,000회 | — |
| 검증·타입 | Zod + `@hono/zod-openapi`, Hono RPC 클라이언트 | — | — |
| 스팸 방지 | Cloudflare Turnstile + 요청 제한 + Workers AI 판별 | 무료 | 불필요 |
| 요청 제한 | Upstash Redis 또는 Workers rate limit | 월 50만 명령 | 불필요 |
| AI | Cloudflare **Workers AI + Vectorize** | 하루 무료 한도 | 불필요 |
| 작업 큐 | **Cloudflare Queues** | 하루 1만 작업(읽기·쓰기·삭제 합산), 메시지 24시간 보관 (2026-10-03 확인) | 불필요 |
| 정기 작업 | **Workers Cron Triggers** | 계정당 5개, 실행당 CPU 10ms, 요청당 하위 요청 50개 (2026-10-03 확인) | 불필요 |
| 검색 | 작품: 브라우저 안 검색 + **es-hangul**(초성 검색), 제보: Postgres `pg_trgm` + Vectorize | — | — |
| 알림 | **카카오톡 "나에게 보내기"** API. 실패하면 DB(`notifications`)에 쌓아 두고 다음 Cron에서 다시 보냄. 디스코드 등 다른 알림 수단은 두지 않음(2026-10-03 결정) | 무료(받는 사람이 본인뿐이라 서비스 심사 불필요) | 불필요 |
| 방문 통계 | **Umami Cloud** Hobby | 월 10만 이벤트, 사이트 3개, 6개월 보관 (2026-10-03 확인) | 가입 시 확인 |
| 오류·로그 | Sentry(개발자 플랜), Workers Logs, Vercel 로그 | Workers Logs 무료 한도는 미확인 | 불필요 |
| 작품 이미지 | 저장소에 원본, CI에서 sharp로 변환해 Vercel 정적 파일로 제공 | — | — |
| 패치 파일 | GitHub Releases | 파일당 2GB | — |
| 댓글 | giscus | 무료 | — |
| UI | Tailwind CSS v4, shadcn/ui(동작만, 모양은 재정의), Motion | — | — |
| 상태·요청 | TanStack Query, Zustand(필요할 때만) | — | — |
| 콘텐츠 | MDX + Velite(Zod 스키마) | — | — |
| 테스트 | Vitest, Playwright, Storybook + Chromatic | Chromatic 월 5천 스냅샷 | 불필요 |
| 모노레포 | pnpm + Turborepo | 원격 캐시 무료 | — |
| CI/CD | GitHub Actions | 공개 저장소 무제한 | — |

### TypeScript 밖의 언어

꼭 다른 언어가 필요한 부분은 없다. 아래 설정 언어만 조금 다룬다.

- SQL: DB 마이그레이션(Drizzle이 자동 생성)
- YAML: GitHub Actions

### 설계 포인트

1. **같은 출처 유지**: 브라우저는 `arqhive.vercel.app` 하나만 본다. `/api/*`는 Next.js rewrites로 Workers에 프록시한다. CORS 설정이 필요 없고 API 주소가 바깥에 드러나지 않는다.
2. **프론트와 API 분리 배포**: Next.js 전체를 Workers 무료 플랜에 올리면 용량 제한(압축 약 3MB)과 CPU 제한(10ms)에 걸리기 쉽다. 가벼운 Hono만 Workers에 올린다.
3. **타입 공유**: `packages/shared`의 Zod 스키마를 API 검증과 프론트 호출에 함께 써서, 프론트부터 DB까지 타입을 이어 간다.
4. **한 Worker가 세 가지 일을 함**: api Worker가 HTTP 요청(`fetch`), 큐 메시지 처리(`queue`), 정기 실행(`scheduled`)을 모두 맡는다. 서버를 따로 두지 않는다.
5. **무료 한도 안에서 나눠 처리**: Cron 한 번에 하위 요청이 50개까지라, Cron은 "저장소별 동기화 메시지"만 큐에 넣고 실제 GitHub 호출은 큐 처리기가 하나씩 한다.
6. **AI 대체 경로**: Workers AI가 하루 한도를 넘으면 검색은 Postgres로, 스팸 판별은 "검토 대기"로 대체한다.
7. **토큰은 서버에만**: GitHub 토큰은 Workers 비밀값(secret)으로만 두고 브라우저에는 절대 보내지 않는다. 권한은 "선택한 패치 저장소의 이슈 쓰기"뿐이라, 새어 나가도 할 수 있는 일이 이슈 작성으로 한정된다.

## 4. 콘텐츠 운영 결정

| 항목 | 결정 |
|---|---|
| 중단된 작품 | **사이트에 넣지 않음** (예: 원더풀 101, 크리스탈 베어러, 천지창조) |
| 비공개 릴리즈 작품 | **"작업 중"으로 표시, 다운로드와 제보는 숨김** (예: 파르테나의 거울 3DS, 어나더 코드 R, GB 키드 이카루스) |
| 제보 | **로그인 없이** 사이트에서 작성 → 해당 패치 저장소에 **사용자 이름으로 이슈 등록**. 이슈가 공개라 누구나 읽을 수 있음 |
| 제보 관리 | **GitHub에서** 라벨·닫기·릴리즈 연결로 처리. 사이트에 관리자 화면 없음 |

이 결정들은 코드가 아니라 MDX의 `status`·`visibility` 값과 설정으로 처리한다. 결정이 바뀌면 값만 고친다.

## 5. 페이지 구성

```
/                         홈 (진열장)
/patches                  패치 목록
/patches/[slug]           패치 상세
/patches/[slug]/reports   해당 패치의 제보 목록
/guides                   적용 가이드 목록
/guides/[slug]            가이드 상세
/reports                  전체 제보 목록
/reports/new              제보 작성 (로그인 없음)
/reports/[id]             제보 상세 (GitHub 이슈로 가는 링크 포함)
/search                   통합 검색
/about                    소개·원칙·FAQ
/colophon                 판권면(글꼴·색·기술·디자인 결정)
/feed.xml                 새 릴리즈 RSS
```

### 주요 페이지 내용

- **홈**: 진열장(10장). 최근 릴리즈, 작업 중인 작품, 기종별 필터
- **패치 목록**: 기종·상태 필터, 정렬(최근 릴리즈·이름·다운로드 수), 진열장 보기/목록 보기 전환
- **패치 상세**
  - 제목(한글·원제), 기종, 상태, 최신 버전
  - 원문/한글 **전후 비교 슬라이더**
  - 소개, 번역 범위(텍스트·그래픽), 사용 글꼴
  - **다운로드**: GitHub Releases 링크, 파일 크기, 다운로드 수("작업 중"이면 숨김)
  - **필요한 원본**: 리전, 게임 ID, 덤프 형식, MD5
  - **적용 방법**: 해당 패처 가이드로 연결
  - **호환 표**: 실기·Dolphin·Cemu·Azahar 등 환경별 동작 여부
  - 알려진 문제, 버전별 변경 이력
  - 최근 제보 요약, "제보하기" 버튼, giscus 댓글
- **적용 가이드**: 패처 방식별로 한 번만 쓰고 여러 작품에서 함께 쓴다(xdelta, 디스크 파일 단위 패처, 3DS LayeredFS·CIA, Wii U SDCafiine, DSiWare 등).
- **제보 작성**: 작품 → 버전 → 유형 → 실행 환경 → 게임 속 위치 → 내용 → 스크린샷 링크(선택) → 닉네임(선택). 작성하는 동안 비슷한 기존 제보를 실시간으로 보여 준다(Workers AI). 보낸 뒤에는 "등록됨(이슈 링크)" 또는 "검토 후 등록" 안내
- **제보 목록·상세**: GitHub 이슈의 사본을 보여 준다. 처리 상태(접수, 확인, 수정됨 등)는 이슈 라벨과 닫힘 여부에서 가져온다.
- **검색**: 작품은 초성 검색 지원(예: "ㅅㅌㅍㅅ" → 스타폭스), 제보는 낱말 검색 + 의미 검색
- **자동 생성**: 작품별 OG 이미지(`next/og`), sitemap, robots, RSS

## 6. 데이터 모델

### 데이터를 두는 곳

| 데이터 | 원본을 두는 곳 |
|---|---|
| 작품 소개, 적용 방법, 원본 요건, 호환 정보, 스크린샷 | 저장소의 **MDX**(frontmatter를 Zod로 검사) → 배포할 때 DB로 동기화 |
| 릴리즈 버전, 다운로드 수 | **GitHub Releases → DB 동기화** |
| 제보 | **GitHub Issues**가 원본, DB에는 검색·목록용 사본 |
| 검토 대기 제보 | DB(`report_submissions`) |
| 검색 | 작품: 빌드할 때 만든 색인(브라우저), 제보: Postgres `pg_trgm` + Vectorize 임베딩 |
| 작업 큐 | Cloudflare Queues(최대 24시간 보관) |
| 방문 통계 | Umami Cloud |

### 작품·릴리즈

**`projects`**: 작품 하나(게임 + 기종 조합)

| 필드 | 설명 |
|---|---|
| id, slug | 예: `star-fox-adventures` |
| title_ko, title_original, title_en | 한글 제목, 원제, 영문 제목 |
| platform | `wiiu`, `3ds`, `nds`, `dsiware`, `wii`, `gc`, `n64`, `sfc`, `gb`, `gba` |
| base_region | 번역 대상 원본 리전(JP·EU 등) |
| status | `released`, `in_progress`, `testing`, `paused`, `cancelled` |
| visibility | `public`, `listed_private`(소개만 보이고 다운로드·제보 숨김), `hidden` |
| repo_owner, repo_name | GitHub 저장소(없을 수 있음). 제보 이슈도 여기에 등록 |
| patch_method | 가이드 slug(예: `disc-file-patcher`) |
| summary, featured, sort_order | 요약, 대표작 여부, 정렬 순서 |
| started_at, updated_at | 시작일, 수정일 |

**`releases`**: project_id, version, tag, title, notes_md, released_at, is_latest, is_prerelease. GitHub 릴리즈와 1:1로 대응한다.

**`release_assets`**: release_id, name, size, download_url, download_count, synced_at

**`base_requirements`**: project_id, region, game_id/title_id, dump_format, md5, sha1, note. 작품당 여러 줄이 가능하다(예: 어나더 코드 R은 EU판과 JP판).

**`compatibility`**: project_id, environment, status(`works`, `issues`, `broken`, `untested`), tested_version, note

**`media`**: project_id, kind(`cover`, `before_after`, `screenshot`), before_path, after_path(정적 파일 경로), caption, width, height, sort_order

### 제보

**`reports`**: GitHub 이슈의 사본

| 필드 | 설명 |
|---|---|
| id | 사이트 안 번호 |
| project_id, release_id | 대상 작품과 버전 |
| repo, issue_number, issue_url | 원본 이슈 |
| type | `mistranslation`, `untranslated`, `text_overflow`, `broken_glyph`, `crash`, `patch_fail`, `other` (이슈 라벨과 대응) |
| title, body_md | 제목, 본문 |
| nickname | 제보자 닉네임(선택, 검증 없음) |
| environment, environment_version, location | 실행 환경, 게임 속 위치 |
| state, labels | 이슈 열림·닫힘, 라벨(처리 상태 판단에 사용) |
| source | `site`(사이트 제보), `github`(GitHub에서 직접 등록) |
| created_at, closed_at, synced_at | 날짜 |

**`report_submissions`**: 검토 대기 제보. 제보 내용, 판별 결과(`pass`, `suspicious`, `rejected`), 처리 결과, 만료 시각. 승인되면 이슈로 등록하고 지운다.

### 알림

**`notifications`**: 보낼 카카오톡 알림. kind(`new_report`, `review_request`), 내용, 버튼 링크, status(`pending`, `sent`, `failed`), attempts, last_error, created_at, sent_at. 보내면 `sent`로 바꾸고, 실패하면 `pending`으로 남겨 다음 Cron에서 다시 보낸다. 오래된 `sent`는 정기적으로 지운다.

**`integration_tokens`**: 카카오 토큰 보관(짧은 토큰, 갱신용 토큰, 만료 시각). Cron이 만료 전에 갱신한다. 토큰 값은 암호화해서 저장한다.

계정이 없으므로 사용자·세션 표는 없다. 요청 제한에는 IP를 그대로 저장하지 않고, 짧게 유지되는 해시값만 쓴다.

### 데이터 흐름

1. **패치 릴리즈**: 패치 저장소 릴리즈 → `repository_dispatch` → api가 동기화 메시지를 큐에 넣음 → 큐 처리기가 `releases`·`release_assets` 갱신 → 페이지 재검증, RSS 갱신
2. **사이트 배포**: MDX 검증 → `projects`·`base_requirements`·`compatibility`·`media` 동기화 → 작품 검색 색인 생성(빌드 산출물)
3. **제보 작성**: Turnstile → 요청 제한 → Workers AI 판별 → (통과) 큐 → **사용자 이름으로 이슈 생성** → `reports` 사본·임베딩 저장 → 카카오톡 알림 / (의심) `report_submissions`에 보관 → 카카오톡으로 승인 요청(13장)
4. **알림**: 알림을 `notifications`에 먼저 쓰고 바로 카카오톡으로 보냄 → 실패하면 남겨 둠 → Cron이 남은 알림을 다시 보내고, 카카오 토큰도 만료 전에 갱신
5. **이슈 상태 동기화**: Cron이 저장소별 동기화 메시지를 큐에 넣음 → 큐 처리기가 제보 라벨이 붙은 이슈의 상태·라벨을 `reports`에 반영
6. **정기 작업**: 다운로드 수 동기화도 같은 방식

## 7. 모노레포 구조(확정, 2026-10-03)

### 폴더 구조

```
arqhive-web/
├─ apps/
│  ├─ web/                    @arqhive/web      Next.js (Vercel), FSD 구조
│  │  ├─ app/                 Next.js 라우팅 전용(얇게): 각 page.tsx는 src/pages의 화면을 불러오기만 함
│  │  │  ├─ (site)/           홈, patches, guides, reports, search, about, colophon
│  │  │  ├─ feed.xml/         RSS
│  │  │  └─ opengraph-image   OG 이미지 자동 생성
│  │  ├─ pages/               비워 둠(README만). Next.js가 src/pages를 옛 Pages Router로 착각하지 않게 막는 용도
│  │  ├─ src/                 FSD 층(위 층은 아래 층만 가져다 씀)
│  │  │  ├─ app/              앱 전체 설정: 프로바이더, 전역 스타일, 글꼴
│  │  │  ├─ pages/            화면 단위 조립: home, patch-detail, report-new, search …
│  │  │  ├─ widgets/          큰 화면 블록: shelf(진열장), case-viewer(케이스 열기), site-header, report-list
│  │  │  ├─ features/         사용자 행동: report-submit(제보 작성), platform-filter, view-toggle, title-morph, search-box
│  │  │  ├─ entities/         업무 개념: project, release, report, platform
│  │  │  └─ shared/           공용: api 클라이언트, ui(packages/ui 연결), lib, config
│  │  ├─ e2e/                 Playwright 테스트
│  │  └─ public/              변환된 작품 이미지
│  └─ api/                    @arqhive/api      Hono (Cloudflare Workers), 기능별 모듈
│     ├─ src/
│     │  ├─ modules/          기능 하나에 라우트·서비스·큐 처리기·Cron이 함께 있음
│     │  │  ├─ projects/      작품 읽기
│     │  │  ├─ releases/      릴리즈·다운로드 수 동기화
│     │  │  ├─ reports/       제보 접수·판별·이슈 생성·이슈 동기화·검토 승인
│     │  │  ├─ search/        검색·임베딩
│     │  │  ├─ notifications/ 카카오톡 전송·재전송·토큰 갱신
│     │  │  └─ webhooks/      repository_dispatch 수신
│     │  ├─ platform/         여러 모듈이 함께 쓰는 것: GitHub·Workers AI·카카오 클라이언트, 요청 제한, Turnstile, 오류 처리
│     │  └─ index.ts          fetch·queue·scheduled 진입점(각 모듈로 나눠 보냄)
│     ├─ test/
│     └─ wrangler.jsonc       Queues·Cron·AI·Vectorize 바인딩
├─ packages/
│  ├─ shared/                 @arqhive/shared   Zod 스키마, 공용 타입·상수, 큐 메시지 형식, 이슈 본문 양식
│  ├─ db/                     @arqhive/db       Drizzle 스키마, 마이그레이션, DB 연결
│  ├─ content/                @arqhive/content  MDX 스키마·로더(Velite), MDX→DB 동기화
│  ├─ ui/                     @arqhive/ui       공용 UI 컴포넌트 (shadcn), Storybook
│  └─ tsconfig/               @arqhive/tsconfig TS 기본 설정 (base, next, workers)
├─ content/
│  ├─ patches/<slug>/         index.mdx + 스크린샷 원본
│  └─ guides/                 적용 가이드 MDX
├─ scripts/                   이미지 변환(sharp) — CI에서 실행
├─ .github/
│  ├─ workflows/              ci, preview, deploy, images, codeql
│  ├─ workflows/notify-arqhive.yml  패치 저장소들이 불러 쓰는 재사용 워크플로
│  └─ issue-labels.yml        패치 저장소들에 맞출 제보 라벨 목록
├─ docs/
│  ├─ project-plan.md
│  ├─ design/                 디자인 시안
│  └─ adr/
├─ package.json  pnpm-workspace.yaml  turbo.json  biome.json
├─ renovate.json  .nvmrc  .env.example
```

### 패키지 사이의 의존 관계

```
web     → ui, shared, content, (api의 타입만)
api     → shared, db
content → shared, db
db      → shared
ui      → (독립)
모두    → tsconfig
```

- web은 db를 직접 쓰지 않는다. 데이터는 모두 api를 거친다.
- 정적 콘텐츠(MDX)는 빌드할 때 content에서 바로 읽는다.
- api의 타입은 Hono RPC로 web에 넘어간다(타입만, 런타임 코드는 넘어가지 않음).

### 워크스페이스별 패키지

**루트**

| 패키지 | 용도 |
|---|---|
| turbo | 작업 실행·캐시 |
| typescript | 공용 TS |
| @biomejs/biome | 린트 + 포맷(ESLint·Prettier 대체), 설정은 `biome.jsonc`. **최대한 엄격하게**: 권장 규칙 전부 오류 처리 + 권장 밖 규칙도 대부분 켬, 예외는 Next.js 규약 파일 등 꼭 필요한 곳만 (2026-10-03 결정) |
| lefthook | 커밋 전 검사(git hook) |
| vitest | 단위 테스트(워크스페이스 전체를 projects로 묶어 실행) |
| sharp | `scripts/`의 이미지 변환(CI 전용) |

**apps/web**

| 분류 | 패키지 |
|---|---|
| 기본 | next, react, react-dom |
| 스타일 | tailwindcss, @tailwindcss/postcss |
| 데이터 | @tanstack/react-query, hono(RPC 클라이언트 `hc`), zustand(필요할 때만) |
| 검색 | es-hangul(초성 검색) |
| 폼 | react-hook-form, @hookform/resolvers |
| 기타 | @giscus/react, @marsidev/react-turnstile, @sentry/nextjs |
| 개발 | @playwright/test, @lhci/cli, steiger(FSD 규칙 검사) |

**apps/api**

| 분류 | 패키지 |
|---|---|
| 기본 | hono, @hono/zod-openapi, @scalar/hono-api-reference(API 문서 화면) |
| DB | drizzle-orm, @neondatabase/serverless |
| GitHub | @octokit/rest |
| 요청 제한 | @upstash/ratelimit, @upstash/redis |
| 모니터링 | @sentry/cloudflare |
| 개발 | wrangler, @cloudflare/vitest-pool-workers |

Queues, Cron, Workers AI, Vectorize, Turnstile 검증, 카카오톡 메시지 API는 Workers 바인딩이나 fetch로 처리하므로 따로 패키지가 필요 없다.

**packages**

| 패키지 | 내용 | 주요 의존성 |
|---|---|---|
| shared | 기종·상태·제보 유형 상수, 제보 입력 Zod 스키마, 큐 메시지 형식, 이슈 본문 양식 | zod |
| db | 표 스키마, 마이그레이션, 연결 함수, 시드 | drizzle-orm, drizzle-kit, @neondatabase/serverless |
| content | MDX frontmatter 스키마, 타입이 붙은 콘텐츠 출력, MDX→DB 동기화 스크립트 | velite |
| ui | shadcn 컴포넌트, 전후 비교 슬라이더, 진열장, Storybook | radix-ui, class-variance-authority, clsx, tailwind-merge, lucide-react, motion, storybook, chromatic |
| tsconfig | 환경별 tsconfig 기본 설정 | — |

**버전 기준**: Node 24 LTS, pnpm 10.34. `packageManager` 필드와 `.nvmrc`로 고정한다. 각 패키지는 설치할 때의 최신 안정판을 쓰고, 이후에는 Renovate가 갱신한다. 단 **TypeScript는 6.0**(7.0은 네이티브 컴파일러라 기존 TS API가 없어 도구 호환 확인 전), **Vitest는 4.1**(`@cloudflare/vitest-pool-workers`가 Vitest 4만 지원)에 고정한다(ADR 0003, 2026-10-03).

### web의 FSD 적용 규칙 (2026-10-03 결정, 실무 경험 없이 배우며 적용)

- **층은 위에서 아래로만 가져다 쓴다**: `app → pages → widgets → features → entities → shared`. 같은 층의 다른 조각(slice)끼리는 가져다 쓰지 않는다.
- **조각마다 공개 창구(`index.ts`)를 둔다.** 바깥에서는 이 파일로만 가져다 쓴다.
- 조각 안은 용도별 칸(segment)으로 나눈다: `ui/`, `model/`(상태·로직), `api/`(서버 호출), `lib/`, `config/`
- **Next.js와 겹치는 이름 처리**: Next.js의 라우팅 폴더 `app/`은 프로젝트 맨 위에 두고 얇게 유지한다. FSD 층은 `src/` 아래에 둔다. 맨 위에 빈 `pages/` 폴더를 두어 Next.js가 `src/pages`를 Pages Router로 읽지 않게 한다.
- `packages/ui`(Storybook으로 관리하는 공용 컴포넌트)는 FSD 바깥의 디자인 시스템이고, web 안에서는 `shared/ui`를 거쳐서 쓴다.
- 규칙 검사는 FSD 공식 린터 **Steiger**로 하고, CI에도 넣는다.
- 애매한 경우(이게 feature인가 entity인가)는 ADR에 판단 이유를 남긴다. 배우는 과정 자체가 포트폴리오 자료가 된다.

### 공용 패키지 방식

- `packages/*`는 **빌드 없는 내부 패키지**로 둔다. TS 원본을 그대로 내보내고, 쓰는 쪽(Next.js, wrangler)이 함께 빌드한다. npm에 배포할 패키지가 없으므로 빌드 단계를 두지 않는다.
- 시작 템플릿(create-t3-app, Better-T-Stack 등)은 쓰지 않고 **직접 구성**한다. 모든 파일의 이유를 설명할 수 있게 하기 위해서다.

### 로컬 개발 (Docker 없이)

- DB: 운영 DB 대신 **Neon 개발 브랜치**
- Workers: `wrangler dev`가 Queues·Cron을 로컬에서 흉내 내 준다.
- GitHub 이슈 생성은 개발 중에는 **시험용 저장소**를 대상으로 한다.
- 프론트: `next dev`
- 모두 `pnpm dev` 하나로 함께 띄운다(Turborepo).

### 이름 통일

GitHub 저장소 `arqhive-web`, Vercel 프로젝트 `arqhive`, Workers `arqhive-api`, 큐 `arqhive-jobs`, 제보 라벨 `제보`(+ 유형 라벨)

## 8. 개발 플로우

### 단계

```
0 준비 → 1 정적 MVP(첫 공개) → 2 DB·동기화 → 3 API → 4 제보
      → 5 작업 큐·검색·통계 → 6 AI → 7 관측·품질 강화 → 8 패치 저장소 연동·마무리
```

1단계부터는 사이트가 계속 실제로 동작하는 상태를 유지하며, 기능과 CI를 함께 키워 간다.

| 단계 | 할 일 | 끝났을 때 결과 | 이 단계에서 추가되는 CI/CD | 규모 |
|---|---|---|---|---|
| 0 준비 | 계정 만들기(Vercel, Cloudflare, Neon), 모노레포 골격, TS·린트·포매터, ADR 폴더 | 빈 앱이 로컬에서 실행됨 | lint, 타입 검사, Vitest, Renovate | 작음 |
| 1 정적 MVP | MDX 스키마, 홈(진열장)·목록·상세·가이드·소개, shadcn·Storybook, 전후 비교 슬라이더, 공개 작품 일부 옮기기 | **첫 공개** | Vercel 미리보기·운영 배포, MDX 검사, 이미지 변환(sharp) | 중간 |
| 2 DB·동기화 | Neon + Drizzle, MDX→DB 동기화, GitHub 릴리즈·다운로드 수 동기화(처음엔 Actions cron), ISR, RSS, OG | 버전·다운로드 수 자동 표시 | 마이그레이션 검사, PR마다 Neon 브랜치 | 작음 |
| 3 API | Hono on Workers, `/api` 프록시, 작품·릴리즈 읽기 API, API 문서 화면 | web이 api를 거쳐 데이터를 읽음 | Workers 배포(`wrangler`), API 통합 테스트 | 작음 |
| 4 제보 | 제보 양식, Turnstile, 요청 제한, 큐 → **내 이름으로 이슈 생성**, 이슈 사본·목록·상세, 이슈 상태 동기화, 카카오톡 알림(실패 시 재전송), 검토 대기와 승인 링크 | **핵심 기능 완성** | Playwright E2E(시험 저장소 대상) | 큼 |
| 5 작업 큐·검색·통계 | 동기화를 Workers Cron·Queues로 이전, 검색 페이지(초성 검색, `pg_trgm`), Umami Cloud 연결(다운로드 클릭 등 이벤트) | 자동 동기화·검색·통계 | 큐 처리기 테스트 | 중간 |
| 6 AI | Workers AI 스팸 판별, 임베딩, Vectorize, 비슷한 제보 안내, 의미 검색(대체 경로 포함) | AI 기능 | 대체 경로 테스트 | 작음 |
| 7 관측·품질 | Sentry, Workers Logs, 성능 조정 | 오류 추적 | Lighthouse CI, Chromatic, CodeQL | 중간 |
| 8 연동·마무리 | 패치 저장소들에 릴리즈 알림 재사용 워크플로·제보 라벨 맞추기, README·아키텍처 그림·ADR 정리 | 릴리즈 한 번이면 사이트까지 반영 | `repository_dispatch` 수신 | 중간 |
| 선택 | Docker·VM 운영(12장) | — | — | — |

6단계 전까지는 AI 판별이 없으므로, 4단계에서는 **모든 사이트 제보를 검토 대기로** 받는다(13장).

### 일찍 챙길 것

- **4단계 전에**: GitHub fine-grained 개인 토큰 발급(13장), 카카오 디벨로퍼스 앱 만들기(카카오톡 메시지 전송 동의 항목, 웹 도메인 `arqhive.vercel.app` 등록), 이슈 시험용 저장소 만들기

### 기능 하나를 만드는 흐름

```
이슈 작성
  → 브랜치 생성
  → 로컬 개발: pnpm dev (next dev + wrangler dev, DB는 Neon 개발 브랜치)
  → PR
      ├─ lint · 타입 검사 · 단위 테스트
      ├─ 미리보기: Vercel + Workers + Neon 브랜치
      ├─ 미리보기 주소로 E2E · Lighthouse · Chromatic
      └─ 리뷰: 직접 + /code-review
  → main 병합
      ├─ DB 마이그레이션
      ├─ Workers → Vercel 운영 배포
      └─ Neon 브랜치 삭제
```

- 배포 순서는 **DB → API → 프론트**로 고정한다.
- 마이그레이션은 이전 버전 코드에서도 동작하는 방식(컬럼 추가 먼저, 삭제는 나중)으로만 한다.

## 9. CI/CD 정리

**일반**

- PR마다 lint, 타입 검사, FSD 규칙 검사(Steiger), Vitest, 빌드
- PR마다 미리보기 배포(Vercel + Workers + Neon 브랜치) → Playwright E2E, Lighthouse CI, Chromatic
- main 병합 시 마이그레이션 → 운영 배포 → Neon 브랜치 삭제
- Renovate, CodeQL

**이 사이트만의 것**

- **패치 저장소 연동**: 패치 저장소 릴리즈 → `repository_dispatch` → 해당 작품 페이지만 갱신(공개 저장소만 대상)
- **제보 라벨 맞추기**: `issue-labels.yml`의 라벨 목록을 패치 저장소들에 똑같이 적용
- **이미지 파이프라인**: 스크린샷을 WebP·AVIF로 변환하고 썸네일을 만들어 정적 파일로 배포
- **콘텐츠 검사**: MDX 필수 항목(기종, 버전, 원본 정보 등)이 빠지면 PR 실패
- 정기 작업(다운로드 수·이슈 상태 동기화)은 2단계에서는 Actions cron, 5단계부터 Workers Cron으로 옮긴다.

## 10. 디자인 방향 (2026-10-03 확정, 느낌만 가져감)

### 탈피할 것: AI가 만든 듯한 기본값

어두운 배경 + 보라·파랑 그라데이션, 반투명 유리 카드, 가운데 큰 제목 + 기능 카드 세 개 + 카드 격자, shadcn 기본 모양, Inter·Pretendard, `rounded-2xl`, 이모지, 뜻 없는 페이드 애니메이션. 기본값이 아닌 결정을 먼저 내리고 그 결정을 지킨다.

### 콘셉트: "진열장"을 중심으로 세 시안을 섞음

| 화면 | 가져올 시안 | 내용 |
|---|---|---|
| 홈 | **C 진열장** | 기종별 선반에 케이스가 꽂힌 책장. 사용자가 처음부터 구상했던 방향 |
| 목록 보기 | A 기록보관소 | 촘촘한 표형 목록(분류 번호, 기종, 판, 상태). 진열장 보기와 전환 |
| 상세 페이지 | B 번역 작업대 | 원문/한글 비교, 원제가 한글로 바뀌는 효과, 그 패치에 쓴 글꼴 |

### C 진열장에서 가져갈 느낌 (수정판 기준)

- **최신작은 표지가 보이게 진열**(서점 평대처럼), 나머지는 등줄기로 꽂음
- 등줄기는 **넓게, 글자는 크게**, 기종 표시는 가로로 눕힘(책장은 멋있지만 잘 안 읽히는 문제 보완)
- **기종 필터**를 누르면 나머지 케이스가 흐려짐
- 케이스를 누르면 **책장 앞으로 꺼내져 열리고**, 왼쪽 **속지에 패치 정보**와 "패치 보기" 버튼, 오른쪽 칸에 디스크(돌아감) 또는 팩
- 정보를 책장 아래에 띄우는 방식은 쓰지 않음(1차 시안에서 탈락)
- "작업 중" 작품은 속지에 다운로드 대신 공개 전 안내

### 지킬 것

- 케이스는 기종 느낌만 낸 일반 도형으로 만들고, **닌텐도 로고나 고유 디자인은 따라 하지 않는다.**
- **박스아트는 저작권 때문에 쓰지 않는다.** 글자로 디자인한 표지를 기본으로 하고, 필요하면 직접 찍은 한글화 화면을 쓴다.
- **휴대폰**에서는 선반을 가로로 넘기게 하거나 "목록 보기"를 기본으로 한다.
- 실제 구현에서는 CSS 3D 또는 Three.js로 케이스 연출을 다듬고, 디스크가 빠져나와 상세 페이지로 이어지는 전환(View Transitions)을 검토한다.
- 글꼴·색·격자는 기본값을 쓰지 않는다(예: 본문은 Pretendard 대신 다른 고딕, 제목·번호에 명조나 픽셀 글꼴, 패치에 실제로 쓴 글꼴은 라이선스 확인 후 사용).
- 디자인 결정은 ADR과 `/colophon`(판권면) 페이지에 남긴다.

### 시안 보관

- `docs/design/concept-c-shelf.html`: 확정 방향인 C 진열장 수정판. 브라우저로 열면 케이스 열기·필터를 직접 눌러 볼 수 있다.
- `docs/design/concept-a-archive.html`, `docs/design/concept-b-workbench.html`: 목록 보기·상세 페이지에 섞을 A·B 시안(참고용)
- 작업 순서: 참고 자료 모으기(게임 설명서, 게임 잡지, 도서관 목록 카드) → 흑백 와이어프레임 → 디자인 토큰 → 대표 장치(케이스 열기, 제목 바뀌는 효과) 시제품 → 페이지 구현

## 11. 다음 할 일

- [ ] 0단계: 계정 만들기(Vercel, Cloudflare, Neon — Neon은 Postgres만, 리전은 싱가포르), `arqhive.vercel.app` 주소 확인
- [x] 모노레포 폴더 구조와 패키지 목록 확정
- [x] Docker·VM을 선택 사항으로 빼고 완전 서버리스로 전환(2026-10-03)
- [x] 회원 기능 제외, 제보는 내 이름으로 GitHub 이슈 등록(2026-10-03)
- [x] 첫 ADR 작성(0001~0008, `docs/adr/`)
- [x] 0단계 골격: 루트 설정(pnpm·Turborepo·Biome 엄격·TS 엄격·lefthook·Renovate), web(FSD)·api(모듈) 최소 앱, `packages/shared`·`tsconfig`, CI(2026-10-03). `db`·`content`·`ui`는 해당 단계에서 채움
- [x] 디자인 방향 확정(C 진열장 중심, A·B 혼합) 및 시안 보관
- [ ] 디자인 참고 자료 모으기 → 흑백 와이어프레임 → 디자인 토큰(1단계 안에서)
- [ ] 사이트에 올릴 작품 목록 확정(중단작 제외, 비공개 릴리즈는 "작업 중")

## 12. 선택 사항: Docker·VM 운영 (현재 계획에서 제외)

나중에 "운영 서버를 직접 굴려 봤다"는 경험이 필요해지면 붙인다. 지금 구조는 VM 없이 완결되므로, 붙이더라도 부가 기능만 옮긴다.

### 뺀 이유 (2026-10-03)

- 이 사이트 규모에서는 작업 큐·검색·통계·관측을 모두 서버리스나 무료 서비스로 대신할 수 있다.
- 로컬에만 Docker를 두는 건 보여 주기식이라 의미가 적다.
- VM 때문에 생기는 복잡도(Tunnel, 도메인, Tailscale, 보안 업데이트, 회수 위험)가 크다.

### 붙인다면 참고할 것

- **Oracle Cloud Always Free ARM**: 2026-06-15부터 무료 계정은 **2코어·12GB**(그 전엔 4코어·24GB). 유료 전환(PAYG) 계정은 4코어·24GB까지 무료라는 사용자 보고가 있으나 공식 확인은 없다.
- **홈 리전**: 가입할 때 한 번만 고른다. 서울·춘천은 ARM 자원 부족 보고가 많고, 싱가포르가 비교적 여유 있다고 알려져 있다.
- 올릴 후보: Meilisearch(검색), Umami 직접 운영, Grafana·Prometheus·Loki(관측)
- **연결**: Cloudflare Tunnel(들어오는 포트 없음). 단 Tunnel에 고정 공개 주소를 붙이려면 **Cloudflare에 등록된 도메인이 필요**하다. 도메인이 없으면 Workers VPC(무료 플랜 가능 여부 미확인)나 Tailscale Funnel을 검토한다.
- **관리 접속**: Tailscale
- **CI/CD**: Docker 이미지 빌드 → GHCR → Trivy 검사 → SSH(Tailscale) 배포. 더 나아가면 k3s + Argo CD(GitOps)

## 13. 제보와 계정 (2026-10-03 결정)

### 결정

- **회원 기능은 넣지 않는다.** 가입·로그인·관리자 화면이 없다.
- 제보는 사이트에서 로그인 없이 받고, 서버가 **사용자 본인 이름으로 해당 패치 저장소에 이슈를 만든다.** 제보자 정보는 받지 않는다(닉네임만 선택).
- 처리는 GitHub에서 한다. 사이트는 이슈를 읽어 상태를 보여 준다.

### 검토했다가 뺀 것

- 이메일·비밀번호·닉네임 가입 + 메일 인증: 메일 발송에 **도메인이 필요**했고(Resend 무료도 보내는 도메인 인증 필요, Cloudflare Email 발송은 유료 플랜만), Workers 무료 플랜의 CPU 10ms로는 **비밀번호 해시가 버거워** 로그인 처리를 Vercel로 나눠야 했다. 비용과 관리 부담 대비 얻는 게 적고, 다른 한글패치 제작자 사이트들도 대부분 회원 기능이 없다.
- 소셜 로그인(카카오·네이버·GitHub)

### 이슈를 내 이름으로 만드는 방법

- GitHub **fine-grained 개인 토큰**을 쓴다(GitHub App으로 만들면 작성자가 `앱이름[bot]`으로 표시된다).
- 권한은 최소로: **선택한 공개 패치 저장소만**, **Issues 읽기·쓰기**(+ 기본으로 붙는 Metadata 읽기)
- 토큰은 Workers 비밀값으로만 보관하고, 만료일을 정해 두고 갱신한다(최대 만료 기간은 발급 화면에서 확인).
- 이슈 본문에는 "사이트 제보" 표시와 양식(작품, 버전, 유형, 환경, 위치, 닉네임)을 넣고, `제보`·유형 라벨을 붙인다. 직접 만든 이슈와 구분된다.

### 주의할 점과 대책

| 주의할 점 | 대책 |
|---|---|
| 내 이름으로 올라가므로 스팸·욕설도 **내 이름으로 공개**됨 | Turnstile → 요청 제한 → 길이·링크 수 제한 → Workers AI 판별. 의심되면 바로 올리지 않고 **검토 대기** |
| 관리자 화면이 없음 | 검토 대기 제보는 **카카오톡으로 "승인/거절" 버튼 링크**를 보낸다. 링크는 서명이 붙은 일회용이라 사용자 본인만 쓸 수 있다 |
| 내가 만든 이슈는 **GitHub 알림이 오지 않음**(본인 행동이라서) | 카카오톡으로 새 제보 알림 |
| 카카오톡 전송이 실패할 수 있음(토큰 만료, API 오류 사례 있음) | 알림을 DB에 먼저 쌓고, 실패분은 다음 Cron에서 다시 보낸다. 다른 알림 수단은 늘리지 않는다 |
| 카카오 갱신용 토큰도 만료됨(약 2개월로 알려짐, 구현 때 문서로 재확인) | Cron이 주기적으로 갱신해서 만료되지 않게 한다. 그래도 끊기면 카카오 로그인을 한 번 다시 한다 |
| 제보자가 나중에 고치거나 지울 수 없음 | 제보 상세에서 "추가 정보는 이슈 댓글로" 안내(GitHub 계정이 있는 사람만). 잘못된 제보는 GitHub에서 닫음 |
| 첨부 이미지 업로드는 악용 위험·과금 위험 | 처음에는 **이미지 링크만** 받는다 |

### 단계별 운영

- **4단계(AI 판별 전)**: 사이트 제보는 **모두 검토 대기**로 받고 카카오톡 승인 후 등록한다.
- **6단계(AI 판별 후)**: 판별을 통과한 제보는 바로 등록하고, 의심되는 것만 검토 대기로 보낸다.
