import { CATEGORIES, type Category, type Proposal } from './types.ts';

/**
 * submitProposal 인자 → 처리안 검증(ADR 0017). 모델 출력을 그대로 믿지 않고 코드가 확인한다.
 * - 오류(errors): 분류가 목록에 없음, 답변이 비었음 → 처리안을 쓸 수 없다. 한 번 다시 쓰게 하고, 또 틀리면 보류.
 * - 고칠 점(revisions): 쓸 수는 있지만 기준에 못 미침(합니다체, 옛 버전인데 최신 버전을 안 알림, getPatch를 안 봄)
 *   → 한 번 다시 쓰게 하고, 또 남으면 받되 기록(corrections)에 남긴다.
 * - 코드가 바로잡는 것(corrections): 이번 실행의 도구 결과에 없는 중복 후보·알려진 문제 → 빈 칸으로(지어낸 근거 막기).
 */

const REPLY_MAX = 1200;
const REPLY_MIN = 10;

/** 문장 끝(마침표·물음표·느낌표) */
const SENTENCE_END = /[.!?](?:\s|$)/u;

interface ProposalCheck {
  readonly proposal: Proposal | null;
  readonly errors: readonly string[];
  readonly revisions: readonly string[];
  readonly corrections: readonly string[];
}

/** 이번 실행에서 도구로 실제로 본 것(근거 확인용) */
interface Evidence {
  readonly similarUrls: ReadonlySet<string>;
  readonly knownIssues: readonly string[];
  /** getPatch로 본 최신 버전(안 봤으면 null) */
  readonly latestVersion: string | null;
  /** 검색 결과 중 중복 가능성이 높다고 표시된(likelyDuplicate) 제보 주소 */
  readonly likelyDuplicates: ReadonlySet<string>;
}

/** submitProposal 인자(모델이 채운 값이라 모두 모양을 확인해야 한다) */
interface ProposalArgs {
  readonly category?: unknown;
  readonly duplicateOf?: unknown;
  readonly knownIssue?: unknown;
  readonly outdatedVersion?: unknown;
  readonly reply?: unknown;
  readonly confidence?: unknown;
  readonly reasoning?: unknown;
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** 도구 결과에 있는 중복 후보만 남긴다 */
function checkDuplicate(value: string, evidence: Evidence, corrections: string[]): string | null {
  if (value === '' || evidence.similarUrls.has(value)) {
    return value || null;
  }
  corrections.push(`중복 후보 ${value}는 검색 결과에 없어 지움`);
  return null;
}

/** getPatch의 알려진 문제와 맞는 문장만 남긴다(조금 줄여 썼어도 원문으로 바꿔 둔다) */
function checkKnownIssue(value: string, evidence: Evidence, corrections: string[]): string | null {
  if (value === '') {
    return null;
  }
  const matched = evidence.knownIssues.find(
    (issue) => issue.includes(value) || value.includes(issue),
  );
  if (matched === undefined) {
    corrections.push('알려진 문제가 getPatch 결과에 없어 지움');
    return null;
  }
  return matched;
}

/** 합니다체 문장(…니다. …니까?)이 있는지. 답변은 해요체로 통일한다 */
function hasFormalSentence(reply: string): boolean {
  return reply
    .split(SENTENCE_END)
    .map((sentence) => sentence.trim())
    .some((sentence) => sentence.endsWith('니다') || sentence.endsWith('니까'));
}

/** 쓸 수는 있지만 다시 쓰게 할 점 */
function findRevisions(
  proposal: Pick<Proposal, 'category' | 'reply' | 'outdatedVersion' | 'duplicateOf'>,
  evidence: Evidence,
): string[] {
  const { category, reply, outdatedVersion: outdated } = proposal;
  const revisions: string[] = [];
  if (hasFormalSentence(reply)) {
    revisions.push(
      'reply를 해요체(…해요, …예요, …주세요)로 고치세요. "…니다"로 끝나는 문장이 있습니다',
    );
  }
  if (evidence.latestVersion === null && category !== '스팸') {
    revisions.push('먼저 getPatch로 패치 정보를 확인하고 다시 제출하세요');
  }
  if (outdated && evidence.latestVersion !== null && !reply.includes(evidence.latestVersion)) {
    revisions.push(
      `옛 버전 제보입니다. reply에 최신 버전 ${evidence.latestVersion}을 적어 업데이트를 권하세요`,
    );
  }
  const [likely] = evidence.likelyDuplicates;
  if (proposal.duplicateOf === null && likely !== undefined) {
    revisions.push(
      `검색 결과 ${likely}가 likelyDuplicate입니다. 증상이 같으면 duplicateOf에 넣고, 다르면 reasoning에 무엇이 다른지 적으세요`,
    );
  }
  return revisions;
}

function checkProposal(raw: Readonly<Record<string, unknown>>, evidence: Evidence): ProposalCheck {
  const args = raw as ProposalArgs;
  const errors: string[] = [];
  const corrections: string[] = [];
  const category = str(args.category);
  if (!(CATEGORIES as readonly string[]).includes(category)) {
    errors.push(`category는 ${CATEGORIES.join(' / ')} 중 하나여야 합니다(받은 값: "${category}")`);
  }
  const reply = str(args.reply);
  if (reply.length < REPLY_MIN) {
    errors.push('reply(답변 초안)가 비었거나 너무 짧습니다');
  }
  const duplicateOf = checkDuplicate(str(args.duplicateOf), evidence, corrections);
  const knownIssue = checkKnownIssue(str(args.knownIssue), evidence, corrections);
  if (errors.length > 0) {
    return { proposal: null, errors, revisions: [], corrections };
  }
  const proposal: Proposal = {
    category: category as Category,
    duplicateOf,
    knownIssue,
    outdatedVersion: str(args.outdatedVersion).toLowerCase() === 'yes',
    reply: reply.slice(0, REPLY_MAX),
    confidence: Math.min(1, Math.max(0, Number.parseFloat(str(args.confidence)) || 0)),
    reasoning: str(args.reasoning).slice(0, REPLY_MAX),
  };
  return { proposal, errors, revisions: findRevisions(proposal, evidence), corrections };
}

/** 단계 한도에 걸렸을 때의 "판단 보류" 처리안 */
function fallbackProposal(reason: string): Proposal {
  return {
    category: '질문',
    duplicateOf: null,
    knownIssue: null,
    outdatedVersion: false,
    reply: '제보 감사해요. 운영자가 내용을 확인해 볼게요.',
    confidence: 0,
    reasoning: `판단 보류: ${reason}`,
  };
}

export type { Evidence, ProposalCheck };
export { checkProposal, fallbackProposal };
