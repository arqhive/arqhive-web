# modules

기능 하나에 필요한 것(라우트, 서비스, 큐 처리기, 정기 실행)을 한 폴더에 모읍니다.

| 모듈 | 맡는 일 | 만드는 단계 |
|---|---|---|
| `health` | 배포 확인 | 0단계 (지금) |
| `projects` | 작품 읽기 | 3단계 |
| `releases` | 릴리즈·다운로드 수 동기화 | 2·5단계 |
| `reports` | 제보 접수·판별·이슈 생성·이슈 동기화·검토 승인 | 4단계 |
| `search` | 검색·임베딩 | 5·6단계 |
| `notifications` | 운영자 알림(디스코드 웹훅)·못 보낸 알림 재전송 | 4단계 |
| `daily-report` | 일일 정산: 다운로드 기록(Neon) + 방문 통계(Umami) → 디스코드 | 5단계 |
| `webhooks` | `repository_dispatch` 수신 | 8단계 |

규칙

- 모듈 바깥에서는 그 모듈의 `index.ts`로만 가져다 씁니다.
- 여러 모듈이 함께 쓰는 외부 연결(GitHub, Workers AI, 디스코드 웹훅, 요청 제한, Turnstile, 오류 처리)은 `../platform/`에 둡니다.
