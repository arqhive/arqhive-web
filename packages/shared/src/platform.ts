import { z } from 'zod';

/** 패치 대상 기종. DB의 `projects.platform`과 MDX frontmatter가 이 목록을 따른다. */
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

export const platformSchema = z.enum(PLATFORMS);

export type Platform = z.infer<typeof platformSchema>;

/** 화면에 보여 줄 기종 이름 */
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
