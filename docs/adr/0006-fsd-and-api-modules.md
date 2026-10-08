# 0006. web은 FSD, api는 기능별 모듈로 나눈다

- 상태: 채택
- 날짜: 2026-10-03

## 맥락

- web의 폴더 구조로 계층별(components·hooks·utils), App Router 가까이 두기 + 기능 폴더, FSD(Feature-Sliced Design)를 검토했다.
- 이 규모에는 "라우트 가까이 + 기능 폴더"가 가장 가볍다. 하지만 운영자가 FSD를 실무에서 써 본 적이 없어 이번에 적용하며 배우기로 했다.
- api는 제보·동기화·알림처럼 기능마다 라우트·큐 처리기·정기 실행이 함께 움직인다.

## 결정

### web: FSD

- 층은 `app → pages → widgets → features → entities → shared` 순서이고, **위 층은 아래 층만** 가져다 쓴다. 같은 층의 다른 조각끼리는 가져다 쓰지 않는다.
- 조각마다 공개 창구 `index.ts`를 두고, 바깥에서는 그것으로만 가져다 쓴다.
- **Next.js와 겹치는 이름 처리**(FSD 공식 안내 방식)
  - Next.js 라우팅 폴더 `app/`은 맨 위에 두고 얇게 유지한다. 각 `page.tsx`는 `src/pages`의 화면을 불러오기만 한다.
  - FSD 층은 `src/` 아래에 둔다.
  - 맨 위에 빈 `pages/` 폴더(README만)를 두어 Next.js가 `src/pages`를 Pages Router로 읽지 않게 한다.
- 규칙 검사는 FSD 공식 린터 **Steiger**(`@feature-sliced/steiger-plugin` 권장 설정)로 하고 CI에 넣는다.
  - 예외(2026-10-03): `insignificant-slice`(한 곳에서만 쓰는 조각은 합쳐라)는 경고로 낮춘다. 만들어 가는 동안 곧 여러 곳에서 쓸 조각이 잠시 한 곳에서만 쓰이는 일이 많기 때문이다. 단계가 끝날 때 남은 경고를 정리한다.
- 아직 쓰지 않는 층은 폴더를 만들지 않는다.
- 애매한 판단(feature인가 entity인가 등)은 ADR에 이유를 남긴다.

### api: 기능별 모듈

- `src/modules/<기능>/`에 그 기능의 라우트·서비스·큐 처리기·정기 실행을 모은다. 바깥에서는 모듈의 `index.ts`로만 가져다 쓴다.
- 여러 모듈이 함께 쓰는 외부 연결(GitHub·Workers AI·카카오 클라이언트, 요청 제한, Turnstile, 오류 처리)은 `src/platform/`에 둔다.
- `src/index.ts`는 Workers 진입점(fetch·queue·scheduled)으로, 각 모듈로 나눠 보내기만 한다.

## 검토한 대안

- **web을 라우트 가까이 + 기능 폴더로**: 이 규모에 가장 맞지만, FSD를 배우려는 목적을 이루지 못한다.
- **api를 계층별(routes·services·jobs)로**: 역할은 잘 보이지만 기능 하나를 고치려면 여러 폴더를 오가야 한다.

## 결과

- FSD 규칙이 명확해서 코드 위치를 정하는 기준이 생기고, 실무 적용 경험이 쌓인다.
- 페이지 십여 개 규모에는 층이 무겁게 느껴질 수 있다. 층을 채우려고 억지로 나누지 않고, 필요할 때만 조각을 만든다.
- `app`, `pages` 이름이 Next.js와 겹쳐 처음 보는 사람에게 헷갈릴 수 있어 `apps/web/pages/README.md`와 `apps/web/src/README.md`에 설명을 둔다.
