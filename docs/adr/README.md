# ADR (설계 결정 기록)

"무엇을 왜 그렇게 정했는가"를 결정 하나에 문서 하나씩 남깁니다. 결정이 바뀌면 기존 문서를 고치지 않고, 새 ADR을 쓰고 기존 문서의 상태를 "대체됨"으로 바꿉니다.

## 목록

| 번호 | 제목 | 상태 |
|---|---|---|
| [0001](0001-record-decisions.md) | ADR을 쓴다 | 채택 |
| [0002](0002-free-serverless.md) | 무료 서버리스로 운영한다 | 채택 |
| [0003](0003-monorepo-from-scratch.md) | 모노레포를 템플릿 없이 직접 구성한다 | 채택 |
| [0004](0004-no-accounts-reports-as-issues.md) | 회원 기능 없이 제보를 GitHub 이슈로 받는다 | 채택(검토 대기 → 0010, 이미지 링크만 → 0011로 일부 대체) |
| [0005](0005-kakaotalk-notifications.md) | 알림은 카카오톡 하나로 한다 | 대체됨(→ 0014) |
| [0006](0006-fsd-and-api-modules.md) | web은 FSD, api는 기능별 모듈로 나눈다 | 채택 |
| [0007](0007-strict-biome.md) | 린트는 Biome을 최대한 엄격하게 쓴다 | 채택 |
| [0008](0008-shelf-design.md) | 디자인은 진열장 콘셉트로 한다 | 채택 |
| [0009](0009-design-tokens-archive.md) | 디자인 토큰은 2안 "기록보관소"로 한다 | 채택 |
| [0010](0010-reports-publish-immediately.md) | 사이트 제보는 검토 대기 없이 바로 이슈로 공개한다 | 채택 |
| [0011](0011-report-screenshots-r2-budget.md) | 제보 스크린샷은 R2에 올리고, 누적 9GB에서 막는다 | 채택 |
| [0012](0012-defer-database.md) | DB(Neon·Drizzle)는 보류하고 GitHub API·KV로 운영한다 | 채택(다운로드 기록에 한해 → 0016) |
| [0013](0013-page-structure-case-liner.md) | 패치 상세는 케이스 속지가 맡고, 가이드·제보는 한 페이지씩 둔다 | 채택 |
| [0014](0014-report-alerts-discord.md) | 제보 알림은 디스코드 웹훅으로 보내고, 못 보낸 것은 KV에 쌓아 Cron이 다시 보낸다 | 채택 |
| [0015](0015-analytics-umami.md) | 방문 통계는 Umami Cloud로 하고, 이름 붙인 행동만 이벤트로 보낸다 | 채택 |
| [0016](0016-download-history-neon.md) | 다운로드 수를 Neon + Drizzle에 날마다 쌓고, Umami 통계와 함께 디스코드로 일일 정산을 보낸다 | 채택 |
| [0017](0017-patch-agent.md) | 제보 처리 에이전트를 직접 만든다(도구 호출 루프 + 사람 승인 + 평가) | 채택 |
| [0018](0018-native-dialog-for-case-viewer.md) | 케이스 보기·업데이트 내역 모달은 네이티브 `<dialog>`(showModal)로 만든다 | 채택 |

## 양식

새 ADR은 아래 양식으로 씁니다. 파일 이름은 `번호-짧은-영문-이름.md`입니다.

```markdown
# 0000. 제목(결정을 한 문장으로)

- 상태: 제안 | 채택 | 대체됨(→ 0000)
- 날짜: YYYY-MM-DD

## 맥락
어떤 상황과 제약이 있었나

## 결정
무엇으로 정했나

## 검토한 대안
무엇을 왜 버렸나

## 결과
좋아지는 점, 감수할 점
```
