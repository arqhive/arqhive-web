import { githubToken } from '@/shared/config';

/** GitHub REST API 주소 */
export const GITHUB_API = 'https://api.github.com';

/**
 * 데이터 캐시 유지 시간(초): 진열장 페이지의 revalidate와 같게 10분.
 * 페이지와 데이터가 각각 캐시돼 릴리즈 반영이 최대 두 주기 늦는다(1시간이면 2시간 가까이, 10/7 스타폭스 어설트).
 * 10분이면 늦어도 20분. GitHub 요청은 주기마다 약 40번(릴리즈·CHANGELOG × 패치 20개)이라 토큰 한도(시간당 5,000)에 여유가 크다.
 * 라우트 파일의 revalidate(600)는 숫자를 직접 적어야 해서(정적 분석) 두 곳을 함께 고친다.
 */
export const GITHUB_CACHE_SECONDS = 600;

/**
 * GitHub API 요청 헤더(이름은 대소문자를 가리지 않는다). 토큰이 있으면 붙여 한도를 시간당 5,000번으로 늘린다.
 * accept를 바꾸면 파일 내용을 원문 그대로 받을 수 있다(CHANGELOG).
 */
export function githubHeaders(accept = 'application/vnd.github+json'): Headers {
  const headers = new Headers({ accept, 'x-github-api-version': '2022-11-28' });
  const token = githubToken();
  if (token !== undefined) {
    headers.set('authorization', `Bearer ${token}`);
  }
  return headers;
}
