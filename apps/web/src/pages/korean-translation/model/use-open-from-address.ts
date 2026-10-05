import { useEffect } from 'react';
import type { PatchCaseData, PickHandler } from '@/entities/patch';
import { track } from '@/shared/analytics';

/**
 * 선반이 다 자리 잡은 뒤 그 작품의 등줄기를 찾는다. 선반은 처음에 줄바꿈 흐름으로 그렸다가
 * 폭을 잰 뒤 칸으로 다시 그리므로, 글꼴을 다 받고 화면을 두 번 그린 뒤에 찾는다(다시 그리기 전 요소를 잡지 않게).
 */
async function findSpine(slug: string): Promise<HTMLElement | null> {
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  return document.querySelector<HTMLElement>(`a[data-slug="${CSS.escape(slug)}"]`);
}

/**
 * 작품 주소(/korean-translation/<slug>)로 들어왔으면(initialSlug) 선반이 자리 잡은 뒤 그 등줄기를 누른 것처럼 꺼낸다(처음 한 번).
 * 화면이 바뀌어 사라지면(cancelled) 찾은 뒤에도 꺼내지 않는다.
 */
export function useOpenFromAddress(
  items: readonly PatchCaseData[],
  initialSlug: string | undefined,
  onPick: PickHandler,
) {
  useEffect(() => {
    const item = items.find((candidate) => candidate.slug === initialSlug);
    if (item === undefined) {
      return;
    }
    let cancelled = false;
    findSpine(item.slug)
      .then((spine) => {
        if (!cancelled && spine !== null) {
          onPick(item, spine);
          // 방문 통계: 주소로 바로 들어와 연 케이스(클릭으로 연 것은 클릭 측정이 따로 센다)
          track('case-open', { patch: item.slug, from: 'address' });
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [items, initialSlug, onPick]);
}
