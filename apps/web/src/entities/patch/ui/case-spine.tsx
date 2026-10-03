import { PLATFORM_LABELS, type Platform } from '@arqhive/shared';
import { CASE_SPECS, type CaseSpec, TONE_CLASSES } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

/**
 * 선반에 꽂힌 케이스의 등줄기. 기종마다 케이스 높이·폭이 다르다(실제 케이스 크기 느낌만).
 * 글자는 세로쓰기(writing-mode: vertical-rl)라 한글은 바로 서고 로마자는 눕는다.
 * 제목은 한 줄로만 쓰고(nowrap), 등줄기보다 길면 말줄임(…)으로 자른다. 전체 제목은 케이스를 열면 보인다.
 * 클릭 등 상호작용은 감싸는 쪽(widgets/shelf)이 맡는다.
 */
const SPINE_SIZES = {
  // 높이는 Wii(190mm = 15rem) 기준 실물 비율. rem이라 사이트 배율(html font-size)을 따른다. 폭은 글자를 읽을 수 있게 넉넉히 두되 등 두께(14mm·12mm) 비율을 따른다.
  gc: 'h-[11.4375rem] w-12',
  wii: 'h-60 w-12',
  wiiu: 'h-60 w-12',
  '3ds': 'h-[9.1875rem] w-[2.5625rem]',
  nds: 'h-[9.1875rem] w-[2.5625rem]',
  dsiware: 'h-[9.1875rem] w-[2.5625rem]',
  n64: 'h-48 w-16',
  sfc: 'h-[15.25rem] w-16',
  gb: 'h-[10.1875rem] w-14',
  gba: 'h-[10.25rem] w-14',
} as const satisfies Record<Platform, string>;

/** 등줄기 겉면: 킵 케이스는 같은 플라스틱 색 묶음, 종이상자는 흰 종이 옆면, 그 밖에는 기종 색 바탕 */
function spineSurface(spec: CaseSpec): string {
  if (spec.form === 'boxed-keepcase') {
    return 'paper-spine';
  }
  if (spec.form === 'keepcase' && spec.tone !== null) {
    return `plastic-spine ${TONE_CLASSES[spec.tone]}`;
  }
  return `border border-black/25 ${spec.caseClass}`;
}

/** 등줄기 윗부분의 기종 띠: 종이상자는 흰 바탕에 검은 띠로 인쇄, 그 밖에는 가는 선으로만 나눈다 */
function bandSurface(spec: CaseSpec): string {
  if (spec.form === 'boxed-keepcase') {
    return 'paper-band py-2';
  }
  return 'border-black/15 border-b py-1';
}

export function CaseSpine({ patch }: { readonly patch: PatchCaseData }) {
  const spec = CASE_SPECS[patch.platform];
  const isReleased = patch.status === 'released';
  // GC는 종이상자에 들어 있으므로 등줄기는 상자 옆면(흰 종이, 윗부분만 검은 띠)이다.
  const surface = spineSurface(spec);
  const band = bandSurface(spec);

  return (
    <div className={`flex flex-col items-center ${SPINE_SIZES[patch.platform]} ${surface}`}>
      <span className={`w-full text-center font-num text-[0.625rem] ${band}`}>
        {PLATFORM_LABELS[patch.platform]}
      </span>
      <span className="min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap py-2 font-bold font-title text-sm leading-tight [writing-mode:vertical-rl]">
        {patch.titleKo}
      </span>
      {isReleased ? null : (
        <span className="w-full bg-stamp py-0.5 text-center text-[0.625rem] text-on-stamp">
          작업 중
        </span>
      )}
    </div>
  );
}
