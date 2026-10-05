import { patches } from '@arqhive/content';
import { recentlyUpdated, toCaseData } from '@/entities/patch';
import { kstDayNumber } from '@/shared/lib';
import { HomeClient } from './home-client.tsx';

/** 표지가 보이게 세워 둘 최근 갱신 작품 수(최대). 화면이 좁으면 FaceOutRow가 2~3개만 보여 준다 */
const RECENT_COUNT = 4;

/**
 * 홈 화면 = 진열장(FSD pages 층의 home 조각).
 *
 * 서버 컴포넌트에서 콘텐츠를 읽고, 진열장에 필요한 필드만 골라(toCaseData) 클라이언트 컴포넌트로 넘긴다.
 * 작품 순서는 분류 번호 순이다(기종 안에서 저장소를 만든 순서).
 */
export function HomePage() {
  const items = patches.map(toCaseData).toSorted((a, b) => a.catalogNo.localeCompare(b.catalogNo));

  // "오늘"은 서버가 페이지를 그리는 시각(한국 시간). 라우트(app/(site)/page.tsx)의 revalidate 주기마다 다시 그린다.
  const today = kstDayNumber(new Date());
  return <HomeClient items={items} recent={recentlyUpdated(items, RECENT_COUNT, today)} />;
}
