import type { AgentData, AgentStep, ToolSpec } from './types.ts';
import { CATEGORIES } from './types.ts';

/**
 * 에이전트 도구(ADR 0017). 모델에 알려 줄 정의(TOOL_SPECS)와 실제 실행(runTool).
 * - 도구는 읽기만 한다. GitHub에 쓰는 일은 사람이 승인한 뒤 다른 코드가 한다.
 * - 결과는 모델에 다시 넣을 JSON 문자열과, 기록·디스코드용 짧은 요약을 함께 낸다.
 */

/** 결과 요약 길이 */
const SUMMARY_MAX = 160;
/** 검색 결과 개수 */
const TOP_K = 3;
/** 결과 안 글 조각 길이(모델 입력을 아끼고, 남이 쓴 글이 길게 들어가지 않게) */
const EXCERPT_MAX = 300;
/** 이 유사도 이상이면 중복일 가능성이 높다고 표시한다(모델이 숫자 비교를 놓치지 않게 도구가 판단 재료를 준다) */
const DUPLICATE_SCORE = 0.8;

const SUBMIT_TOOL = 'submitProposal';

const TOOL_SPECS: readonly ToolSpec[] = [
  {
    name: 'getPatch',
    description:
      '제보 대상 패치의 정보: 최신 버전, 원본 판(지역), 적용 방식, 번역 범위, 구동 확인 표, 알려진 문제 목록.',
    parameters: {
      type: 'object',
      properties: { slug: { type: 'string', description: '패치 slug(제보에 적힌 값)' } },
      required: ['slug'],
    },
  },
  {
    name: 'searchSimilarReports',
    description:
      '의미가 비슷한 지난 제보를 찾는다(중복 판단용). 결과의 issueUrl만 중복 후보로 쓸 수 있다. likelyDuplicate가 true면 증상이 같은지 보고 중복으로 처리한다.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '찾을 내용(제보의 핵심 증상 한두 문장, 한국어로)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'searchGuides',
    description: '적용 방법·환경·문제 해결에 관한 가이드·FAQ 문단을 찾는다(답변 근거용).',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: '찾을 내용(한국어로)' } },
      required: ['query'],
    },
  },
  {
    name: SUBMIT_TOOL,
    description: '마지막에 한 번 부른다. 처리안을 제출한다. 다른 도구로 확인한 사실만 쓴다.',
    parameters: {
      type: 'object',
      properties: {
        category: { type: 'string', description: `분류: ${CATEGORIES.join(' / ')} 중 하나` },
        duplicateOf: {
          type: 'string',
          description: '중복이면 searchSimilarReports 결과의 issueUrl, 아니면 빈 문자열',
        },
        knownIssue: {
          type: 'string',
          description:
            '알려진 문제와 같으면 getPatch의 knownIssues 문장을 그대로, 아니면 빈 문자열',
        },
        outdatedVersion: {
          type: 'string',
          description: '제보자가 최신 버전보다 옛 버전을 쓰는 것으로 보이면 "yes", 아니면 "no"',
        },
        reply: { type: 'string', description: '제보자에게 달 첫 답변(한국어 해요체, 3~6문장)' },
        confidence: { type: 'string', description: '확신도 0~1(예: "0.8")' },
        reasoning: { type: 'string', description: '판단 근거 한 줄' },
      },
      required: ['category', 'reply', 'confidence', 'reasoning'],
    },
  },
];

function clip(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** 도구 하나 실행. 알 수 없는 도구·잘못된 인자는 오류 메시지를 결과로 돌려준다(모델이 고쳐 부르게) */
async function runTool(
  name: string,
  args: Readonly<Record<string, unknown>>,
  data: AgentData,
): Promise<{ readonly content: string; readonly step: AgentStep }> {
  const text = (key: string) => (typeof args[key] === 'string' ? (args[key] as string) : '');
  let result: unknown;
  if (name === 'getPatch') {
    result = data.getPatch(text('slug')) ?? { error: `없는 패치: ${text('slug')}` };
  } else if (name === 'searchSimilarReports') {
    const found = await data.searchSimilarReports(text('query'));
    result = found.slice(0, TOP_K).map((item) => ({
      ...item,
      excerpt: clip(item.excerpt, EXCERPT_MAX),
      likelyDuplicate: item.score >= DUPLICATE_SCORE,
    }));
  } else if (name === 'searchGuides') {
    const found = await data.searchGuides(text('query'));
    result = found
      .slice(0, TOP_K)
      .map((item) => ({ ...item, content: clip(item.content, EXCERPT_MAX) }));
  } else {
    result = { error: `알 수 없는 도구: ${name}` };
  }
  const content = JSON.stringify(result);
  return { content, step: { tool: name, args, summary: clip(content, SUMMARY_MAX) } };
}

export { runTool, SUBMIT_TOOL, TOOL_SPECS };
