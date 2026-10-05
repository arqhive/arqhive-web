# src — FSD 층

위 층은 아래 층만 가져다 씁니다. 같은 층의 다른 조각(slice)끼리는 가져다 쓰지 않습니다.

```
app → pages → widgets → features → entities → shared
```

| 층 | 역할 | arqhive에서 (예정 포함) |
|---|---|---|
| `app` | 앱 전체 설정 | 전역 스타일, 글꼴, 프로바이더 |
| `pages` | 화면 단위 조립 | `home`(지금), patch-detail, report-new, search |
| `widgets` | 큰 화면 블록 | shelf(진열장), case-viewer(케이스 열기), site-header, report-list |
| `features` | 사용자 행동 | report-submit, platform-filter, view-toggle, title-morph, search-box |
| `entities` | 업무 개념 | project, release, report, platform |
| `shared` | 공용 | `config`(지금), api 클라이언트, ui(packages/ui 연결), lib |

## 규칙

- 조각마다 공개 창구 `index.ts`를 두고, 바깥에서는 그 파일로만 가져다 씁니다.
- 조각 안은 용도별 칸(segment)으로 나눕니다: `ui/`, `model/`, `api/`, `lib/`, `config/`
- 아직 쓰지 않는 층 폴더는 만들지 않습니다. 필요해지는 단계에서 만듭니다.
- 규칙 검사: `pnpm lint:fsd` (Steiger)
- 애매한 판단(feature인가 entity인가 등)은 설계 결정 기록(로컬 `docs/adr/`)에 이유를 남깁니다.

Next.js의 라우팅 폴더는 맨 위 `app/`이고, 각 `page.tsx`는 이 `src/pages`의 화면을 불러오기만 합니다.
