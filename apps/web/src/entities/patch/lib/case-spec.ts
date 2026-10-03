import type { Platform } from '@arqhive/shared';

/**
 * 기종별 케이스 생김새. 실제 제품 로고·고유 디자인은 따라 하지 않고, 기종 느낌만 낸 일반 도형이다.
 *
 * Tailwind는 소스 코드에 **완성된 클래스 이름 문자열**이 있어야 그 CSS를 만든다.
 * 그래서 `bg-case-${platform}`처럼 조합하지 않고, 기종마다 클래스 이름을 통째로 적는다.
 *
 * 매체 크기는 케이스(트레이) 폭에 대한 비율(%)로 적는다. 케이스가 표지 크기에서 화면 크기로 커져도
 * 디스크·팩이 같은 비율로 함께 커진다.
 *
 * 케이스 크기는 실물(mm)을 Wii 킵 케이스(135×190, 등 14mm)에 대한 비율로 맞춘다.
 * - GC 145×123(높이×폭, 등 14) → 높이 0.763배
 * - 3DS·NDS 116×131.75(등 12, 펼친 속지 275.5×116에서 계산) → 높이 0.611배, 가로가 조금 긴 정사각형에 가깝다
 * - SFC 상자 193×138(깊이 41) → 1.016배, GB 상자 129×129(깊이 27) → 0.679배, GBA 상자 약 130×130(깊이 29) → 0.684배
 * 실물 치수를 모르는 N64는 아직 예전 크기 그대로다.
 */
/** 킵 케이스 플라스틱 색 */
export type CaseTone = 'white' | 'blue' | 'black' | 'charcoal';

/** 색 묶음 클래스(case-materials.css, 차콜은 cart-materials.css). 이 클래스가 붙은 요소 안의 plastic-* 부품이 그 색을 쓴다. */
export const TONE_CLASSES = {
  white: 'plastic-tone-white',
  blue: 'plastic-tone-blue',
  black: 'plastic-tone-black',
  charcoal: 'plastic-tone-charcoal',
} as const satisfies Record<CaseTone, string>;

/**
 * 디스크 라벨 인쇄.
 * - layout: plain(은백색 라벨 한 장, Wii 계열) · split(위는 그림 칸, 아래는 검은 띠로 나뉜 라벨, GC)
 * - name: 디스크에 쓰는 기종 이름. 선반·표지와 달리 줄이지 않는다.
 * - holo: 기종 이름 홀로그램 색(rainbow 무지개 · cool 차가운 푸른빛)
 */
export interface DiscPrint {
  readonly layout: 'plain' | 'split';
  readonly name: string;
  readonly holo: 'rainbow' | 'cool';
}

export interface CaseSpec {
  /** 안에 든 매체: 디스크 또는 팩(카트리지) */
  readonly media: 'disc' | 'cart';
  /** 케이스 바탕·글자 색(globals.css의 case-* 토큰) */
  readonly caseClass: string;
  /** 매체 크기(트레이 폭 대비 비율과 가로세로비) */
  readonly mediaClass: string;
  /**
   * 케이스 형태.
   * - keepcase: 실물처럼 그린 킵 케이스(keepcase.tsx, Wii·Wii U·3DS·NDS). 앞면에 표지를 인쇄한다.
   *   NDS(DSiWare 포함)는 3DS와 같은 구조에 차콜(짙은 회색) 플라스틱이다.
   * - boxed-keepcase: 종이상자(carton.tsx) 안에 든 킵 케이스(GC). 표지는 상자에 인쇄하고 케이스 앞면은 비어 있다.
   * - carton: 종이상자에 카트리지와 설명서가 든 형태(SFC·GB·GBA). 상자 속 지지대는 그리지 않는다.
   *   상자를 열면 카트리지가 나오고, 설명서를 펼치면 속지(패치 정보)가 보인다.
   * - generic: 단색 면으로 그린 기본 케이스. 다른 기종도 실물 형태가 생기면 여기에 추가한다.
   */
  readonly form: 'keepcase' | 'boxed-keepcase' | 'carton' | 'generic';
  /** 킵 케이스 안의 매체 받침: ring(둥근 턱, Wii 계열) · hex(육각 받침, GC) · cart(게임 카드 받침, 3DS·NDS). generic이면 null */
  readonly holder: 'ring' | 'hex' | 'cart' | null;
  /** keepcase의 플라스틱 색 묶음(case-materials.css의 plastic-tone-*). generic이면 null */
  readonly tone: CaseTone | null;
  /** 케이스 가로세로비(폭/높이). Wii 킵 케이스는 실물 135×190mm */
  readonly aspect: string;
  /** 케이스 높이 ÷ Wii 케이스 높이(실물 기준). 작은 케이스는 속지를 줄여 쓰는 데 쓴다 */
  readonly scale: number;
  /** 최근 갱신 칸의 표지 높이. Wii를 기준으로 실물 높이 비율만큼 줄인다 */
  readonly faceHeight: string;
  /**
   * 케이스 열기 화면의 케이스 높이. Wii 기준(휴대폰 44dvh·122vw, 데스크톱 40rem·86dvh·61vw)에 높이 비율을 곱하고,
   * 펼친 폭이 화면을 넘지 않게 vw 상한은 가로세로비로 다시 맞춘다.
   * 휴대폰은 위아래로 펼쳐 폭이 좁으므로 실물 비율 대신 모든 기종을 Wii와 같은 높이(44dvh)로 두고,
   * 케이스 폭이 화면 폭의 약 86%를 넘지 않게 vw 상한만 가로세로비로 맞춘다(작게 줄이면 속지가 넘친다).
   */
  readonly viewerHeight: string;
}

export const CASE_SPECS = {
  gc: {
    media: 'disc',
    caseClass: 'bg-case-gc text-case-gc-ink',
    mediaClass: 'w-[58%]',
    form: 'boxed-keepcase',
    tone: 'black',
    holder: 'hex',
    aspect: 'aspect-[123/145]',
    scale: 0.763,
    faceHeight: 'h-[9.75rem] sm:h-[11.875rem]',
    viewerHeight: 'h-[min(44dvh,100vw)] md:h-[min(30.5rem,66dvh,47vw)]',
  },
  wii: {
    media: 'disc',
    caseClass: 'bg-case-wii text-case-wii-ink',
    mediaClass: 'w-[80%]',
    form: 'keepcase',
    tone: 'white',
    holder: 'ring',
    aspect: 'aspect-[135/190]',
    scale: 1,
    faceHeight: 'h-[12.75rem] sm:h-[15.5625rem]',
    viewerHeight: 'h-[min(44dvh,122vw)] md:h-[min(40rem,86dvh,61vw)]',
  },
  wiiu: {
    media: 'disc',
    caseClass: 'bg-case-wiiu text-case-wiiu-ink',
    mediaClass: 'w-[80%]',
    form: 'keepcase',
    tone: 'blue',
    holder: 'ring',
    aspect: 'aspect-[135/190]',
    scale: 1,
    faceHeight: 'h-[12.75rem] sm:h-[15.5625rem]',
    viewerHeight: 'h-[min(44dvh,122vw)] md:h-[min(40rem,86dvh,61vw)]',
  },
  '3ds': {
    media: 'cart',
    caseClass: 'bg-case-3ds text-case-3ds-ink',
    mediaClass: 'w-[38%] aspect-[9/10]',
    form: 'keepcase',
    tone: 'white',
    holder: 'cart',
    aspect: 'aspect-[527/464]',
    scale: 0.611,
    faceHeight: 'h-[7.8125rem] sm:h-[9.5rem]',
    viewerHeight: 'h-[min(44dvh,75vw)] md:h-[min(24.375rem,52dvh,37vw)]',
  },
  nds: {
    media: 'cart',
    caseClass: 'bg-case-nds text-case-nds-ink',
    mediaClass: 'w-[36%] aspect-square',
    form: 'keepcase',
    tone: 'charcoal',
    holder: 'cart',
    aspect: 'aspect-[527/464]',
    scale: 0.611,
    faceHeight: 'h-[7.8125rem] sm:h-[9.5rem]',
    viewerHeight: 'h-[min(44dvh,75vw)] md:h-[min(24.375rem,52dvh,37vw)]',
  },
  dsiware: {
    media: 'cart',
    caseClass: 'bg-case-nds text-case-nds-ink',
    mediaClass: 'w-[36%] aspect-square',
    form: 'keepcase',
    tone: 'charcoal',
    holder: 'cart',
    aspect: 'aspect-[527/464]',
    scale: 0.611,
    faceHeight: 'h-[7.8125rem] sm:h-[9.5rem]',
    viewerHeight: 'h-[min(44dvh,75vw)] md:h-[min(24.375rem,52dvh,37vw)]',
  },
  n64: {
    media: 'cart',
    caseClass: 'bg-case-sfc text-case-sfc-ink',
    mediaClass: 'w-[66%] aspect-[4/3]',
    form: 'generic',
    tone: null,
    holder: null,
    aspect: 'aspect-[3/4]',
    scale: 1,
    faceHeight: 'h-[12rem] sm:h-[14.6875rem]',
    viewerHeight: 'h-[min(44dvh,122vw)] md:h-[min(40rem,86dvh,61vw)]',
  },
  sfc: {
    media: 'cart',
    caseClass: 'bg-case-sfc text-case-sfc-ink',
    mediaClass: 'w-[80%] aspect-[7/5]',
    form: 'carton',
    tone: null,
    holder: null,
    aspect: 'aspect-[138/193]',
    scale: 1.016,
    faceHeight: 'h-[12.9375rem] sm:h-[15.8125rem]',
    viewerHeight: 'h-[min(44dvh,120vw)] md:h-[min(40.625rem,86dvh,60vw)]',
  },
  gb: {
    media: 'cart',
    caseClass: 'bg-case-gb text-case-gb-ink',
    mediaClass: 'w-[66%] aspect-[57/65]',
    form: 'carton',
    tone: null,
    holder: null,
    aspect: 'aspect-square',
    scale: 0.679,
    faceHeight: 'h-[8.6875rem] sm:h-[10.5625rem]',
    viewerHeight: 'h-[min(44dvh,86vw)] md:h-[min(27.1875rem,58dvh,41vw)]',
  },
  gba: {
    media: 'cart',
    caseClass: 'bg-case-gba text-case-gba-ink',
    mediaClass: 'w-[90%] aspect-[7/4]',
    form: 'carton',
    tone: null,
    holder: null,
    aspect: 'aspect-square',
    scale: 0.684,
    faceHeight: 'h-[8.75rem] sm:h-[10.625rem]',
    viewerHeight: 'h-[min(44dvh,86vw)] md:h-[min(27.375rem,58dvh,41vw)]',
  },
} as const satisfies Record<Platform, CaseSpec>;

/** 킵 케이스에 든 디스크의 라벨 인쇄(킵 케이스 기종만 있다) */
export const DISC_PRINTS = {
  gc: { layout: 'split', name: 'GameCube', holo: 'cool' },
  wii: { layout: 'plain', name: 'Wii', holo: 'rainbow' },
  wiiu: { layout: 'plain', name: 'Wii U', holo: 'rainbow' },
} as const satisfies Partial<Record<Platform, DiscPrint>>;

/** 바깥 종이상자가 있는 형태인지(GC 킵 케이스, SFC·GB·GBA 카트리지). 열기 연출에 뚜껑·상자 빼기 단계가 붙는다 */
export function hasOuterBox(spec: CaseSpec): boolean {
  return spec.form === 'boxed-keepcase' || spec.form === 'carton';
}
