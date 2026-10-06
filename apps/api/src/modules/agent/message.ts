import type { DiscordMessage } from '../../platform/discord.ts';
import type { AgentRun } from './types.ts';

/**
 * 처리안 디스코드 메시지(ADR 0017). 제보 알림 바로 뒤에 온다.
 * 푸시 한 줄에는 분류를, 카드에는 판단 내용·답변 초안·검증에서 고친 점·비용을 담는다.
 */

/** 임베드 띠 색: 처리안은 파랑, 판단 보류는 회색 */
const COLOR_PROPOSAL = 0x2f_6f_b2;
const COLOR_GAVE_UP = 0x5d_66_73;
const PERCENT = 100;
const MS_PER_SECOND = 1000;

export function proposalNotice(
  report: { readonly game: string; readonly title: string; readonly issueUrl: string },
  run: AgentRun,
  meta: { readonly ms: number; readonly dryRun: boolean; readonly runId: number },
): DiscordMessage {
  const p = run.proposal;
  const lines = [
    `**분류** ${p.category} · **확신도** ${Math.round(p.confidence * PERCENT)}%`,
    p.duplicateOf ? `**중복 의심** ${p.duplicateOf}` : null,
    p.knownIssue ? `**알려진 문제** ${p.knownIssue}` : null,
    p.outdatedVersion ? '**옛 버전으로 보임**' : null,
    `**근거** ${p.reasoning || '(없음)'}`,
    '',
    '**답변 초안**',
    ...p.reply.split('\n').map((line) => `> ${line}`),
    ...(run.corrections.length > 0 ? ['', `**검증에서 고침** ${run.corrections.join(' / ')}`] : []),
    '',
    `-# 실행 #${meta.runId} · ${run.steps.map((step) => step.tool).join('→')} · ${(meta.ms / MS_PER_SECOND).toFixed(1)}초 · 토큰 ${run.inputTokens}+${run.outputTokens}`,
  ];
  return {
    content: `${meta.dryRun ? '[시험] ' : ''}${run.gaveUp ? '판단 보류' : `처리안 · ${p.category}`} · ${report.game}`,
    title: report.title,
    url: report.issueUrl,
    description: lines.filter((line) => line !== null).join('\n'),
    color: run.gaveUp ? COLOR_GAVE_UP : COLOR_PROPOSAL,
  };
}
