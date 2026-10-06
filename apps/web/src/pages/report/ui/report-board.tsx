'use client';

import type { SubmittedReport } from '@arqhive/shared';
import { useCallback, useState } from 'react';
import type { Report } from '@/entities/report';
import { QueryProvider } from '@/shared/query';
import type { GameOption } from './report-fields.tsx';
import { ReportForm } from './report-form.tsx';
import { ReportList } from './report-list.tsx';

/**
 * 양식과 목록을 잇는 칸. 목록은 서버가 GitHub 검색으로 읽어 5분 캐시하므로, 방금 보낸 제보는 바로 안 보인다.
 * 그래서 등록에 성공하면 API가 돌려준 제보를 이 화면의 목록 맨 위에 붙인다(added).
 * 나중에 서버 목록에 같은 이슈가 들어오면 id로 걸러 두 번 보이지 않게 한다.
 */
export function ReportBoard({
  games,
  reports,
  titleOfRepo,
}: {
  readonly games: readonly GameOption[];
  readonly reports: readonly Report[];
  readonly titleOfRepo: ReadonlyMap<string, string>;
}) {
  const [added, setAdded] = useState<readonly Report[]>([]);

  // 양식의 effect가 이 함수를 의존값으로 쓰므로 useCallback으로 고정한다(새로 만들면 effect가 다시 돈다)
  const onSubmitted = useCallback((report: SubmittedReport) => {
    setAdded((previous) =>
      previous.some((item) => item.id === report.id)
        ? previous
        : [{ ...report, state: 'open' }, ...previous],
    );
  }, []);

  const addedIds = new Set(added.map((report) => report.id));
  const merged = [...added, ...reports.filter((report) => !addedIds.has(report.id))];

  return (
    // 제보 보내기(useMutation)가 쓰는 TanStack Query 제공자
    <QueryProvider>
      <ReportForm games={games} onSubmitted={onSubmitted} />
      <ReportList reports={merged} titleOfRepo={titleOfRepo} />
    </QueryProvider>
  );
}
