// shared/api: 바깥 서비스 요청. GitHub 설정은 서버에서만, 우리 API 클라이언트(Hono RPC)는 브라우저에서 쓴다.
export { apiClient } from './api-client.ts';
export { GITHUB_API, GITHUB_CACHE_SECONDS, githubHeaders } from './github.ts';
