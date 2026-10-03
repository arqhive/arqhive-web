import { PLATFORM_LABELS, type Platform } from '@arqhive/shared';
import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

/**
 * 선반에 꽂힌 케이스의 등줄기. 기종마다 케이스 높이·폭이 다르다(실제 케이스 크기 느낌만).
 * 글자는 세로쓰기(writing-mode: vertical-rl)라 한글은 바로 서고 로마자는 눕는다.
 * 제목은 한 줄로만 쓰고(nowrap), 등줄기보다 길면 말줄임(…)으로 자른다. 전체 제목은 케이스를 열면 보인다.
 * 클릭 등 상호작용은 감싸는 쪽(widgets/shelf)이 맡는다.
 */
const SPINE_SIZES = {
  gc: 'h-56 w-12',
  wii: 'h-60 w-12',
  wiiu: 'h-60 w-12',
  '3ds': 'h-44 w-11',
  nds: 'h-44 w-11',
  dsiware: 'h-44 w-11',
  n64: 'h-48 w-16',
  sfc: 'h-48 w-16',
  gb: 'h-40 w-14',
  gba: 'h-36 w-14',
} as const satisfies Record<Platform, string>;

export function CaseSpine({ patch }: { readonly patch: PatchCaseData }) {
  const spec = CASE_SPECS[patch.platform];
  const isReleased = patch.status === 'released';

  return (
    <div
      className={`flex flex-col items-center border border-black/25 ${SPINE_SIZES[patch.platform]} ${spec.caseClass}`}
    >
      <span className="w-full border-black/15 border-b py-1 text-center font-num text-[10px]">
        {PLATFORM_LABELS[patch.platform]}
      </span>
      <span className="min-h-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap py-2 font-bold font-title text-sm leading-tight [writing-mode:vertical-rl]">
        {patch.titleKo}
      </span>
      {isReleased ? null : (
        <span className="w-full bg-stamp py-0.5 text-center text-[10px] text-on-stamp">
          작업 중
        </span>
      )}
    </div>
  );
}
