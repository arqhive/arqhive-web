import { formatDate } from '@/shared/lib';
import type { Report } from '../model/report.ts';

/** 상태 표시: 열린 이슈는 "확인 중", 정상으로 닫힌 이슈는 "반영됨" */
function StateBadge({ state }: { readonly state: Report['state'] }) {
  return state === 'open' ? (
    <span className="border border-line px-1.5 py-0.5 text-ink-sub">확인 중</span>
  ) : (
    <span className="border border-ink bg-ink px-1.5 py-0.5 text-paper">반영됨</span>
  );
}

/**
 * 제보 하나를 댓글처럼 보여 주는 카드. 게임 이름은 화면(pages)이 저장소 이름으로 찾아 넘긴다(gameTitle).
 * 쓴 사람은 익명이다(사이트 양식은 계정을 받지 않는다). 스크린샷은 작은 썸네일로, 누르면 원본이 새 탭으로 열린다.
 */
export function ReportCard({
  report,
  gameTitle,
}: {
  readonly report: Report;
  readonly gameTitle: string;
}) {
  return (
    <li className="border-line border-b py-5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span className="font-bold text-ink text-sm">{gameTitle}</span>
        <time dateTime={report.createdAt} className="font-num text-ink-sub">
          {formatDate(report.createdAt)}
        </time>
        <StateBadge state={report.state} />
      </div>
      <p className="mt-2 whitespace-pre-wrap break-keep text-ink/85 leading-relaxed">
        {report.text}
      </p>
      {report.images.length === 0 ? null : (
        <div className="mt-3 flex flex-wrap gap-2">
          {report.images.map((src, index) => (
            <a key={src} href={src} target="_blank" rel="noopener noreferrer">
              {/* biome-ignore lint/performance/noImgElement: 바깥 저장소(R2)의 사용자 이미지라 next/image 최적화 대상에 넣지 않는다 */}
              <img
                src={src}
                alt={`스크린샷 ${index + 1}`}
                loading="lazy"
                width={160}
                height={90}
                className="h-20 w-auto border border-line object-cover"
              />
            </a>
          ))}
        </div>
      )}
      <a
        href={report.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-ink-sub text-xs underline underline-offset-2 hover:text-stamp"
      >
        GitHub에서 보기
      </a>
    </li>
  );
}
