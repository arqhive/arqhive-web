/**
 * GitHub 릴리즈 목록 읽기(web·api 공통). 응답이 정상(200)이어도 **빈 목록이면 믿지 않는다**.
 *
 * 10/23 확인: GitHub API가 가끔 릴리즈가 있는 저장소에 200과 빈 배열([], 2바이트)을 준다. 같은 요청을 이어 보내면
 * 16개 → 0개 → 0개처럼 바뀌었다. 사이트는 이 빈 응답을 「릴리즈 없음」으로 믿고 10분 캐시해서 버전이 콘텐츠 예비값
 * (옛 버전)으로 돌아갔고, 일일 정산은 다운로드 수를 0으로 저장할 뻔했다.
 * 이 사이트에 올라간 패치(공개 저장소)는 릴리즈가 적어도 하나 있으므로, 빈 목록은 일시적 실패로 보고 다시 받는다.
 * 빈 응답은 몇 분씩 이어지기도 해서 다시 받아도 실패할 수 있다. 그때는 쓰는 쪽이 직전 값을 유지한다(웹: unstable_cache).
 * 브라우저·Workers 공통 패키지라 fetch의 Response 타입 대신 필요한 부분(ok·json)만 받는다.
 */

/** 처음 요청 뒤 다시 받는 최대 횟수 */
const RETRIES = 2;

/** 응답에서 쓰는 부분(fetch의 Response와 맞는다) */
interface ListResponse {
  readonly ok: boolean;
  readonly json: () => Promise<unknown>;
}

/**
 * 릴리즈 목록을 받는다. request(attempt)는 attempt 0이 첫 요청(캐시를 써도 됨), 1부터는 캐시를 거치지 않는 새 요청이어야 한다.
 * 실패(응답 오류·네트워크 오류·끝까지 빈 목록)면 null.
 */
async function fetchReleaseList<T>(
  request: (attempt: number) => Promise<ListResponse>,
): Promise<readonly T[] | null> {
  for (let attempt = 0; attempt <= RETRIES; attempt += 1) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: 앞 응답이 비었을 때만 다음 요청을 보낸다
      const response = await request(attempt);
      if (!response.ok) {
        return null;
      }
      const body: unknown = await response.json();
      if (Array.isArray(body) && body.length > 0) {
        return body as T[];
      }
    } catch {
      return null;
    }
  }
  return null;
}

export { fetchReleaseList };
