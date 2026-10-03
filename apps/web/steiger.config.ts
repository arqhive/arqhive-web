import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

// FSD 공식 규칙을 그대로 쓴다. 규칙을 끄는 예외가 생기면 ADR에 이유를 남긴다.
export default defineConfig([...fsd.configs.recommended]);
