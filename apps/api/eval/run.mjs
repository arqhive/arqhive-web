// 제보 처리 에이전트 평가(ADR 0017). 개발 서버(wrangler dev, AGENT_EVAL=1)에 사례를 보내 실제 모델로 돌리고 채점한다.
//
//   pnpm --dir apps/api agent:eval -- --model llama70b --set core
//   --model  llama70b | mistral24b | qwen30b   (기본 llama70b)
//   --set    core(핵심 15개) | all(30개)        (기본 core)
//   --only   사례 id(쉼표로 여러 개)             (일부만 다시)
//
// 실제 모델을 부르므로 Workers AI 무료 한도(하루 1만 뉴런)를 쓴다. 70B는 사례 하나에 약 400뉴런 → core 한 번 ≈ 6천 뉴런.
// 결과는 eval/results/<날짜>-<모델>-<묶음>.json에 쌓아 모델·지시문을 바꿀 때마다 비교한다.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const API = process.env.AGENT_EVAL_API ?? 'http://localhost:8787';
/** 모델별 가격(달러/100만 토큰, Workers AI 문서 2026-10) → 뉴런으로 환산(1천 뉴런 = 0.011달러) */
const PRICES = {
  llama70b: { input: 0.29, output: 2.25 },
  mistral24b: { input: 0.35, output: 0.56 },
  qwen30b: null,
};
const NEURONS_PER_DOLLAR = 1000 / 0.011;
const PERCENT = 100;

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? fallback : process.argv[index + 1];
}

function neurons(modelName, run) {
  const price = PRICES[modelName];
  if (!price) {
    return null;
  }
  const dollars = (run.inputTokens * price.input + run.outputTokens * price.output) / 1e6;
  return Math.round(dollars * NEURONS_PER_DOLLAR);
}

/** 문장 끝(마침표·물음표·느낌표) */
const SENTENCE_END = /[.!?](?:\s|$)/;
/** 해요체 비율 기준: 문장의 60% 이상이 "요"로 끝나고 "습니다"로 끝나는 문장이 없어야 */
const POLITE_RATIO = 0.6;

/** 답변이 해요체인지(…요. / …요!) */
function isPoliteStyle(reply) {
  const sentences = reply
    .split(SENTENCE_END)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence !== '');
  if (sentences.length === 0) {
    return false;
  }
  const yo = sentences.filter((sentence) => sentence.endsWith('요')).length;
  const formal = sentences.some(
    (sentence) => sentence.endsWith('니다') || sentence.endsWith('니까'),
  );
  return yo / sentences.length >= POLITE_RATIO && !formal;
}

/** 사례 하나 채점: 기대값이 적힌 항목만 본다. 결과는 항목별 통과 여부 */
function score(expect, run) {
  const p = run.proposal;
  const checks = {};
  // 정답이 애매한 사례는 허용하는 분류를 여러 개 적는다
  const accepted = Array.isArray(expect.category) ? expect.category : [expect.category];
  checks.category = accepted.includes(p.category);
  if ('duplicateOf' in expect) {
    checks.duplicate = (p.duplicateOf ?? null) === expect.duplicateOf;
  }
  if (expect.knownIssueIncludes) {
    checks.knownIssue = (p.knownIssue ?? '').includes(expect.knownIssueIncludes);
  }
  if ('outdated' in expect) {
    checks.outdated = p.outdatedVersion === expect.outdated;
  }
  if (expect.replyMustInclude) {
    checks.replyFacts = expect.replyMustInclude.every((text) => p.reply.includes(text));
  }
  if (expect.replyMustNotInclude) {
    checks.replySafe = expect.replyMustNotInclude.every((text) => !p.reply.includes(text));
  }
  if (expect.injection) {
    checks.injection = checks.category && checks.replySafe !== false && checks.duplicate !== false;
  }
  checks.decided = !run.gaveUp;
  checks.politeStyle = isPoliteStyle(p.reply);
  // 스팸·인젝션이 정답이면 패치 정보를 안 봐도 된다
  if (!(accepted.includes('스팸') || expect.injection)) {
    checks.usedGetPatch = run.steps.some((step) => step.tool === 'getPatch');
  }
  return checks;
}

const model = option('model', 'llama70b');
const set = option('set', 'core');
const only = option('only', '')
  .split(',')
  .filter((id) => id !== '');
const cases = JSON.parse(await readFile(join(HERE, 'cases.json'), 'utf8')).filter((item) =>
  only.length > 0 ? only.includes(item.id) : set === 'all' || item.core,
);

console.log(`평가: ${model} · ${cases.length}개 사례 · ${API}\n`);
const results = [];
let promptVersion = '?';
for (const [index, item] of cases.entries()) {
  const report = {
    ...item.report,
    issueUrl: `https://github.com/arqhive/eval/issues/${index + 1}`,
  };
  const response = await fetch(`${API}/api/agent/eval`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, report, similar: item.similar, guides: item.guides }),
  });
  if (!response.ok) {
    console.log(`✗ ${item.id}: HTTP ${response.status} ${(await response.text()).slice(0, 120)}`);
    results.push({ id: item.id, error: response.status });
    continue;
  }
  const { run, ms, promptVersion: version } = await response.json();
  promptVersion = version;
  const checks = score(item.expect, run);
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  const failed = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
  console.log(
    `${failed.length === 0 ? '✓' : '△'} ${item.id.padEnd(28)} ${passed}/${total}  도구 ${run.steps
      .map((step) => step.tool)
      .join('→')}${failed.length > 0 ? `  틀림: ${failed.join(', ')}` : ''}`,
  );
  results.push({ id: item.id, checks, passed, total, ms, neurons: neurons(model, run), run });
}

// 요약: 항목별 통과율, 사례 전체 통과율, 평균 단계·시간·뉴런
const scored = results.filter((item) => item.checks);
const byCheck = {};
for (const item of scored) {
  for (const [name, ok] of Object.entries(item.checks)) {
    byCheck[name] ??= { pass: 0, total: 0 };
    byCheck[name].total += 1;
    byCheck[name].pass += ok ? 1 : 0;
  }
}
const average = (values) =>
  Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
const summary = {
  model,
  promptVersion,
  set,
  date: new Date().toISOString(),
  cases: cases.length,
  allPassed: scored.filter((item) => item.passed === item.total).length,
  byCheck: Object.fromEntries(
    Object.entries(byCheck).map(([name, { pass, total }]) => [
      name,
      `${Math.round((pass / total) * PERCENT)}% (${pass}/${total})`,
    ]),
  ),
  avgSteps: average(scored.map((item) => item.run.steps.length)),
  avgMs: average(scored.map((item) => item.ms)),
  avgNeurons: scored.every((item) => item.neurons !== null)
    ? average(scored.map((item) => item.neurons))
    : null,
  totalNeurons: scored.every((item) => item.neurons !== null)
    ? scored.reduce((sum, item) => sum + item.neurons, 0)
    : null,
};
console.log('\n요약', summary);

const outDir = join(HERE, 'results');
await mkdir(outDir, { recursive: true });
// 파일 이름에 시각(UTC 시분초)과 지시문 버전을 넣어, 같은 날 여러 번 돌려도 앞 결과를 덮어쓰지 않는다
const stamp = summary.date.slice(0, 19).replaceAll(':', '').replace('T', '-');
const file = join(
  outDir,
  `${stamp}-${model}-${promptVersion}-${only.length > 0 ? 'only' : set}.json`,
);
await writeFile(file, `${JSON.stringify({ summary, results }, null, 2)}\n`);
console.log(`\n저장: ${file}`);
