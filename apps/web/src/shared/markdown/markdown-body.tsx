import type { ComponentProps } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * 마크다운을 화면 요소로 바꾸는 **서버 컴포넌트**(CHANGELOG, 가이드 페이지 글).
 * 서버에서 그려 결과만 내보내므로 react-markdown 코드는 방문자 브라우저로 가지 않는다.
 * 그래서 클라이언트 코드도 쓰는 shared/ui와 섞지 않고 칸(markdown)을 따로 둔다.
 * - 원문 속 HTML은 그리지 않는다(react-markdown 기본값).
 * - remark-gfm: 표·취소선 같은 GitHub식 문법을 읽는다.
 * - "# 제목"(h1)은 그리지 않는다. 글이 놓이는 곳(모달·페이지)이 자기 제목을 갖는다.
 * - linkBase가 있으면 상대 링크를 그 주소 기준으로 바꿔 새 탭으로 연다(저장소 파일 등). 없으면 사이트 안 주소로 둔다.
 */

/** 모양 이름 → 클래스. compact(모달 등 좁은 곳)와 reading(가이드처럼 읽는 페이지) 두 벌 */
type BlockClasses = Readonly<
  Record<
    'wrap' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'blockquote' | 'code' | 'table' | 'th' | 'td',
    string
  >
>;

/** 좁은 곳(업데이트 내역 모달): 작은 글자, 회색 본문 */
const COMPACT: BlockClasses = {
  wrap: 'text-sm leading-relaxed',
  h2: 'mt-6 font-bold font-title text-base text-ink first:mt-0',
  h3: 'mt-4 font-bold text-ink text-sm',
  p: 'mt-2 break-keep text-ink-sub first:mt-0',
  ul: 'mt-2 list-disc space-y-1 break-keep pl-5 text-ink-sub',
  ol: 'mt-2 list-decimal space-y-1 break-keep pl-5 text-ink-sub',
  blockquote: 'mt-2 border-line border-l-2 pl-3 text-ink-sub',
  code: 'rounded-[3px] bg-line px-1 font-num text-[0.9em] text-ink',
  table: 'mt-3 w-full border-collapse text-left',
  th: 'border-line border-b-2 px-2 py-1.5 font-bold text-ink first:whitespace-nowrap',
  td: 'break-keep border-line border-b px-2 py-1.5 align-top text-ink-sub first:whitespace-nowrap',
};

/**
 * 읽는 페이지(가이드): 글자 한 단계 크게, 줄 간격 1.8, 본문은 회색 대신 잉크색을 조금 옅게(대비를 높임),
 * 문단·목록 사이를 넓게. 표는 행 여백을 넓히고 첫 칸(항목)은 줄을 바꾸지 않는다.
 * 마지막 칸(예)은 넓은 화면(md 이상)에서만 한 줄로 둔다(휴대폰에서는 표가 화면을 넘지 않게 줄바꿈 허용).
 */
const READING: BlockClasses = {
  wrap: 'text-[0.9375rem] leading-[1.8]',
  h2: 'mt-8 font-bold font-title text-lg text-ink first:mt-0',
  h3: 'mt-6 font-bold text-base text-ink',
  p: 'mt-3 break-keep text-ink/85 first:mt-0',
  ul: 'mt-3 list-disc space-y-1.5 break-keep pl-5 text-ink/85 marker:text-ink-sub',
  ol: 'mt-3 list-decimal space-y-1.5 break-keep pl-5 text-ink/85 marker:text-ink-sub',
  blockquote: 'mt-3 border-line border-l-2 pl-3 text-ink-sub text-sm',
  code: 'rounded-[3px] bg-line px-1 font-num text-[0.9em] text-ink',
  table: 'mt-4 w-full border-collapse text-left',
  th: 'border-ink/40 border-b-2 px-3 py-2 font-bold text-ink text-sm first:whitespace-nowrap first:pl-0 md:last:whitespace-nowrap',
  td: 'break-keep border-line border-b px-3 py-3 align-top text-ink/85 first:whitespace-nowrap first:pl-0 first:font-bold first:text-ink md:last:whitespace-nowrap',
};

const LINK = 'text-ink underline underline-offset-2 hover:text-stamp';

/** 바깥 주소(http·https로 시작)인지 */
const EXTERNAL = /^https?:/;

/** 바깥으로 나가는 링크는 새 탭, 사이트 안 주소는 같은 탭 */
function MarkdownLink({ href, children }: ComponentProps<'a'> & { readonly href: string }) {
  if (EXTERNAL.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={LINK}>
        {children}
      </a>
    );
  }
  return (
    <a href={href} className={LINK}>
      {children}
    </a>
  );
}

/** 절대 주소·#은 그대로, 상대 경로는 linkBase가 있을 때만 그 기준의 절대 주소로 */
function resolveHref(href: string | undefined, linkBase: string | undefined): string {
  if (href === undefined) {
    return '#';
  }
  if (linkBase === undefined || href.startsWith('#') || href.startsWith('/')) {
    return href;
  }
  return new URL(href, linkBase).toString();
}

export function MarkdownBody({
  markdown,
  linkBase,
  variant = 'compact',
}: {
  readonly markdown: string;
  readonly linkBase?: string | undefined;
  /** compact: 모달 등 좁은 곳 / reading: 읽는 페이지(가이드) */
  readonly variant?: 'compact' | 'reading';
}) {
  const block = variant === 'reading' ? READING : COMPACT;
  const components: Components = {
    h1: () => null,
    h2: ({ children }) => <h3 className={block.h2}>{children}</h3>,
    h3: ({ children }) => <h4 className={block.h3}>{children}</h4>,
    p: ({ children }) => <p className={block.p}>{children}</p>,
    ul: ({ children }) => <ul className={block.ul}>{children}</ul>,
    ol: ({ children }) => <ol className={block.ol}>{children}</ol>,
    blockquote: ({ children }) => <blockquote className={block.blockquote}>{children}</blockquote>,
    code: ({ children }) => <code className={block.code}>{children}</code>,
    strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
    table: ({ children }) => (
      <div className="overflow-x-auto">
        <table className={block.table}>{children}</table>
      </div>
    ),
    th: ({ children }) => <th className={block.th}>{children}</th>,
    td: ({ children }) => <td className={block.td}>{children}</td>,
    a: ({ href, children }) => (
      <MarkdownLink href={resolveHref(href, linkBase)}>{children}</MarkdownLink>
    ),
  };
  return (
    <div className={block.wrap}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </Markdown>
    </div>
  );
}
