import {
  buildReportIssue,
  REPORT_LABEL,
  reportInputSchema,
  type SubmittedReport,
} from '@arqhive/shared';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ApiEnv } from '../../platform/env.ts';
import { createIssue } from '../../platform/github.ts';
import { markOnce, sha256, takeToken } from '../../platform/rate-limit.ts';
import { reserveStorage, STORAGE_LIMIT_BYTES } from '../../platform/storage-budget.ts';
import { verifyTurnstile } from '../../platform/turnstile.ts';
import { runReportAgent } from '../agent/index.ts';
import { alertError, notify, reportNotice } from '../notifications/index.ts';
import { RELEASED_REPOS } from './released-repos.ts';
import { type CheckedImage, CONTENT_TYPES, looksLikeBot, readImages } from './report-checks.ts';

/**
 * 제보 받기(POST /api/reports, multipart/form-data). 위에서부터 차례로 거르고, 하나라도 걸리면 그 자리에서 거절한다:
 * 봇 흔적(허니팟·시간) → Turnstile → 횟수 제한(IP별 시간당 3건, 사이트 하루 50건) → 입력 검사 → 같은 내용 재전송
 * → 스크린샷을 R2에 올림(누적 9GB를 넘을 것 같으면 스크린샷은 빼고 글만) → 그 패치 저장소에 "제보" 라벨 이슈 생성
 * → 운영자에게 디스코드 알림(notifications 모듈) → 처리 에이전트(agent 모듈, 처리안도 디스코드로).
 * 실패 코드(invalid·rate·bot·server)는 양식이 알맞은 문구를 고르는 데 쓴다.
 */

const HOUR = 3600;
const DAY = 86_400;
const PER_IP_PER_HOUR = 3;
const SITE_PER_DAY = 50;
const MS_PER_SECOND = 1000;
/** ISO 날짜에서 "년-월"(YYYY-MM) 글자 수 */
const YEAR_MONTH_LENGTH = 7;

type RejectCode = 'invalid' | 'rate' | 'bot' | 'server';
const STATUS = { invalid: 400, bot: 403, rate: 429, server: 500 } as const satisfies Record<
  RejectCode,
  number
>;

/** 거절 사유를 담아 던지는 오류. 받는 쪽에서 코드로 응답을 고른다 */
class Reject extends Error {
  readonly code: RejectCode;
  constructor(code: RejectCode) {
    super(code);
    this.code = code;
  }
}

/** 봇·횟수 검사. IP는 그대로 저장하지 않고 해시로만 센다 */
async function guard(env: ApiEnv, form: FormData, ip: string | null): Promise<void> {
  const token = form.get('cf-turnstile-response');
  // 거절 이유는 Workers 로그(대시보드·wrangler tail)에 남긴다. 사용자 글·IP·토큰 값은 남기지 않는다
  if (looksLikeBot(form)) {
    // biome-ignore lint/suspicious/noConsole: 거절 원인을 운영 로그로 남긴다
    console.warn('report rejected: bot-trace', {
      honeypotFilled: form.get('website') !== '' && form.get('website') !== null,
      elapsedMs: Number(form.get('elapsedMs') ?? '0'),
    });
    throw new Reject('bot');
  }
  const check = await verifyTurnstile(
    env.TURNSTILE_SECRET_KEY,
    typeof token === 'string' ? token : null,
    ip,
  );
  if (!check.ok) {
    // biome-ignore lint/suspicious/noConsole: 거절 원인을 운영 로그로 남긴다
    console.warn('report rejected: turnstile', check.reason);
    throw new Reject('bot');
  }
  const hour = Math.floor(Date.now() / MS_PER_SECOND / HOUR);
  const ipKey = `ip:${await sha256(ip ?? 'unknown')}:${hour}`;
  const dayKey = `day:${Math.floor(hour / (DAY / HOUR))}`;
  if (
    !(
      (await takeToken(env.RATE_LIMIT, ipKey, PER_IP_PER_HOUR, HOUR)) &&
      (await takeToken(env.RATE_LIMIT, dayKey, SITE_PER_DAY, DAY))
    )
  ) {
    throw new Reject('rate');
  }
}

/** 입력 검사: 공개된 패치인지, 글 길이, 이미지. 같은 패치·같은 글은 하루에 한 번만 */
async function validate(env: ApiEnv, form: FormData) {
  const parsed = reportInputSchema.safeParse({ slug: form.get('slug'), text: form.get('text') });
  const repo = parsed.success ? RELEASED_REPOS.get(parsed.data.slug) : undefined;
  const images = await readImages(form);
  if (!parsed.success || repo === undefined || images === null) {
    throw new Reject('invalid');
  }
  if (
    !(await markOnce(
      env.RATE_LIMIT,
      `dup:${await sha256(`${parsed.data.slug}\n${parsed.data.text}`)}`,
      DAY,
    ))
  ) {
    throw new Reject('rate');
  }
  return { repo, slug: parsed.data.slug, text: parsed.data.text, images };
}

/**
 * 스크린샷을 R2에 올리고 공개 주소들을 돌려준다. 키: 년-월/임의값.확장자
 * 올리기 전에 저장 용량 예산을 잡는다. 기준(9GB)을 넘을 것 같으면 올리지 않고 skipped: true(제보는 글만 받는다).
 */
async function upload(
  env: ApiEnv,
  images: readonly CheckedImage[],
): Promise<{ readonly urls: string[]; readonly skipped: boolean }> {
  const total = images.reduce((sum, image) => sum + image.bytes.byteLength, 0);
  if (total > 0 && !(await reserveStorage(env.RATE_LIMIT, total, STORAGE_LIMIT_BYTES))) {
    return { urls: [], skipped: true };
  }
  const month = new Date().toISOString().slice(0, YEAR_MONTH_LENGTH);
  const keys = images.map((image) => `${month}/${crypto.randomUUID()}.${image.kind}`);
  await Promise.all(
    images.map((image, index) =>
      env.REPORT_IMAGES.put(keys[index] ?? '', image.bytes, {
        httpMetadata: { contentType: CONTENT_TYPES[image.kind] },
      }),
    ),
  );
  return { urls: keys.map((key) => `${env.REPORT_IMAGE_BASE_URL}/${key}`), skipped: false };
}

/** 양식이 목록 맨 위에 바로 붙일 방금 만든 제보(목록 카드와 같은 모양) */
function submitted(
  repo: { readonly owner: string; readonly name: string },
  issue: { readonly url: string; readonly id: number },
  text: string,
  images: readonly string[],
): SubmittedReport {
  return {
    id: issue.id,
    repo: `${repo.owner}/${repo.name}`,
    url: issue.url,
    createdAt: new Date().toISOString(),
    text: text.trim(),
    images,
  };
}

/**
 * 제보를 받은 뒤 할 일(응답을 기다리게 하지 않는다): 운영자에게 디스코드 알림 → 처리 에이전트(처리안도 디스코드로).
 * 알림을 먼저 보내야 디스코드에서 제보 → 처리안 순서로 보인다. 실패해도 제보는 이미 성공이다.
 * 시험(dryRun)에는 이슈 주소가 없어서, 고유한 가짜 주소를 에이전트 기록·임베딩의 키로 쓴다.
 */
async function afterReport(
  env: ApiEnv,
  report: {
    readonly slug: string;
    readonly game: string;
    readonly title: string;
    readonly text: string;
  },
  url: string,
  dryRun: boolean,
): Promise<void> {
  await notify(env, reportNotice(report, url, dryRun));
  const issueUrl = dryRun ? `${url}#dry-${Date.now()}` : url;
  await runReportAgent(env, { ...report, issueUrl }, dryRun);
}

// biome-ignore lint/style/useNamingConvention: Hono가 정한 키 이름(Bindings)이라 바꿀 수 없다
export const reportsRoute = new Hono<{ Bindings: ApiEnv }>()
  // 허락한 사이트에서만 양식을 보낼 수 있다(브라우저가 지키는 규칙. 서버 검사는 위 단계들이 따로 한다)
  .use(
    '*',
    cors({
      origin: (origin, c) => (c.env.ALLOWED_ORIGINS.split(',').includes(origin) ? origin : null),
      allowMethods: ['POST'],
    }),
  )
  .post('/', async (c) => {
    try {
      const form = await c.req.formData();
      await guard(c.env, form, c.req.header('cf-connecting-ip') ?? null);
      const { repo, slug, text, images } = await validate(c.env, form);
      const { urls: imageUrls, skipped } = await upload(c.env, images);
      const issue = buildReportIssue({ text, imageUrls });
      // 스크린샷을 저장 한도 때문에 뺐으면 양식이 알려 줄 수 있게 함께 돌려준다
      const imagesSkipped = skipped ? { imagesSkipped: true } : {};
      // 개발 중에는 공개 저장소에 시험 이슈가 생기지 않게 만들지 않는다(wrangler.jsonc의 REPORT_DRY_RUN)
      if (c.env.REPORT_DRY_RUN === '1' || c.env.GITHUB_ISSUES_TOKEN === undefined) {
        const reposUrl = `https://github.com/${repo.owner}/${repo.name}/issues`;
        // 시험 중에도 알림·에이전트는 돈다(받는 사람이 운영자 자신뿐이라 안전하다). 문구 앞에 [시험]이 붙는다
        c.executionCtx.waitUntil(
          afterReport(c.env, { slug, game: repo.title, title: issue.title, text }, reposUrl, true),
        );
        return c.json({
          ok: true,
          url: reposUrl,
          ...imagesSkipped,
          // 시험이라 이슈 id가 없으므로 지금 시각을 id로 쓴다(목록 카드의 key가 겹치지 않으면 된다)
          report: submitted(repo, { url: reposUrl, id: Date.now() }, text, imageUrls),
          // 시험용: 만들었을 이슈 제목·본문(이미지 링크 포함)을 그대로 보여 준다
          dryRun: issue,
        });
      }
      const created = await createIssue(c.env.GITHUB_ISSUES_TOKEN, repo, {
        ...issue,
        label: REPORT_LABEL,
      });
      const { url } = created;
      c.executionCtx.waitUntil(
        afterReport(c.env, { slug, game: repo.title, title: issue.title, text }, url, false),
      );
      return c.json({
        ok: true,
        url,
        ...imagesSkipped,
        report: submitted(repo, created, text, imageUrls),
      });
    } catch (error) {
      const code: RejectCode = error instanceof Reject ? error.code : 'server';
      // 거절(봇·횟수·입력)은 정상 흐름이고, 그 밖의 오류(GitHub·R2 실패 등)만 운영자에게 알린다
      if (!(error instanceof Reject)) {
        c.executionCtx.waitUntil(alertError(c.env, 'POST /api/reports', error));
      }
      return c.json({ ok: false, code }, STATUS[code]);
    }
  })
  // R2에 올린 스크린샷 보여 주기(개발용 주소. 배포에서는 버킷의 공개 주소(r2.dev)를 쓴다)
  // 이미지 주소 설정(REPORT_IMAGE_BASE_URL)이 이 API 자신을 가리킬 때만 연다. 개발(.dev.vars)은 이 주소를 쓰고,
  // 배포는 r2.dev를 쓰므로 404 — 배포 서버로 버킷을 읽는 우회로(요청 수·비용)가 생기지 않는다.
  .get('/images/:month/:file', async (c) => {
    if (!c.env.REPORT_IMAGE_BASE_URL.startsWith(`${new URL(c.req.url).origin}/`)) {
      return c.notFound();
    }
    const object = await c.env.REPORT_IMAGES.get(`${c.req.param('month')}/${c.req.param('file')}`);
    if (object === null) {
      return c.notFound();
    }
    return new Response(object.body, {
      headers: { 'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream' },
    });
  });
