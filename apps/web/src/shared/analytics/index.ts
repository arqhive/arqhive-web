// shared/analytics: 방문 통계(GoatCounter) 페이지뷰·이벤트 보내기. 스크립트를 불러오고 자동 측정을 거는 일은 app/analytics가 한다.
export { countPage, flushQueue, type TrackData, track } from './track.ts';
