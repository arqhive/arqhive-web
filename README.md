# arqhive

**arqhive(아카이브)** — 한글 패치 아카이브. 직접 만든 게임 한글 패치를 소개하고, 제보를 받는 사이트입니다.

> 0단계(골격) 상태입니다. 진행 상황은 [`docs/project-plan.md`](docs/project-plan.md)를 봅니다.

## 구성

| 경로 | 내용 |
|---|---|
| `apps/web` | Next.js(App Router) on Vercel, FSD 구조 |
| `apps/api` | Hono on Cloudflare Workers, 기능별 모듈 |
| `packages/shared` | web·api가 함께 쓰는 Zod 스키마·상수 |
| `packages/tsconfig` | 환경별 TypeScript 설정 |
| `packages/db`, `content`, `ui` | 해당 단계에서 채움(README 참고) |
| `docs/` | 기획 문서, ADR, 디자인 시안 |

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

## 설계 결정

[`docs/adr/`](docs/adr/README.md)에 결정마다 이유를 남깁니다.

## 학습 자료

- [앱 흐름](docs/learning/app-flow.md): 지금까지 만든 것이 어떤 순서로 움직이는지
- [공부해 볼 것](docs/learning/study-guide.md): 이 저장소에서 쓰는 도구와 개념
