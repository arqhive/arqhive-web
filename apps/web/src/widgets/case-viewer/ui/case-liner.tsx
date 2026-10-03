import { PLATFORM_LABELS } from '@arqhive/shared';
import type { PatchCaseData } from '@/entities/patch';

/**
 * 속지: 케이스 표지의 뒷면. 열리면 보이는 패치 정보 카드다.
 * 실제 게임 케이스를 열면 왼쪽(휴대폰에선 위쪽)에 설명서가 끼워져 있는 것에서 가져온 발상이다.
 */
export function CaseLiner({ patch }: { readonly patch: PatchCaseData }) {
  const isReleased = patch.status === 'released';

  return (
    <div className="flex size-full flex-col overflow-y-auto border border-line bg-card p-5 text-ink md:p-10">
      <span className="font-num text-ink-sub text-xs md:text-sm">
        속지 · {PLATFORM_LABELS[patch.platform]}
      </span>
      <span className="mt-3 text-ink-sub text-sm md:text-base">{patch.titleOriginal}</span>
      <h2 className="mt-1 break-keep font-bold font-title text-2xl leading-snug md:text-4xl">
        {patch.titleKo}
      </h2>
      <p className="mt-3 line-clamp-3 text-ink-sub text-sm md:mt-5 md:text-base">{patch.summary}</p>
      <dl className="mt-4 space-y-1.5 border-line border-t border-dashed pt-4 text-sm md:mt-6 md:space-y-2 md:pt-6 md:text-base">
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-ink-sub">상태</dt>
          <dd>{isReleased ? `배포 ${patch.latestVersion}` : '작업 중 · 공개 전'}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-ink-sub">원본</dt>
          <dd>{patch.baseRegion}판</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-14 shrink-0 text-ink-sub">적용</dt>
          <dd className="line-clamp-2">{patch.patchMethodLabel}</dd>
        </div>
      </dl>
      <span className="mt-auto pt-4 font-num text-ink-sub text-xs md:text-sm">
        {isReleased ? '상세 페이지는 다음 작업에서 연결' : '완성되면 다운로드가 열립니다'}
      </span>
    </div>
  );
}
