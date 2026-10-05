import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

/**
 * 케이스 안의 매체(디스크 또는 팩). 크기는 트레이 폭에 대한 비율이라 케이스와 함께 커진다.
 * 열릴 때의 움직임(돌기·올라오기)은 바깥(case-viewer)이 `isOpen`으로 알려 준다.
 * 엔티티는 "어떻게 생겼나"만 알고 "언제 열리나"는 모른다.
 */
export function CaseMedia({
  patch,
  isOpen,
}: {
  readonly patch: PatchCaseData;
  readonly isOpen: boolean;
}) {
  const spec = CASE_SPECS[patch.platform];

  if (spec.media === 'disc') {
    return (
      <div
        className={`${spec.mediaClass} flex aspect-square items-center justify-center rounded-full border border-black/30 bg-line transition-[rotate] delay-[calc(500ms*var(--case-tempo,1))] duration-[calc(1400ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none ${isOpen ? 'rotate-[360deg]' : 'rotate-0'}`}
      >
        <div className="flex size-[60%] items-center justify-center rounded-full bg-card p-[8%] break-keep text-center text-ink text-xs leading-tight md:text-base">
          <div>
            <div className="mx-auto mb-[6%] size-[14%] rounded-full bg-shelf" />
            {patch.titleKo}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${spec.mediaClass} rounded-t-sm bg-ink-sub p-[5%] transition-[translate] delay-[calc(500ms*var(--case-tempo,1))] duration-[calc(700ms*var(--case-tempo,1))] ease-out motion-reduce:transition-none ${isOpen ? '-translate-y-[8%]' : 'translate-y-0'}`}
    >
      <div className="flex h-3/5 items-center justify-center break-keep bg-card p-[6%] text-center text-ink text-xs leading-tight md:text-base">
        {patch.titleKo}
      </div>
    </div>
  );
}
