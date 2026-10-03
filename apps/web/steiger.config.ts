import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

// Steiger는 FSD 규칙(층 사이 import 방향, 공개 창구 사용, 조각 이름 등)을 검사하는 공식 린터다.
// 공식 권장 규칙을 그대로 쓴다. 규칙을 바꾸는 예외가 생기면 이유를 적고, 오래 갈 예외는 ADR에 남긴다.
export default defineConfig([
  ...fsd.configs.recommended,
  {
    // insignificant-slice: "한 곳에서만 쓰는(또는 아무도 안 쓰는) 조각은 합치거나 지워라".
    // 사이트를 만들어 가는 동안에는 곧 여러 곳에서 쓸 조각이 잠시 한 곳에서만 쓰이는 일이 자연스럽게 생긴다
    // (예: case-viewer는 지금 시제품 화면에서만 쓰지만 곧 홈 진열장에서도 쓴다).
    // 그래서 오류 대신 경고로 둔다. 경고는 계속 보이므로, 1단계가 끝날 때 남은 경고를 정리한다.
    //
    // 참고: 처음엔 files로 그 조각만 예외를 주려 했지만, 이 규칙은 진단 위치를 윈도우 경로(역슬래시)로 붙여서
    // 윈도우에서는 glob 패턴이 맞지 않았다(Linux CI와 결과가 달라짐). 그래서 규칙 단위로 조정했다.
    rules: {
      'fsd/insignificant-slice': 'warn',
    },
  },
]);
