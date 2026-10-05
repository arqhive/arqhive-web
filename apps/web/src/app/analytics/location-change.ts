/**
 * 주소가 바뀔 때 알려 주기. 페이지 이동(Next.js 링크)은 history.pushState를, 케이스 열고 닫기는 replaceState를 쓰는데
 * 브라우저는 이 둘에 대한 이벤트를 주지 않는다. 그래서 두 함수를 한 번 감싸 "arqhive:locationchange" 이벤트를 쏘게 한다.
 * (뒤로·앞으로 가기는 popstate가 따로 온다.) Umami도 같은 방식으로 감싸서 페이지뷰를 세므로 서로 겹쳐도 괜찮다.
 */

const EVENT = 'arqhive:locationchange';
let patched = false;

function patchHistory(): void {
  if (patched) {
    return;
  }
  patched = true;
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method].bind(history);
    history[method] = (...args: Parameters<History['pushState']>) => {
      original(...args);
      globalThis.dispatchEvent(new Event(EVENT));
    };
  }
}

/** 주소(경로)가 바뀔 때마다 listener를 부른다. 같은 경로로 바꾼 것(쿼리만 등)은 무시한다. 돌려준 함수로 해제 */
export function onPathChange(listener: (previous: string, next: string) => void): () => void {
  patchHistory();
  let current = location.pathname;
  const check = () => {
    const next = location.pathname;
    if (next !== current) {
      const previous = current;
      current = next;
      listener(previous, next);
    }
  };
  globalThis.addEventListener(EVENT, check);
  globalThis.addEventListener('popstate', check);
  return () => {
    globalThis.removeEventListener(EVENT, check);
    globalThis.removeEventListener('popstate', check);
  };
}
