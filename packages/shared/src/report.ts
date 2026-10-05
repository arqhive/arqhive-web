import { z } from 'zod';

/**
 * 제보(사이트 양식 → GitHub 이슈) 규칙. web(양식·목록)과 api(받아서 이슈 만들기)가 함께 쓴다.
 * 이슈 본문 형식을 한곳에서 정해, api가 만들고 web이 다시 읽어도(parse) 어긋나지 않게 한다.
 */

/** 제보 한도. 화면 검사와 서버 검사가 같은 값을 쓴다 */
const REPORT_LIMITS = {
  textMin: 10,
  textMax: 2000,
  maxImages: 3,
  // 5MB(5 × 1024 × 1024 바이트)
  maxImageBytes: 5_242_880,
  imageTypes: ['image/png', 'image/jpeg', 'image/webp'],
} as const;

/** 사이트 양식으로 들어온 이슈에 붙는 라벨. 제보 목록은 이 라벨로 찾는다 */
const REPORT_LABEL = '제보';

/** 패치 slug 최대 길이(콘텐츠 slug보다 넉넉하게) */
const SLUG_MAX = 100;

/** 양식 입력(글 부분). 이미지·봇 검사 값은 api가 따로 본다 */
const reportInputSchema = z.object({
  slug: z.string().min(1).max(SLUG_MAX),
  text: z.string().trim().min(REPORT_LIMITS.textMin).max(REPORT_LIMITS.textMax),
});

const START = '<!-- arqhive-report:start -->';
const END = '<!-- arqhive-report:end -->';
const TITLE_LENGTH = 40;
/** 이슈 본문 속 이미지 링크 ![…](https://…) */
const IMAGE_LINK = /!\[[^\]]*\]\((https:\/\/[^)\s]+)\)/g;
/** 인용 줄 앞의 "> " */
const QUOTE_PREFIX = /^> ?/;
/** 알림이 가는 @아이디, 다른 이슈를 가리키는 #번호 */
const MENTION = /@(?=[\w-])/g;
const ISSUE_REF = /#(?=\d)/g;

/**
 * 남이 쓴 글이 GitHub에서 엉뚱하게 동작하지 않게 한다:
 * `@아이디`(그 사람에게 알림)와 `#123`(다른 이슈 참조)의 기호 뒤에 폭 없는 공백(U+200B)을 끼워 링크가 되지 않게 한다.
 */
function neutralizeMentions(text: string): string {
  return text.replaceAll(MENTION, '@\u200b').replaceAll(ISSUE_REF, '#\u200b');
}

/** 이슈 제목·본문 만들기. 사용자 글은 인용(>)으로 넣어 마크다운 장난(제목·가짜 링크 꾸밈 등)을 줄인다 */
function buildReportIssue(input: { readonly text: string; readonly imageUrls: readonly string[] }) {
  const safe = neutralizeMentions(input.text.trim());
  const firstLine = safe.split('\n')[0] ?? '';
  const title = `[제보] ${firstLine.length > TITLE_LENGTH ? `${firstLine.slice(0, TITLE_LENGTH)}…` : firstLine}`;
  const quoted = safe
    .split('\n')
    .map((line) => `> ${line}`)
    .join('\n');
  const images = input.imageUrls
    .map((url, index) => `![스크린샷 ${index + 1}](${url})`)
    .join('\n\n');
  const body = [START, quoted, END, images, '---', '사이트 제보 양식으로 들어온 제보입니다.']
    .filter((part) => part !== '')
    .join('\n\n');
  return { title, body };
}

/** 이슈 본문에서 사용자 글과 이미지 주소를 다시 꺼낸다. 형식이 다르면(사람이 GitHub에서 직접 쓴 이슈) 본문 전체를 글로 본다 */
function parseReportBody(body: string): {
  readonly text: string;
  readonly images: readonly string[];
} {
  const start = body.indexOf(START);
  const end = body.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    return { text: body.trim(), images: [] };
  }
  const text = body
    .slice(start + START.length, end)
    .trim()
    .split('\n')
    .map((line) => line.replace(QUOTE_PREFIX, ''))
    .join('\n')
    .replaceAll('\u200b', '');
  const images = [...body.slice(end).matchAll(IMAGE_LINK)]
    .map((match) => match[1] ?? '')
    .filter(Boolean);
  return { text, images };
}

type ReportInput = z.infer<typeof reportInputSchema>;

export type { ReportInput };
export {
  buildReportIssue,
  neutralizeMentions,
  parseReportBody,
  REPORT_LABEL,
  REPORT_LIMITS,
  reportInputSchema,
};
