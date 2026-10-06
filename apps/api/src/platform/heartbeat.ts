/**
 * 정기 작업 "다녀감" 신호(healthchecks.io). 작업이 끝나면 신호 주소를 부르고, 실패하면 주소 끝에 /fail을 붙여 부른다.
 * healthchecks는 정해진 시간 안에 신호가 안 오거나 /fail이 오면 운영자 디스코드로 알린다(모니터링 3겹 중 "Cron 감시").
 * 신호 주소(비밀값)가 없으면 아무것도 하지 않는다. 신호 실패는 작업 결과에 영향을 주지 않는다.
 */

/** 신호를 오래 기다리지 않는다(정기 작업 시간을 잡아먹지 않게) */
const TIMEOUT_MS = 5000;

export async function heartbeat(url: string | undefined, ok: boolean): Promise<void> {
  if (!url) {
    return;
  }
  try {
    await fetch(ok ? url : `${url}/fail`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    // 신호 실패는 무시한다(healthchecks가 "안 옴"으로 알린다)
  }
}
