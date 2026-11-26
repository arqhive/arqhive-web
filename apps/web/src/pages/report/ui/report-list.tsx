import { useId } from 'react';
import { type Report, ReportCard } from '@/entities/report';

/**
 * 들어온 제보 목록(댓글처럼 위에서 아래로, 최신이 위). 패치 주소와 저장소 이름을 대조해 카드에 게임 이름을 붙인다.
 * 페이지(ReportPage)는 목록을 읽느라 async라서 훅(useId)을 못 쓴다. 그래서 목록 칸을 따로 둔다.
 * 방금 보낸 제보를 붙이려고 클라이언트 칸(ReportBoard) 안에서 그린다.
 */
export function ReportList({
  reports,
  gameTitles,
}: {
  readonly reports: readonly Report[];
  readonly gameTitles: ReadonlyMap<string, string>;
}) {
  const listId = useId();
  return (
    <section aria-labelledby={listId} className="space-y-2">
      <h2 id={listId} className="font-bold font-title text-xl">
        들어온 제보 <span className="font-num text-base text-ink-sub">{reports.length}</span>
      </h2>
      {reports.length === 0 ? (
        <p className="border-line border-t py-6 text-ink-sub text-sm">
          아직 들어온 제보가 없습니다.
        </p>
      ) : (
        <ul className="border-ink/40 border-t-2">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              gameTitle={
                gameTitles.get(`${report.repo}/${report.slug ?? ''}`) ??
                gameTitles.get(report.repo) ??
                report.repo
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}
