import { PLATFORM_LABELS, type Platform } from '@arqhive/shared';
import { formatDate } from '@/shared/lib';

/**
 * 패치 주소(/korean-translation/<slug>)로 들어왔을 때 진열장 위에 보이는 소개 띠.
 * 케이스 속지는 브라우저에서 열 때만 그려지므로, 검색엔진(특히 JS를 돌리지 않는 봇)이 이 페이지가 어떤 패치인지
 * 읽을 수 있게 서버에서 제목(h1)과 소개를 그린다. 사람에게도 그대로 보이는 글이다(숨긴 글로 검색엔진을 속이지 않는다).
 */
export function PatchIntro({
  patch,
}: {
  readonly patch: {
    readonly titleKo: string;
    readonly titleOriginal: string;
    readonly platform: Platform;
    readonly status: 'released' | 'in_progress';
    readonly latestVersion: string;
    readonly latestReleaseDate: string;
    readonly summary: string;
  };
}) {
  const released = patch.status === 'released';
  return (
    <section className="max-w-[42rem] space-y-2 border-ink border-l-4 py-1 pl-4">
      <p className="flex flex-wrap gap-x-2 font-num text-ink-sub text-xs">
        <span>{PLATFORM_LABELS[patch.platform]}</span>
        <span aria-hidden="true">·</span>
        {released ? (
          <>
            <span>{patch.latestVersion}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={patch.latestReleaseDate}>{formatDate(patch.latestReleaseDate)}</time>
          </>
        ) : (
          <span>작업 중</span>
        )}
      </p>
      <h1 className="break-keep font-bold font-title text-2xl">{patch.titleKo} 한글 패치</h1>
      <p className="text-ink-sub text-sm">{patch.titleOriginal}</p>
      <p className="break-keep text-ink/85 leading-relaxed">{patch.summary}</p>
    </section>
  );
}
