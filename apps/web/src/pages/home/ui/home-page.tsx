import { patches } from '@arqhive/content';
import Link from 'next/link';
import { Disclaimer } from './disclaimer.tsx';
import { HelpLinks } from './help-links.tsx';

/**
 * 홈(/) = 사이트 소개. 무엇을 하는 곳인지 보여 주고, 한글 패치 진열장으로 안내한다.
 * 소개문은 사용자가 고른 2-B안(10/5, 닌텐도 프랜차이즈를 겨냥한다는 점을 드러냄). 원칙·자주 묻는 질문 등은 정해지면 더한다.
 */
export function HomePage() {
  const released = patches.filter((patch) => patch.status === 'released').length;

  return (
    <section className="space-y-6 py-10">
      {/* 사이트 이름은 헤더에 이미 있으므로 여기서는 되풀이하지 않고 "보관소"라고 부른다 */}
      <h1 className="font-bold font-title text-3xl">보관소</h1>
      <div className="max-w-prose space-y-4 break-keep text-ink-sub leading-relaxed">
        <p>
          닌텐도의 게임기가 세대를 넘길 때마다, 그 시절의 게임들은 조용히 서랍 속으로 들어갑니다.
        </p>
        <p>
          그 서랍에는 한 번도 한국어로 말해 본 적 없는 닌텐도 프랜차이즈가 잠들어 있습니다. 이름조차
          낯선 숨은 시리즈도 있고, 누구나 아는 이름인데 한글판만 끝내 나오지 않은 작품도 있습니다.
        </p>
        <p>이 보관소는 그 작품들을 하나씩 꺼내 한글로 옮기고, 차곡차곡 모아 둡니다.</p>
      </div>
      {/* 보관 수: 콘텐츠 작품 수를 그대로 센다(작품을 더하면 저절로 바뀜). 작업 중은 아직 공개 전인 작품 */}
      <p className="font-num text-ink-sub text-sm">
        보관 중인 한글 패치 <strong className="font-bold text-ink text-lg">{patches.length}</strong>
        편
        <span className="ml-2">
          (공개 {released} · 작업 중 {patches.length - released})
        </span>
      </p>
      <Link
        href="/korean-translation"
        className="inline-block border border-ink bg-ink px-4 py-2 text-paper text-sm hover:opacity-90"
      >
        한글 패치 보러 가기
      </Link>
      <div className="pt-6">
        <HelpLinks />
      </div>
      <Disclaimer />
    </section>
  );
}
