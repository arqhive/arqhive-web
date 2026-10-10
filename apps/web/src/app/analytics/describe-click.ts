import type { TrackData } from '@/shared/analytics';

/**
 * 클릭 하나를 이벤트로 바꾼다. 이름을 붙여 둔 요소(data-track="이름")만 세고, 나머지는 null.
 * - data-track-패치 같은 data-track-* 값은 이벤트 값으로 함께 보낸다(예: data-track-patch → patch).
 * - 이름 없는 일반 클릭은 세지 않는다. Umami 무료 한도(월 10만 이벤트, 이벤트 값도 센다)를 아끼려고 2026-10-09에 뺐다.
 */
export function describeClick(target: EventTarget | null): {
  readonly name: string;
  readonly data: TrackData;
} | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const element = target.closest<HTMLElement>('[data-track]');
  const name = element?.getAttribute('data-track') ?? '';
  if (element === null || name === '') {
    return null;
  }
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(element.dataset)) {
    // dataset은 data-track-patch를 trackPatch로 준다 → patch
    if (key.startsWith('track') && key !== 'track' && value !== undefined) {
      const property = key.slice('track'.length);
      data[property.charAt(0).toLowerCase() + property.slice(1)] = value;
    }
  }
  return { name, data };
}
