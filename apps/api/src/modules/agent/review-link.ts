import { sign, verify } from '../../platform/signing.ts';

/**
 * 처리안 검토 링크(ADR 0017). 디스코드 웹훅은 버튼 클릭을 받을 수 없어서, 서명한 링크를 메시지에 넣는다.
 * - 링크를 아는 사람만 검토 화면을 열 수 있다(실행 번호·만료 시각을 비밀 키로 서명, 72시간 뒤 만료).
 * - 링크를 여는 것(GET)은 화면만 보여 준다. 실제 적용·무시는 화면의 버튼(POST)으로만 한다
 *   (디스코드·브라우저가 링크를 미리 읽어 가도 아무 일도 일어나지 않게).
 */

const SECONDS_PER_HOUR = 3600;
const LINK_TTL_HOURS = 72;
const LINK_TTL_SECONDS = LINK_TTL_HOURS * SECONDS_PER_HOUR;
const MS_PER_SECOND = 1000;

interface ReviewTicket {
  readonly run: string;
  readonly exp: string;
  readonly sig: string;
}

type TicketCheck =
  | { readonly ok: true; readonly runId: number }
  | { readonly ok: false; readonly reason: 'invalid' | 'expired' };

function payload(runId: number, exp: number): string {
  return `review.${runId}.${exp}`;
}

async function reviewLink(
  secret: string,
  apiOrigin: string,
  runId: number,
  now = Date.now(),
): Promise<string> {
  const exp = Math.floor(now / MS_PER_SECOND) + LINK_TTL_SECONDS;
  const sig = await sign(secret, payload(runId, exp));
  return `${apiOrigin}/api/agent/review?run=${runId}&exp=${exp}&sig=${sig}`;
}

async function checkTicket(
  secret: string,
  ticket: Partial<ReviewTicket>,
  now = Date.now(),
): Promise<TicketCheck> {
  const runId = Number(ticket.run);
  const exp = Number(ticket.exp);
  if (!(Number.isSafeInteger(runId) && Number.isSafeInteger(exp) && ticket.sig)) {
    return { ok: false, reason: 'invalid' };
  }
  // 서명을 먼저 확인한다(만료 시각도 서명에 들어 있어 고쳐 쓸 수 없다)
  if (!(await verify(secret, payload(runId, exp), ticket.sig))) {
    return { ok: false, reason: 'invalid' };
  }
  if (exp * MS_PER_SECOND < now) {
    return { ok: false, reason: 'expired' };
  }
  return { ok: true, runId };
}

export type { ReviewTicket, TicketCheck };
export { checkTicket, reviewLink };
