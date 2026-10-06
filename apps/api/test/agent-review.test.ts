import { describe, expect, it } from 'vitest';
import { commentBody, labelsFor } from '../src/modules/agent/decide.ts';
import { checkTicket, reviewLink } from '../src/modules/agent/review-link.ts';
import type { Proposal } from '../src/modules/agent/types.ts';
import { parseIssueUrl } from '../src/platform/github.ts';

const SECRET = 'test-secret';
const ORIGIN = 'http://localhost:8787';
const NOW = Date.UTC(2026, 9, 7);
const HOUR_MS = 3_600_000;

/** 링크 주소에서 run·exp·sig를 꺼낸다 */
async function ticketOf(runId: number) {
  const url = new URL(await reviewLink(SECRET, ORIGIN, runId, NOW));
  return {
    run: url.searchParams.get('run') ?? '',
    exp: url.searchParams.get('exp') ?? '',
    sig: url.searchParams.get('sig') ?? '',
  };
}

describe('검토 링크 서명', () => {
  it('만든 링크는 통과하고 실행 번호를 돌려준다', async () => {
    expect(await checkTicket(SECRET, await ticketOf(12), NOW)).toStrictEqual({
      ok: true,
      runId: 12,
    });
  });

  it('실행 번호·만료 시각을 고치거나 다른 키면 막는다', async () => {
    const ticket = await ticketOf(12);
    expect(await checkTicket(SECRET, { ...ticket, run: '13' }, NOW)).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
    expect(
      await checkTicket(SECRET, { ...ticket, exp: String(Number(ticket.exp) + 1) }, NOW),
    ).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
    expect(await checkTicket('other', ticket, NOW)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(await checkTicket(SECRET, { run: '12' }, NOW)).toMatchObject({
      ok: false,
      reason: 'invalid',
    });
  });

  it('72시간이 지나면 만료', async () => {
    const ticket = await ticketOf(12);
    expect(await checkTicket(SECRET, ticket, NOW + 71 * HOUR_MS)).toMatchObject({ ok: true });
    expect(await checkTicket(SECRET, ticket, NOW + 73 * HOUR_MS)).toMatchObject({
      ok: false,
      reason: 'expired',
    });
  });
});

const proposal: Proposal = {
  category: '미번역',
  duplicateOf: null,
  knownIssue: null,
  outdatedVersion: false,
  reply: '제보 감사해요.',
  confidence: 0.8,
  reasoning: '',
};

describe('적용 내용', () => {
  it('라벨은 분류, 중복이면 "중복"을 더한다', () => {
    expect(labelsFor(proposal)).toStrictEqual(['미번역']);
    expect(
      labelsFor({ ...proposal, duplicateOf: 'https://github.com/a/b/issues/1' }),
    ).toStrictEqual(['미번역', '중복']);
  });

  it('댓글: 답변 → 중복 안내 → AI 초안 표시', () => {
    const body = commentBody('제보 감사해요.', 'https://github.com/a/b/issues/1');
    expect(body.split('\n\n')).toHaveLength(3);
    expect(body).toContain('같은 내용의 제보: https://github.com/a/b/issues/1');
    expect(body).toContain('AI가 쓴 초안');
  });

  it('이슈 주소에서 저장소·번호를 꺼내고, 시험 주소는 거른다', () => {
    expect(parseIssueUrl('https://github.com/arqhive/x-korean/issues/42')).toStrictEqual({
      repo: { owner: 'arqhive', name: 'x-korean' },
      number: 42,
    });
    expect(parseIssueUrl('https://github.com/arqhive/x/issues#dry-1')).toBeNull();
  });
});
