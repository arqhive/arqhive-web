/**
 * GoatCounter 설정(ADR 0019). 사이트 코드는 비밀이 아니다(페이지 소스에 그대로 보인다).
 * 스크립트·수집 주소는 next.config.ts의 CSP에도 들어 있다. 바꾸면 함께 바꾼다.
 */
export const GOATCOUNTER = {
  scriptSrc: 'https://gc.zgo.at/count.js',
  endpoint: 'https://arqhive.goatcounter.com/count',
  /** 수집할 사이트 주소. 미리보기 배포·로컬은 스크립트를 아예 불러오지 않는다. 도메인을 사면 바꾼다 */
  host: 'arqhive.vercel.app',
  /** 페이지뷰는 주소가 바뀔 때마다 직접 센다(스크립트의 자동 세기·자동 클릭 묶기는 끈다) */
  settings: '{"no_onload":true}',
} as const;
