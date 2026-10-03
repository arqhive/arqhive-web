import { PLATFORM_LABELS } from '@arqhive/shared';
import { CASE_SPECS, type PatchCaseData } from '@/entities/patch';

/** 이 비율보다 작은 케이스(3DS·NDS·GB·GBA)는 속지가 좁아서 줄거리를 빼고 글자를 줄인다 */
const COMPACT_SCALE = 0.7;

/**
 * 데스크톱(md 이상) 크기. 속지의 기준 글자 크기를 속지 폭의 4%(4cqw)로 두고, 나머지는 모두 em(기준 글자의 배수)으로 쓴다.
 * 그래서 케이스가 화면에 맞춰 커지고 작아져도 속지 안의 배치가 인쇄물처럼 같은 비율로 유지된다.
 */
const DESKTOP = {
  normal: {
    box: 'md:p-[2.5em]',
    original: 'md:mt-[0.75em]',
    title: 'md:text-[2.25em]',
    list: 'md:mt-[1.5em] md:space-y-[0.5em] md:pt-[1.5em]',
  },
  compact: {
    box: 'md:p-[1.5em]',
    original: 'md:mt-[0.5em]',
    title: 'md:text-[1.5em]',
    list: 'md:mt-[1em] md:space-y-[0.375em] md:pt-[1em]',
  },
} as const;

/**
 * 속지: 케이스 표지의 뒷면. 열리면 보이는 패치 정보 카드다.
 * 실제 게임 케이스를 열면 왼쪽(휴대폰에선 위쪽)에 설명서가 끼워져 있는 것에서 가져온 발상이다.
 *
 * - 데스크톱: 글자 크기가 속지 폭에 비례한다(위 DESKTOP 설명). 작은 케이스(compact)는 줄거리를 뺀다.
 * - 휴대폰: 케이스가 작아 속지 폭 비례로는 글자가 너무 작아지므로, 사이트 글자 크기(rem) 기준의 줄인 배치를 쓴다.
 *   기종과 상관없이 줄거리를 빼고, 작은 케이스는 제목을 한 단계 줄이고 맨 아래 안내 문구도 뺀다.
 * 전체 내용은 상세 페이지에서 본다.
 */
export function CaseLiner({ patch }: { readonly patch: PatchCaseData }) {
  const isReleased = patch.status === 'released';
  const compact = CASE_SPECS[patch.platform].scale < COMPACT_SCALE;
  const desk = DESKTOP[compact ? 'compact' : 'normal'];

  return (
    <div className="@container size-full">
      <div
        className={`flex size-full flex-col overflow-y-auto border border-line bg-card p-3 text-ink md:text-[4cqw] ${desk.box}`}
      >
        <span className="font-num text-ink-sub text-xs md:text-[0.875em]">
          속지 · {PLATFORM_LABELS[patch.platform]}
        </span>
        <span
          className={`mt-1 line-clamp-1 shrink-0 text-ink-sub text-xs md:text-[1em] ${desk.original}`}
        >
          {patch.titleOriginal}
        </span>
        <h2
          className={`mt-1 shrink-0 break-keep font-bold font-title leading-snug ${compact ? 'text-base' : 'text-lg'} ${desk.title}`}
        >
          {patch.titleKo}
        </h2>
        {compact ? null : (
          <p className="mt-[1.25em] hidden text-ink-sub md:line-clamp-3">{patch.summary}</p>
        )}
        <dl
          className={`mt-2 space-y-0.5 border-line border-t border-dashed pt-2 text-xs md:text-[1em] ${desk.list}`}
        >
          <div className="flex gap-[0.75em]">
            <dt className="w-[3.5em] shrink-0 text-ink-sub">상태</dt>
            <dd>{isReleased ? `배포 ${patch.latestVersion}` : '작업 중 · 공개 전'}</dd>
          </div>
          <div className="flex gap-[0.75em]">
            <dt className="w-[3.5em] shrink-0 text-ink-sub">원본</dt>
            <dd>{patch.baseRegion}판</dd>
          </div>
          <div className="flex gap-[0.75em]">
            <dt className="w-[3.5em] shrink-0 text-ink-sub">적용</dt>
            <dd className="line-clamp-2">{patch.patchMethodLabel}</dd>
          </div>
        </dl>
        <span
          className={`mt-auto pt-2 font-num text-ink-sub text-xs md:block md:pt-[1em] md:text-[0.875em] ${compact ? 'hidden' : ''}`}
        >
          {isReleased ? '상세 페이지는 다음 작업에서 연결' : '완성되면 다운로드가 열립니다'}
        </span>
      </div>
    </div>
  );
}
