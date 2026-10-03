import { describe, expect, it } from 'vitest';
import { PLATFORM_LABELS, PLATFORMS, platformSchema } from './platform.ts';

describe('platformSchema', () => {
  it('정해진 기종 값만 받는다', () => {
    expect(platformSchema.parse('gc')).toBe('gc');
    expect(platformSchema.safeParse('ps2').success).toBe(false);
  });

  it('모든 기종에 화면용 이름이 있다', () => {
    for (const platform of PLATFORMS) {
      expect(PLATFORM_LABELS[platform]).toBeTruthy();
    }
  });
});
