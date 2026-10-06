import { patches } from '@arqhive/content';
import { fetchChangelog, fetchReleaseInfo, recentlyUpdated, toCaseData } from '@/entities/patch';
import { kstDayNumber } from '@/shared/lib';
import { PatchIntro } from './patch-intro.tsx';
import { TranslationClient } from './translation-client.tsx';

/** 표지가 보이게 세워 둘 최근 갱신 작품 수(최대). 화면이 좁으면 FaceOutRow가 2~3개만 보여 준다 */
const RECENT_COUNT = 4;

/**
 * 한글 패치 페이지(/korean-translation) = 진열장(FSD pages 층의 korean-translation 조각).
 *
 * 서버 컴포넌트에서 콘텐츠를 읽고, 진열장에 필요한 필드만 골라(toCaseData) 클라이언트 컴포넌트로 넘긴다.
 * 작품 순서는 분류 번호 순이다(기종 안에서 저장소를 만든 순서).
 * initialSlug(패치 주소로 들어왔을 때)가 있으면 그 패치 케이스를 처음부터 열어 보여 주고,
 * 진열장 위에 그 패치의 소개 띠(h1·소개)를 서버에서 그린다(검색엔진이 읽는 본문). 진열장 주소에서는 제목을 화면 낭독기용으로만 둔다.
 * 공개 작품은 GitHub 릴리즈 다운로드 수와 CHANGELOG.md를 함께 읽는다(작품마다 동시에, 결과는 1시간 캐시). 작업 중인 작품은 읽지 않는다.
 * CHANGELOG는 "있는지"만 넘기고(단추 표시용), 내용은 단추를 누를 때 서버 함수(api/load-changelog)가 그려 보낸다.
 * 내용까지 미리 실으면 페이지 HTML의 대부분이 CHANGELOG 데이터가 되기 때문이다.
 */
export async function TranslationPage({ initialSlug }: { readonly initialSlug?: string }) {
  const sorted = patches
    .map((patch) => toCaseData(patch))
    .toSorted((a, b) => a.catalogNo.localeCompare(b.catalogNo));
  const released = (item: (typeof sorted)[number]) => item.status === 'released';
  const [releaseInfos, changelogs] = await Promise.all([
    Promise.all(
      sorted.map((item) =>
        released(item) ? fetchReleaseInfo(item.repo, item.downloadCode) : null,
      ),
    ),
    Promise.all(sorted.map((item) => (released(item) ? fetchChangelog(item.repo) : null))),
  ]);
  const items = sorted.map((item, index) => ({
    ...item,
    downloadCount: releaseInfos[index]?.downloadCount ?? null,
    downloads: releaseInfos[index]?.downloads ?? null,
  }));
  // CHANGELOG가 있는 패치 slug. 못 읽은 패치는 빠진다(단추가 숨겨짐)
  const changelogSlugs = sorted
    .filter((_item, index) => Boolean(changelogs[index]))
    .map((item) => item.slug);

  // "오늘"은 서버가 페이지를 그리는 시각(한국 시간). 라우트(app/(site)/page.tsx)의 revalidate 주기마다 다시 그린다.
  const today = kstDayNumber(new Date());
  const intro = patches.find((patch) => patch.slug === initialSlug);
  return (
    <div className="space-y-10">
      {intro === undefined ? <h1 className="sr-only">한글 패치</h1> : <PatchIntro patch={intro} />}
      <TranslationClient
        items={items}
        recent={recentlyUpdated(items, RECENT_COUNT, today)}
        initialSlug={initialSlug}
        changelogSlugs={changelogSlugs}
      />
    </div>
  );
}
