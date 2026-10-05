/**
 * Umami Cloud 설정. 웹사이트 ID는 비밀이 아니다(페이지 소스에 그대로 보인다).
 * 스크립트·수집 주소는 next.config.ts의 CSP에도 들어 있다. 바꾸면 함께 바꾼다.
 */
export const UMAMI = {
  scriptSrc: 'https://cloud.umami.is/script.js',
  websiteId: '985a8d19-ee16-4e1d-aded-9cb5d2a3bbc5',
  /** 수집할 사이트 주소(쉼표로 여러 개). 도메인을 사면 더한다 */
  domains: 'arqhive.vercel.app',
} as const;
