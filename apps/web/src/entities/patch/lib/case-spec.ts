import type { Platform } from '@arqhive/shared';

/**
 * 기종별 케이스 생김새. 실제 제품 로고·고유 디자인은 따라 하지 않고, 기종 느낌만 낸 일반 도형이다.
 *
 * Tailwind는 소스 코드에 **완성된 클래스 이름 문자열**이 있어야 그 CSS를 만든다.
 * 그래서 `bg-case-${platform}`처럼 조합하지 않고, 기종마다 클래스 이름을 통째로 적는다.
 *
 * 매체 크기는 케이스(트레이) 폭에 대한 비율(%)로 적는다. 케이스가 표지 크기에서 화면 크기로 커져도
 * 디스크·팩이 같은 비율로 함께 커진다.
 */
export interface CaseSpec {
  /** 안에 든 매체: 디스크 또는 팩(카트리지) */
  readonly media: 'disc' | 'cart';
  /** 케이스 바탕·글자 색(globals.css의 case-* 토큰) */
  readonly caseClass: string;
  /** 매체 크기(트레이 폭 대비 비율과 가로세로비) */
  readonly mediaClass: string;
  /**
   * 케이스 형태. wii-keepcase: 실물처럼 그린 Wii 킵 케이스(wii-keepcase.tsx).
   * generic: 단색 면으로 그린 기본 케이스. 다른 기종도 실물 형태가 생기면 여기에 추가한다.
   */
  readonly form: 'wii-keepcase' | 'generic';
  /** 케이스 가로세로비. Wii 킵 케이스는 실물 135×191mm */
  readonly aspect: string;
}

export const CASE_SPECS = {
  gc: {
    media: 'disc',
    caseClass: 'bg-case-gc text-case-gc-ink',
    mediaClass: 'w-[58%]',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
  wii: {
    media: 'disc',
    caseClass: 'bg-case-wii text-case-wii-ink',
    mediaClass: 'w-[80%]',
    form: 'wii-keepcase',
    aspect: 'aspect-[135/191]',
  },
  wiiu: {
    media: 'disc',
    caseClass: 'bg-case-wiiu text-case-wiiu-ink',
    mediaClass: 'w-[80%]',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
  '3ds': {
    media: 'cart',
    caseClass: 'bg-case-3ds text-case-3ds-ink',
    mediaClass: 'w-[38%] aspect-[9/10]',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
  nds: {
    media: 'cart',
    caseClass: 'bg-case-nds text-case-nds-ink',
    mediaClass: 'w-[36%] aspect-square',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
  dsiware: {
    media: 'cart',
    caseClass: 'bg-case-nds text-case-nds-ink',
    mediaClass: 'w-[36%] aspect-square',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
  n64: {
    media: 'cart',
    caseClass: 'bg-case-sfc text-case-sfc-ink',
    mediaClass: 'w-[66%] aspect-[4/3]',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
  sfc: {
    media: 'cart',
    caseClass: 'bg-case-sfc text-case-sfc-ink',
    mediaClass: 'w-[66%] aspect-[4/3]',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
  gb: {
    media: 'cart',
    caseClass: 'bg-case-gb text-case-gb-ink',
    mediaClass: 'w-[44%] aspect-[9/10]',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
  gba: {
    media: 'cart',
    caseClass: 'bg-case-gba text-case-gba-ink',
    mediaClass: 'w-[52%] aspect-[8/5]',
    form: 'generic',
    aspect: 'aspect-[3/4]',
  },
} as const satisfies Record<Platform, CaseSpec>;
