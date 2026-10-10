import type { TrackData } from '@/shared/analytics';

/** 클릭으로 칠 요소: 링크·단추·펼침 제목·고르기 칸 */
const CLICKABLE = 'a[href], button, summary, select, [role="button"], label[for]';
/** 이름표 최대 길이(긴 글이 그대로 들어가지 않게) */
const LABEL_MAX = 40;

/** 누른 요소를 사람이 알아볼 이름으로: 화면 낭독기용 이름 → 툴팁 → 보이는 글자 → 링크 주소 */
function labelOf(element: HTMLElement): string {
  const text =
    element.getAttribute('aria-label') ??
    element.getAttribute('title') ??
    element.textContent?.replaceAll(/\s+/g, ' ').trim() ??
    '';
  if (text !== '') {
    return text.length > LABEL_MAX ? `${text.slice(0, LABEL_MAX)}…` : text;
  }
  return element instanceof HTMLAnchorElement
    ? (element.getAttribute('href') ?? '')
    : element.tagName;
}

/** data-track-* 값만 모은다(dataset은 data-track-patch를 trackPatch로 준다 → patch) */
function trackValues(element: HTMLElement): Record<string, string> {
  const data: Record<string, string> = {};
  for (const [key, value] of Object.entries(element.dataset)) {
    if (key.startsWith('track') && key !== 'track' && value !== undefined) {
      const property = key.slice('track'.length);
      data[property.charAt(0).toLowerCase() + property.slice(1)] = value;
    }
  }
  return data;
}

/**
 * 클릭 하나를 이벤트로 바꾼다. 클릭할 수 있는 요소가 아니면 null.
 * - 이름 붙인 행동(data-track="case-open" 등): 그 이름과 data-track-* 값만 보낸다(예: case-open/star-fox-2).
 * - 다른 사이트로 가는 링크: "outbound"와 목적지(host + 경로).
 * - 나머지 링크·단추: "click"과 누른 것의 이름표.
 * - 입력 칸(input·textarea)은 치지 않는다. 사용자가 쓴 글이 들어갈 수 있어서다.
 */
export function describeClick(target: EventTarget | null): {
  readonly name: string;
  readonly data: TrackData;
} | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const element = target.closest<HTMLElement>(CLICKABLE);
  if (element === null) {
    return null;
  }
  const named = element.getAttribute('data-track');
  if (named !== null && named !== '') {
    return { name: named, data: trackValues(element) };
  }
  if (element instanceof HTMLAnchorElement && element.host !== location.host) {
    return { name: 'outbound', data: { to: `${element.host}${element.pathname}` } };
  }
  return { name: 'click', data: { target: labelOf(element) } };
}
