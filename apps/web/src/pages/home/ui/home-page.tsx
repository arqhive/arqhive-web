import { PLATFORM_LABELS, PLATFORMS } from '@arqhive/shared';
import { SITE } from '@/shared/config';

/** 홈 화면. 1단계에서 진열장(widgets/shelf)으로 채운다. 지금은 골격 확인용이다. */
export function HomePage() {
  return (
    <main>
      <h1>{SITE.name}</h1>
      <p>
        {SITE.reading} · {SITE.description} · 준비 중
      </p>
      <ul>
        {PLATFORMS.map((platform) => (
          <li key={platform}>{PLATFORM_LABELS[platform]}</li>
        ))}
      </ul>
    </main>
  );
}
