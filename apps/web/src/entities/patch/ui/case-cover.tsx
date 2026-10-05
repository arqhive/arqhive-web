import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';
import { CartonFront } from './carton.tsx';
import { CoverPrint } from './cover-print.tsx';
import { KeepCaseFront } from './keepcase.tsx';

/**
 * 진열장에서 보이는 표지(최근 갱신 칸 등). 케이스 열기 연출이 이 모습에서 출발한다.
 * - keepcase(Wii·Wii U): 킵 케이스 앞면에 바로 인쇄
 * - boxed-keepcase(GC)·carton(SFC·GB·GBA): 바깥 종이상자의 앞면
 * - generic: 기종 색 바탕의 표지
 * `@container`: 안쪽 글자 크기(cqw)의 기준을 이 표지의 폭으로 정한다.
 */
export function CaseCover({ patch }: { readonly patch: PatchCaseData }) {
  const spec = CASE_SPECS[patch.platform];

  if (spec.form === 'keepcase' && spec.tone !== null) {
    return (
      <div className="@container size-full">
        <KeepCaseFront tone={spec.tone}>
          <CoverPrint patch={patch} onCase={true} />
        </KeepCaseFront>
      </div>
    );
  }

  if (spec.form === 'boxed-keepcase' || spec.form === 'carton') {
    return (
      <div className="@container size-full">
        <CartonFront patch={patch} />
      </div>
    );
  }

  return (
    <div className="@container size-full overflow-hidden rounded-[2cqw] border border-black/20">
      <CoverPrint patch={patch} />
    </div>
  );
}
