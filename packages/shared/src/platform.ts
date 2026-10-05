import { z } from 'zod';

/**
 * 패치 대상 기종. DB의 `projects.platform`과 MDX frontmatter가 이 목록을 따른다.
 *
 * `as const`를 붙이면 타입이 `string[]`이 아니라 `readonly ['wiiu', '3ds', …]`로 좁혀진다.
 * 그래서 아래 z.enum과 Platform 타입이 정확한 값 목록을 알 수 있다.
 */
export const PLATFORMS = [
  'wiiu',
  '3ds',
  'nds',
  'dsiware',
  'wii',
  'gc',
  'n64',
  'sfc',
  'gb',
  'gba',
] as const;

/** 실행 중에 값을 검사하는 스키마. API 입력이나 MDX frontmatter를 검사할 때 쓴다. */
export const platformSchema = z.enum(PLATFORMS);

/** 스키마에서 타입을 뽑는다. 값 목록(PLATFORMS) 하나만 고치면 검사와 타입이 함께 바뀐다. */
export type Platform = z.infer<typeof platformSchema>;

/**
 * 화면에 보여 줄 기종 이름(줄임). 선반 등줄기·필터·속지처럼 자리가 좁은 곳에 쓴다.
 * `satisfies Record<Platform, string>`은 "모든 기종의 이름이 빠짐없이 있는지" 검사하면서도,
 * 값의 구체적인 타입('Wii U' 같은 리터럴)은 그대로 유지한다. 기종을 추가하고 이름을 빠뜨리면 타입 오류가 난다.
 */
export const PLATFORM_LABELS = {
  wiiu: 'Wii U',
  '3ds': '3DS',
  nds: 'NDS',
  dsiware: 'DSiWare',
  wii: 'Wii',
  gc: 'GC',
  n64: 'N64',
  sfc: 'SFC',
  gb: 'GB',
  gba: 'GBA',
} as const satisfies Record<Platform, string>;

/**
 * 줄이지 않은 기종 이름. 표지 인쇄처럼 기종을 크게 드러내는 곳에 쓴다(예: GC → GameCube).
 * 회사 상표 표기(Nintendo …)는 붙이지 않고 기종 이름만 쓴다.
 */
export const PLATFORM_FULL_NAMES = {
  wiiu: 'Wii U',
  '3ds': '3DS',
  nds: 'Nintendo DS',
  dsiware: 'DSiWare',
  wii: 'Wii',
  gc: 'GameCube',
  n64: 'Nintendo 64',
  sfc: 'Super Famicom',
  gb: 'Game Boy',
  gba: 'Game Boy Advance',
} as const satisfies Record<Platform, string>;
