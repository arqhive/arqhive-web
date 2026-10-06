import type { AgentRunRow } from '@arqhive/db';
import { html } from 'hono/html';
import { labelsFor } from './decide.ts';
import type { ReviewTicket } from './review-link.ts';
import type { Proposal } from './types.ts';

/**
 * 처리안 검토 화면(운영자 한 사람이 디스코드 링크로 여는 작은 HTML). 휴대폰에서 누르기 좋게 한 단으로 둔다.
 * hono/html의 html``은 끼워 넣는 값을 HTML 이스케이프한다(제보 글·모델 출력에 태그가 있어도 그대로 글자로 보인다).
 */

const PERCENT = 100;

const STYLE = `
  :root { color-scheme: light dark; --bg: #f6f3ee; --card: #fff; --ink: #1d1d1f; --sub: #6b6b70; --line: #ddd8cf; --stamp: #b23a2e; }
  @media (prefers-color-scheme: dark) { :root { --bg: #141518; --card: #1d1f24; --ink: #ecebe8; --sub: #9a9aa2; --line: #33363d; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.6 system-ui, -apple-system, "Pretendard", sans-serif; }
  main { max-width: 40rem; margin: 0 auto; padding: 24px 16px 48px; }
  h1 { font-size: 1.25rem; margin: 0 0 4px; }
  .meta { color: var(--sub); font-size: .875rem; margin: 0 0 20px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  dl { display: grid; grid-template-columns: 6.5rem 1fr; gap: 6px 12px; margin: 0; }
  dt { color: var(--sub); }
  dd { margin: 0; word-break: break-all; }
  textarea { width: 100%; min-height: 10rem; padding: 12px; border-radius: 8px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); font: inherit; }
  .hint { color: var(--sub); font-size: .8125rem; margin: 6px 0 16px; }
  .buttons { display: flex; gap: 12px; }
  button { flex: 1; padding: 14px; border-radius: 10px; border: 1px solid var(--line); font: inherit; font-weight: 700; cursor: pointer; background: var(--card); color: var(--ink); }
  button.apply { background: var(--stamp); border-color: var(--stamp); color: #fff; }
  a { color: inherit; }
  .notice { font-size: 1.0625rem; }
`;

function layout(title: string, body: ReturnType<typeof html>) {
  return html`<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>${title} · arqhive</title>
    <style>${STYLE}</style>
  </head>
  <body>
    <main>${body}</main>
  </body>
</html>`;
}

export function reviewPage(run: AgentRunRow, ticket: ReviewTicket) {
  const p = run.proposal as Proposal;
  const corrections = (run.corrections as readonly string[] | null) ?? [];
  const decided = run.status !== 'pending';
  return layout(
    `처리안 #${run.id}`,
    html`<h1>처리안 #${run.id}${run.dryRun ? ' (시험)' : ''}</h1>
      <p class="meta">${run.slug} · <a href="${run.issueUrl}" target="_blank" rel="noopener">이슈 열기 ↗</a></p>
      <section class="card">
        <dl>
          <dt>분류</dt><dd>${p.category} (확신도 ${Math.round(p.confidence * PERCENT)}%)</dd>
          <dt>붙일 라벨</dt><dd>${labelsFor(p).join(', ')}</dd>
          <dt>중복 의심</dt><dd>${p.duplicateOf ?? '없음'}</dd>
          <dt>알려진 문제</dt><dd>${p.knownIssue ?? '없음'}</dd>
          <dt>옛 버전</dt><dd>${p.outdatedVersion ? '그렇게 보임' : '아님'}</dd>
          <dt>근거</dt><dd>${p.reasoning || '(없음)'}</dd>
          ${corrections.length > 0 ? html`<dt>검증에서 고침</dt><dd>${corrections.join(' / ')}</dd>` : ''}
        </dl>
      </section>
      ${
        decided
          ? html`<p class="card notice">이미 처리했어요(${run.status}).</p>`
          : html`<form method="post" action="/api/agent/review" class="card">
              <input type="hidden" name="run" value="${ticket.run}" />
              <input type="hidden" name="exp" value="${ticket.exp}" />
              <input type="hidden" name="sig" value="${ticket.sig}" />
              <label for="reply"><strong>답변</strong></label>
              <textarea id="reply" name="reply" maxlength="2000">${p.reply}</textarea>
              <p class="hint">
                ${p.category === '스팸' ? '스팸은 라벨만 붙이고 댓글은 달지 않아요.' : '적용하면 이 글이 이슈 댓글로 올라가요. 고쳐서 올려도 돼요.'}
              </p>
              <div class="buttons">
                <button type="submit" name="action" value="apply" class="apply">적용</button>
                <button type="submit" name="action" value="ignore">무시</button>
              </div>
            </form>`
      }`,
  );
}

export function noticePage(title: string, message: string, issueUrl?: string) {
  return layout(
    title,
    html`<h1>${title}</h1>
      <p class="card notice">${message}</p>
      ${issueUrl ? html`<p><a href="${issueUrl}" target="_blank" rel="noopener">이슈 열기 ↗</a></p>` : ''}`,
  );
}
