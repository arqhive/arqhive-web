import { patches } from '@arqhive/content';
import { PLATFORM_LABELS } from '@arqhive/shared';
import { fetchReports } from '@/entities/report';
import { ReportBoard } from './report-board.tsx';

/**
 * 제보 페이지(/report): 위에 제보 양식, 아래에 들어온 제보 목록(댓글처럼).
 * - 양식에서 고를 수 있는 게임은 공개된 패치만(작업 중은 저장소가 비공개라 이슈를 만들 수 없다).
 * - 목록은 GitHub에서 "제보" 라벨 이슈를 읽어 온다(5분 캐시). 저장소 이름으로 게임 이름을 찾아 붙인다.
 * - 방금 보낸 제보는 캐시를 기다리지 않고 목록 맨 위에 바로 붙는다(ReportBoard).
 */
export async function ReportPage() {
  const released = patches
    .filter((patch) => patch.status === 'released')
    .toSorted((a, b) => a.catalogNo.localeCompare(b.catalogNo));
  const games = released.map((patch) => ({
    slug: patch.slug,
    label: `${patch.titleKo} (${PLATFORM_LABELS[patch.platform]})`,
  }));
  const titleOfRepo = new Map(
    released.map((patch) => [`${patch.repo.owner}/${patch.repo.name}`, patch.titleKo]),
  );
  const owner = released[0]?.repo.owner ?? 'arqhive';
  const reports = await fetchReports(owner);

  return (
    <div className="max-w-[42rem] space-y-12 py-10">
      <div className="space-y-3">
        <h1 className="font-bold font-title text-3xl">제보</h1>
        <p className="break-keep text-ink/85 leading-relaxed">
          오역, 깨진 글자, 실행 문제를 알려 주세요. 보내 주신 제보는 해당 패치의 GitHub 이슈로
          등록되고, 아래 목록에도 공개됩니다.
        </p>
      </div>
      <ReportBoard games={games} reports={reports} titleOfRepo={titleOfRepo} />
    </div>
  );
}
