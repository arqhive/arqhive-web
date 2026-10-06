# arqhive

**arqhive(아카이브)** — 한글 패치 아카이브. 직접 만든 게임 한글 패치를 소개하고, 제보를 받는 사이트입니다.

## 구성

| 경로 | 내용 |
|---|---|
| `apps/web` | Next.js(App Router) on Vercel, FSD 구조 |
| `apps/api` | Hono on Cloudflare Workers, 기능별 모듈 |
| `packages/shared` | web·api가 함께 쓰는 규칙·상수(Zod 스키마는 `*-schema.ts`) |
| `packages/content` | 패치·가이드 글(MDX)을 Velite 데이터로 |
| `packages/db` | Neon(Postgres) 스키마·마이그레이션(Drizzle) |
| `packages/tsconfig` | 환경별 TypeScript 설정 |

앱이 어떤 순서로 움직이는지는 [app-flow.md](app-flow.md)에 그림으로 정리해 두었습니다.

## 시작하기

준비물: Node 24, pnpm 10

```bash
pnpm install
pnpm build   # 처음 한 번: 콘텐츠 데이터(.velite/) 등 빌드 결과물을 만든다
pnpm dev
```

## 명령

| 명령 | 하는 일 |
|---|---|
| `pnpm dev` | web·api 개발 서버 |
| `pnpm build` | 전체 빌드 |
| `pnpm lint` / `pnpm lint:fix` | Biome 검사 / 고칠 수 있는 것 고치기 |
| `pnpm lint:fsd` | FSD 규칙 검사(Steiger) |
| `pnpm typecheck` | 타입 검사 |
| `pnpm test` | 단위 테스트 |
| `pnpm check` | CI와 같은 검사 전체 |

