// `pnpm ops`: arqhive 운영 상태를 터미널 한 화면에 모아 보여 준다(읽기만 한다, 아무것도 바꾸지 않는다).
// 관리 사이트 6곳(Vercel·Cloudflare·Neon·Umami·UptimeRobot·healthchecks)을 일일이 열지 않으려고 만들었다.
//
// 필요한 것
// - gh(GitHub CLI 로그인), wrangler(Cloudflare 로그인): 이미 쓰고 있는 로그인 그대로
// - 저장소 맨 위 .env.ops(git 제외): UPTIMEROBOT_API_KEY(읽기 전용), HEALTHCHECKS_API_KEY(읽기 전용)
// - packages/db/.env의 DATABASE_URL(Neon)
// 값이 없는 항목은 "설정 안 됨"으로 건너뛴다. 항목마다 따로 실행해 하나가 실패해도 나머지는 보인다.
import { exec } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execAsync = promisify(exec);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_DIR = join(ROOT, 'apps/api');
const SITE = 'https://arqhive.vercel.app';
const API = 'https://arqhive-api.arqhive.workers.dev';
const REPO = 'arqhive/arqhive-web';
const TIMEOUT_MS = 20_000;
const HTTP_OK = 200;
const STORAGE_LIMIT_GB = 9;
const BYTES_PER_GB = 1_073_741_824;
const MINUTE_MS = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
/** 이 시간까지는 "n시간 전", 넘으면 "n일 전" */
const HOURS_SHOWN = 48;
const TITLE_MAX = 30;
const ERROR_MAX = 80;
const NEWLINE = /\r?\n/;
// UptimeRobot 감시 상태 코드: 2 = up, 8·9 = down(0·1은 일시 중지·확인 전)
const UPTIME_UP = 2;
const UPTIME_DOWN_FROM = 8;

/**
 * 명령 실행. Windows에서 pnpm·gh는 .cmd라 셸로 불러야 해서 명령 한 줄을 그대로 넘긴다.
 * 명령은 이 파일에 적은 고정 글자뿐이다(바깥 입력이 섞이지 않는다).
 */
async function sh(command, cwd = ROOT) {
  const { stdout } = await execAsync(command, { cwd, timeout: TIMEOUT_MS });
  return stdout.trim();
}

async function getJson(url, init = {}) {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

/** "3시간 전" 같은 상대 시각 */
function ago(iso) {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / MINUTE_MS);
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}분 전`;
  }
  const hours = Math.round(minutes / MINUTES_PER_HOUR);
  return hours < HOURS_SHOWN ? `${hours}시간 전` : `${Math.round(hours / HOURS_PER_DAY)}일 전`;
}

/** 패키지의 .env에서 값 하나 읽기(값은 화면에 내지 않는다). 파일이 없으면 undefined */
async function envFrom(file, name) {
  try {
    const text = await readFile(join(ROOT, file), 'utf8');
    const line = text.split(NEWLINE).find((row) => row.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim() || undefined;
  } catch {
    // 파일이 없으면 값도 없다(undefined)
  }
}

/** 운영 키(.env.ops에서 node --env-file로 들어옴). turbo 작업이 아니라 캐시와 상관없다 */
function opsKey(name) {
  return process.env[name] || undefined;
}

async function siteAndApi() {
  const codes = await Promise.all(
    [`${SITE}/`, `${SITE}/korean-translation`, `${API}/api/health`].map((url) =>
      fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) }).then((response) => response.status),
    ),
  );
  return [codes.every((code) => code === HTTP_OK), codes.join(' · ')];
}

async function githubCi() {
  const [latest] = JSON.parse(
    await sh(`gh run list -R ${REPO} -L 1 --json conclusion,status,displayTitle,createdAt`),
  );
  return [
    latest.conclusion === 'success',
    `${latest.conclusion || latest.status} · ${ago(latest.createdAt)} · ${latest.displayTitle.slice(0, TITLE_MAX)}`,
  ];
}

async function webDeploy() {
  const status = JSON.parse(await sh(`gh api repos/${REPO}/commits/main/status`));
  const vercel = status.statuses.find((item) => item.context.includes('Vercel'));
  if (vercel === undefined) {
    return [false, `Vercel 상태 없음 · ${status.sha.slice(0, 7)}`];
  }
  return [
    vercel.state === 'success',
    `${vercel.state} · ${status.sha.slice(0, 7)} · ${ago(vercel.updated_at)}`,
  ];
}

async function apiDeploy() {
  const list = JSON.parse(await sh('pnpm exec wrangler deployments list --json', API_DIR));
  const last = list.at(-1);
  return [
    true,
    `${last.versions[0].version_id.slice(0, 8)} · ${ago(last.created_on)} · ${last.source}`,
  ];
}

async function uptime() {
  const key = opsKey('UPTIMEROBOT_API_KEY');
  if (key === undefined) {
    return [null, '설정 안 됨(.env.ops의 UPTIMEROBOT_API_KEY)'];
  }
  const data = await getJson('https://api.uptimerobot.com/v2/getMonitors', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    // biome-ignore lint/style/useNamingConvention: UptimeRobot API의 매개변수 이름
    body: new URLSearchParams({ api_key: key, format: 'json' }),
  });
  // 키가 틀리면 UptimeRobot은 오류 응답에 받은 키 값을 그대로 돌려준다. 응답 본문은 절대 출력하지 않고 오류 종류만 쓴다
  if (data.stat !== 'ok') {
    throw new Error(
      `UptimeRobot 거절(${data.error?.type ?? '알 수 없음'}) — 키 종류 확인(Read-only API key)`,
    );
  }
  const up = data.monitors.filter((monitor) => monitor.status === UPTIME_UP).length;
  const down = data.monitors
    .filter((monitor) => monitor.status >= UPTIME_DOWN_FROM)
    .map((monitor) => monitor.friendly_name);
  return [
    down.length === 0,
    `${up}/${data.monitors.length} up${down.length > 0 ? ` · 다운: ${down.join(', ')}` : ''}`,
  ];
}

async function cronChecks() {
  const key = opsKey('HEALTHCHECKS_API_KEY');
  if (key === undefined) {
    return [null, '설정 안 됨(.env.ops의 HEALTHCHECKS_API_KEY)'];
  }
  const data = await getJson('https://healthchecks.io/api/v3/checks/', {
    headers: { 'X-Api-Key': key },
  });
  const parts = data.checks.map(
    (check) => `${check.name} ${check.status}${check.last_ping ? `(${ago(check.last_ping)})` : ''}`,
  );
  // new = 첫 신호를 기다리는 중(배포 직후), grace = 늦었지만 아직 유예 시간 안. down·paused만 문제로 본다
  const fine = new Set(['up', 'grace', 'new']);
  return [data.checks.every((check) => fine.has(check.status)), parts.join(' · ')];
}

async function database() {
  const url = await envFrom('packages/db/.env', 'DATABASE_URL');
  if (url === undefined) {
    return [null, '설정 안 됨(packages/db/.env의 DATABASE_URL)'];
  }
  // Neon 드라이버는 packages/db의 의존성이라 거기서 찾는다
  const { neon } = createRequire(join(ROOT, 'packages/db/package.json'))(
    '@neondatabase/serverless',
  );
  const sql = neon(url);
  const [row] =
    await sql`select max(day)::text as last, count(distinct slug)::int as patches, count(*)::int as rows from download_snapshots`;
  return [
    row.rows > 0,
    `다운로드 기록 ${row.rows}줄 · 패치 ${row.patches}개 · 마지막 ${row.last ?? '없음'}`,
  ];
}

async function kvAndStorage() {
  const kv = (key) =>
    sh(`pnpm exec wrangler kv key get ${key} --binding RATE_LIMIT --remote`, API_DIR).catch(
      () => '',
    );
  const [pending, bytes] = await Promise.all([kv('notify:pending'), kv('storage:bytes')]);
  let pendingCount = 0;
  try {
    pendingCount = JSON.parse(pending).length;
  } catch {
    pendingCount = 0;
  }
  const usedGb = (Number(bytes) || 0) / BYTES_PER_GB;
  return [
    pendingCount === 0,
    `못 보낸 알림 ${pendingCount}건 · R2 ${usedGb.toFixed(2)}GB / ${STORAGE_LIMIT_GB}GB`,
  ];
}

/** [이름, 확인 함수] 순서대로 화면에 나온다. 확인 함수는 [정상 여부(null = 설정 안 됨), 설명]을 돌려준다 */
const CHECKS = [
  ['사이트·API', siteAndApi],
  ['GitHub CI', githubCi],
  ['웹 배포(Vercel)', webDeploy],
  ['API 배포(Workers)', apiDeploy],
  ['감시(UptimeRobot)', uptime],
  ['Cron(healthchecks)', cronChecks],
  ['DB(Neon)', database],
  ['KV·R2', kvAndStorage],
];
const MARK = new Map([
  [true, '✅'],
  [false, '❌'],
  [null, '➖'],
]);

console.log('arqhive 운영 상태\n');
const results = await Promise.all(
  CHECKS.map(async ([name, check]) => {
    try {
      return [name, ...(await check())];
    } catch (error) {
      const message = String(error?.message ?? error).split(NEWLINE)[0] ?? '';
      return [name, false, `확인 실패: ${message.slice(0, ERROR_MAX)}`];
    }
  }),
);
const width = Math.max(...results.map(([name]) => name.length)) + 2;
for (const [name, ok, detail] of results) {
  console.log(`${MARK.get(ok)} ${name.padEnd(width)}${detail}`);
}
