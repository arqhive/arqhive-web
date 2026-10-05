import type { MouseEvent } from 'react';
import type { PatchCaseData } from './case-data.ts';

/**
 * 케이스를 골랐을 때 부르는 함수의 모양.
 * element: 누른 등줄기·표지 요소. 케이스가 날아갈 출발점·돌아올 도착점이 된다.
 */
// 진열장(widgets/shelf)과 목록(widgets/patch-table)이 함께 쓰므로 아래 층(entities)에 둔다.
// 같은 층의 위젯끼리는 서로 가져다 쓸 수 없기 때문이다(FSD).
export type PickHandler = (item: PatchCaseData, element: HTMLElement) => void;

/** 패치 하나의 주소. 등줄기·표지·목록 줄이 이 주소로 가는 진짜 링크라서 검색엔진이 따라가 패치 페이지를 찾는다 */
export function patchPath(slug: string): `/korean-translation/${string}` {
  return `/korean-translation/${slug}`;
}

/**
 * 링크를 그냥 눌렀을 때만 페이지 이동을 막고 그 자리에서 케이스를 꺼낸다.
 * 새 탭으로 열기(Ctrl·⌘·Shift·Alt + 클릭, 가운데 단추)는 막지 않아 브라우저가 패치 주소를 그대로 연다.
 */
export function pickOnPlainClick(
  event: MouseEvent<HTMLAnchorElement>,
  item: PatchCaseData,
  onPick: PickHandler,
) {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return;
  }
  event.preventDefault();
  onPick(item, event.currentTarget);
}
