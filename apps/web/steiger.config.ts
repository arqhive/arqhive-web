import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

// Steiger는 FSD 규칙(층 사이 import 방향, 공개 창구 사용, 조각 이름 등)을 검사하는 공식 린터다.
// 공식 권장 규칙을 그대로 쓴다. 규칙을 끄는 예외가 생기면 ADR에 이유를 남긴다.
export default defineConfig([...fsd.configs.recommended]);
