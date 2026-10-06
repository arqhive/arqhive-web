import { type AgentRunRow, createDb } from '@arqhive/db';
import type { ApiEnv } from '../../platform/env.ts';
import { addIssueComment, addIssueLabels, parseIssueUrl } from '../../platform/github.ts';
import { claimDecision, releaseDecision } from './store.ts';
import type { Proposal } from './types.ts';

/**
 * 운영자의 결정(검토 화면의 [적용]·[무시])을 반영한다(ADR 0017).
 * - 적용: 분류 라벨(+중복이면 "중복") → 답변 댓글(스팸은 라벨만). 에이전트가 아니라 **이 코드**가 GitHub에 쓴다.
 * - 이슈를 닫거나 지우는 일은 하지 않는다.
 * - 먼저 상태를 바꿔 두고(두 번 눌러도 한 번만) GitHub에 쓴다. GitHub가 실패하면 승인 대기로 되돌린다.
 * - 시험 제보(dry_run)는 GitHub에 쓰지 않고 상태만 바꾼다.
 */

/** 댓글 맨 끝에 붙이는 안내(AI 초안임을 숨기지 않는다) */
const COMMENT_FOOTER = '<sub>AI가 쓴 초안을 운영자가 확인해 올린 답변이에요.</sub>';
const REPLY_MAX = 2000;

type DecideOutcome =
  | { readonly kind: 'applied'; readonly labels: readonly string[]; readonly commented: boolean }
  | { readonly kind: 'ignored' }
  | { readonly kind: 'already'; readonly status: string }
  | { readonly kind: 'failed'; readonly message: string };

function labelsFor(proposal: Proposal): string[] {
  return proposal.duplicateOf ? [proposal.category, '중복'] : [proposal.category];
}

function commentBody(reply: string, duplicateOf: string | null): string {
  const parts = [reply.trim()];
  if (duplicateOf) {
    parts.push(`같은 내용의 제보: ${duplicateOf}`);
  }
  parts.push(COMMENT_FOOTER);
  return parts.join('\n\n');
}

async function writeToGitHub(
  env: ApiEnv,
  run: AgentRunRow,
  labels: readonly string[],
  comment: string | null,
): Promise<void> {
  const issue = parseIssueUrl(run.issueUrl);
  if (issue === null || env.GITHUB_ISSUES_TOKEN === undefined) {
    throw new Error('이슈 주소나 GitHub 토큰이 없습니다');
  }
  await addIssueLabels(env.GITHUB_ISSUES_TOKEN, issue, labels);
  if (comment !== null) {
    await addIssueComment(env.GITHUB_ISSUES_TOKEN, issue, comment);
  }
}

async function decide(
  env: ApiEnv,
  run: AgentRunRow,
  action: 'apply' | 'ignore',
  editedReply: string,
): Promise<DecideOutcome> {
  if (!env.DATABASE_URL) {
    return { kind: 'failed', message: 'DB 설정이 없습니다' };
  }
  const db = createDb(env.DATABASE_URL);
  if (action === 'ignore') {
    return (await claimDecision(db, run.id, 'ignored', { action }))
      ? { kind: 'ignored' }
      : { kind: 'already', status: run.status };
  }
  const proposal = run.proposal as Proposal;
  const reply = editedReply.trim().slice(0, REPLY_MAX) || proposal.reply;
  const labels = labelsFor(proposal);
  const commented = proposal.category !== '스팸';
  const decision = { action, labels, reply, edited: reply !== proposal.reply, commented };
  if (!(await claimDecision(db, run.id, 'applied', decision))) {
    return { kind: 'already', status: run.status };
  }
  if (run.dryRun) {
    return { kind: 'applied', labels, commented };
  }
  try {
    await writeToGitHub(
      env,
      run,
      labels,
      commented ? commentBody(reply, proposal.duplicateOf) : null,
    );
    return { kind: 'applied', labels, commented };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await releaseDecision(db, run.id, message);
    return { kind: 'failed', message };
  }
}

export type { DecideOutcome };
export { commentBody, decide, labelsFor };
