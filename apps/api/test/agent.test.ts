import { describe, expect, it } from 'vitest';
import { runAgent } from '../src/modules/agent/loop.ts';
import type { AgentData, ModelFn, ModelTurn } from '../src/modules/agent/types.ts';
import { toolCallFromText } from '../src/platform/workers-ai.ts';

/** 정해 둔 응답을 차례로 돌려주는 가짜 모델(실제 모델 없이 루프만 시험) */
function scripted(turns: readonly Partial<ModelTurn>[]): ModelFn {
  let index = 0;
  return () => {
    const turn = turns[Math.min(index, turns.length - 1)] ?? {};
    index += 1;
    return Promise.resolve({
      text: '',
      toolCalls: [],
      inputTokens: 100,
      outputTokens: 20,
      ...turn,
    });
  };
}

const data: AgentData = {
  getPatch: (slug) =>
    slug === 'star-fox-zero'
      ? {
          slug,
          title: '스타폭스 제로',
          platform: 'wiiu',
          status: 'released',
          latestVersion: 'v1.2f',
          baseRegion: 'JP',
          patchMethod: '파일 패처',
          translationScope: null,
          compatibility: [{ environment: 'Cemu', status: 'works', note: null }],
          knownIssues: ['일부 컷신 자막이 영어로 나옵니다.'],
        }
      : null,
  searchSimilarReports: () =>
    Promise.resolve([
      {
        issueUrl: 'https://github.com/arqhive/x/issues/3',
        title: '컷신 자막 영어',
        state: 'open',
        excerpt: '...',
        score: 0.9,
      },
    ]),
  searchGuides: () => Promise.resolve([]),
};

const report = {
  issueUrl: 'https://github.com/arqhive/x/issues/9',
  slug: 'star-fox-zero',
  title: '[제보] 컷신 자막',
  text: '오프닝 컷신 자막이 영어로 나와요.',
};

const submit = (args: Record<string, unknown>) => ({
  toolCalls: [{ name: 'submitProposal', args }],
});

describe('runAgent — 처리안', () => {
  it('도구를 차례로 부르고 처리안을 낸다. 근거에 있는 중복·알려진 문제는 남긴다', async () => {
    const run = await runAgent(
      report,
      data,
      scripted([
        { toolCalls: [{ name: 'getPatch', args: { slug: 'star-fox-zero' } }] },
        { toolCalls: [{ name: 'searchSimilarReports', args: { query: '컷신 자막 영어' } }] },
        submit({
          category: '오역',
          duplicateOf: 'https://github.com/arqhive/x/issues/3',
          knownIssue: '일부 컷신 자막이 영어로 나옵니다.',
          reply: '제보 감사해요. 알려진 문제로 확인했어요.',
          confidence: '0.8',
          reasoning: '알려진 문제',
        }),
      ]),
    );
    expect(run.gaveUp).toBe(false);
    expect(run.steps.map((step) => step.tool)).toStrictEqual([
      'getPatch',
      'searchSimilarReports',
      'submitProposal',
    ]);
    expect(run.proposal.duplicateOf).toBe('https://github.com/arqhive/x/issues/3');
    expect(run.proposal.knownIssue).toBe('일부 컷신 자막이 영어로 나옵니다.');
    expect(run.inputTokens).toBe(300);
  });

  it('도구로 보지 않은 중복 후보·알려진 문제는 지운다(지어낸 근거 막기)', async () => {
    const run = await runAgent(
      report,
      data,
      scripted([
        submit({
          category: '오역',
          duplicateOf: 'https://github.com/arqhive/x/issues/99',
          knownIssue: '지어낸 문제',
          reply: '제보 감사해요. 확인해 볼게요.',
          confidence: '0.5',
          reasoning: '',
        }),
      ]),
    );
    expect(run.proposal.duplicateOf).toBeNull();
    expect(run.proposal.knownIssue).toBeNull();
    expect(run.corrections.filter((text) => text.includes('지움'))).toHaveLength(2);
  });
});

describe('runAgent — 고칠 점', () => {
  const getPatch = { toolCalls: [{ name: 'getPatch', args: { slug: 'star-fox-zero' } }] };

  it('합니다체 답변은 한 번 다시 쓰게 한다', async () => {
    const run = await runAgent(
      report,
      data,
      scripted([
        getPatch,
        submit({
          category: '미번역',
          reply: '제보 감사합니다. 확인하겠습니다.',
          confidence: '0.7',
        }),
        submit({ category: '미번역', reply: '제보 감사해요. 확인해 볼게요.', confidence: '0.7' }),
      ]),
    );
    expect(run.steps.map((step) => step.tool)).toStrictEqual([
      'getPatch',
      'submitProposal',
      'submitProposal',
    ]);
    expect(run.proposal.reply).toBe('제보 감사해요. 확인해 볼게요.');
    expect(run.corrections).toStrictEqual([]);
  });

  it('옛 버전이면 답변에 최신 버전을 적게 하고, 두 번째에도 빠지면 받되 기록에 남긴다', async () => {
    const outdated = submit({
      category: '글자 깨짐',
      outdatedVersion: 'yes',
      reply: '제보 감사해요. 최신 버전으로 바꿔 보세요.',
      confidence: '0.7',
    });
    const run = await runAgent(report, data, scripted([getPatch, outdated, outdated]));
    expect(run.gaveUp).toBe(false);
    expect(run.steps[1]?.summary).toContain('v1.2f');
    expect(run.corrections.some((text) => text.startsWith('남은 문제'))).toBe(true);
  });
});

describe('toolCallFromText', () => {
  it('글로 쓴 도구 호출(JSON 하나)만 살린다', () => {
    expect(
      toolCallFromText('{"name": "getPatch", "parameters": {"slug": "star-fox-zero"}}'),
    ).toStrictEqual([{ name: 'getPatch', args: { slug: 'star-fox-zero' } }]);
    expect(toolCallFromText('getPatch를 부르겠습니다. {"name": "getPatch"}')).toStrictEqual([]);
    expect(toolCallFromText('{"slug": "x"}')).toStrictEqual([]);
  });
});

describe('runAgent — 다시 쓰기·보류', () => {
  it('분류가 틀리면 한 번 다시 쓰게 하고, 고치면 받는다', async () => {
    const run = await runAgent(
      report,
      data,
      scripted([
        submit({
          category: '버그',
          reply: '제보 감사해요. 확인해 볼게요.',
          confidence: '0.5',
          reasoning: '',
        }),
        submit({
          category: '실행 문제',
          reply: '제보 감사해요. 확인해 볼게요.',
          confidence: '0.5',
          reasoning: '',
        }),
      ]),
    );
    expect(run.gaveUp).toBe(false);
    expect(run.proposal.category).toBe('실행 문제');
  });

  it('도구 없이 말만 계속하면 판단 보류', async () => {
    const run = await runAgent(report, data, scripted([{ text: '음…' }]));
    expect(run.gaveUp).toBe(true);
    expect(run.proposal.confidence).toBe(0);
  });

  it('단계 한도를 넘으면 판단 보류', async () => {
    const run = await runAgent(
      report,
      data,
      scripted([{ toolCalls: [{ name: 'searchGuides', args: { query: 'x' } }] }]),
      3,
    );
    expect(run.gaveUp).toBe(true);
    expect(run.steps).toHaveLength(3);
  });
});
