import type { ComponentProps } from 'react';
import Markdown, { type Components } from 'react-markdown';

/**
 * CHANGELOG.md(마크다운)를 화면 요소로 바꾸는 **서버 컴포넌트**. 진열장 페이지(서버)가 그려서 결과만 클라이언트로 넘긴다.
 * 그래서 react-markdown 코드는 방문자 브라우저로 가지 않는다(이미 그려진 요소만 간다).
 * - 원문 속 HTML은 그리지 않는다(react-markdown 기본값). 남이 쓴 마크다운이 아니어도 안전한 쪽을 기본으로.
 * - 맨 위 "# 변경 내역" 제목은 모달 제목과 겹쳐 그리지 않는다.
 * - 상대 링크(예: docs/releases/v1.3f.md)는 사이트에서 열면 깨지므로 GitHub 저장소 주소로 바꿔 새 탭으로 연다.
 */

const BLOCK = {
  h2: 'mt-6 font-bold font-title text-base text-ink first:mt-0',
  h3: 'mt-4 font-bold text-ink text-sm',
  p: 'mt-2 break-keep text-ink-sub',
  ul: 'mt-2 list-disc space-y-1 break-keep pl-5 text-ink-sub',
  code: 'rounded-[3px] bg-line px-1 font-num text-[0.9em] text-ink',
} as const;

function ExternalLink({ href, children }: ComponentProps<'a'> & { readonly href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-ink underline underline-offset-2 hover:text-stamp"
    >
      {children}
    </a>
  );
}

/** 저장소 기준으로 링크 주소를 바꾼다: 절대 주소·#은 그대로, 상대 경로는 저장소 파일 보기 주소로 */
function resolveHref(href: string | undefined, repoBase: string): string {
  if (href === undefined || href.startsWith('#')) {
    return href ?? '#';
  }
  return new URL(href, repoBase).toString();
}

export function ChangelogBody({
  markdown,
  repo,
}: {
  readonly markdown: string;
  readonly repo: { readonly owner: string; readonly name: string };
}) {
  // 저장소의 기본 가지(HEAD) 맨 위 폴더. 상대 경로 "docs/a.md"는 이 주소 뒤에 붙는다
  const repoBase = `https://github.com/${repo.owner}/${repo.name}/blob/HEAD/`;
  const components: Components = {
    h1: () => null,
    h2: ({ children }) => <h3 className={BLOCK.h2}>{children}</h3>,
    h3: ({ children }) => <h4 className={BLOCK.h3}>{children}</h4>,
    p: ({ children }) => <p className={BLOCK.p}>{children}</p>,
    ul: ({ children }) => <ul className={BLOCK.ul}>{children}</ul>,
    code: ({ children }) => <code className={BLOCK.code}>{children}</code>,
    strong: ({ children }) => <strong className="font-bold text-ink">{children}</strong>,
    a: ({ href, children }) => (
      <ExternalLink href={resolveHref(href, repoBase)}>{children}</ExternalLink>
    ),
  };
  return (
    <div className="text-sm leading-relaxed">
      <Markdown components={components}>{markdown}</Markdown>
    </div>
  );
}
