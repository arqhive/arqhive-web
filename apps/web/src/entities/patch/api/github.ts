import { githubToken } from '@/shared/config';

/** GitHub REST API 주소 */
export const GITHUB_API = 'https://api.github.com';

/** 데이터 캐시 유지 시간(초): 진열장 페이지의 revalidate와 같게 1시간 */
export const GITHUB_CACHE_SECONDS = 3600;

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
