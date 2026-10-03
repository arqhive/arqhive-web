import type { PatchCaseData } from './case-data.ts';

/**
 * 케이스를 골랐을 때 부르는 함수의 모양.
 * element: 누른 등줄기·표지 요소. 케이스가 날아갈 출발점·돌아올 도착점이 된다.
 */
// 진열장(widgets/shelf)과 목록(widgets/patch-table)이 함께 쓰므로 아래 층(entities)에 둔다.
// 같은 층의 위젯끼리는 서로 가져다 쓸 수 없기 때문이다(FSD).
export type PickHandler = (item: PatchCaseData, element: HTMLElement) => void;
