import { PLATFORM_LABELS, PLATFORMS } from '@arqhive/shared';
import { SITE } from '@/shared/config';

/**
 * 홈 화면(FSD pages 층의 home 조각, ui 칸).
 *
 * pages 층은 아래 층(widgets, features, entities, shared)의 부품을 조립해 화면 하나를 만든다.
 * 1단계에서 진열장(widgets/shelf)으로 채운다. 지금은 골격과 패키지 연결 확인용이다.
 * - `@/shared/config`: 같은 앱의 아래 층(shared)에서 가져옴 → FSD 규칙상 허용
 * - `@arqhive/shared`: 모노레포의 공용 패키지에서 가져옴 → web과 api가 같은 기종 목록을 쓴다
 */
export function HomePage() {
  return (
    <main>
      <h1>{SITE.name}</h1>
      <p>
        {SITE.reading} · {SITE.description} · 준비 중
      </p>
      <ul>
        {PLATFORMS.map((platform) => (
          // key는 목록이 바뀔 때 React가 어떤 항목인지 구분하는 값이다. 순서 번호(index) 대신 고유한 값을 쓴다.
          <li key={platform}>{PLATFORM_LABELS[platform]}</li>
        ))}
      </ul>
    </main>
  );
}
