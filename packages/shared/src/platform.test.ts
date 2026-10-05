import { describe, expect, it } from 'vitest';
import { PLATFORM_FULL_NAMES, PLATFORM_LABELS, PLATFORMS, platformSchema } from './platform.ts';

describe('platformSchema', () => {
  it('정해진 기종 값만 받는다', () => {
    expect(platformSchema.parse('gc')).toBe('gc');
    // safeParse는 예외를 던지지 않고 { success, data | error }를 돌려준다. API 입력 검사에 주로 쓴다.
    expect(platformSchema.safeParse('ps2').success).toBe(false);
  });

  // 타입 검사(satisfies)가 이미 막아 주지만, 빈 문자열 같은 값 실수는 실행해 봐야 안다.
  it('모든 기종에 화면용 이름이 있다', () => {
    for (const platform of PLATFORMS) {
      expect(PLATFORM_LABELS[platform]).toBeTruthy();
      expect(PLATFORM_FULL_NAMES[platform]).toBeTruthy();
    }
  });
});
