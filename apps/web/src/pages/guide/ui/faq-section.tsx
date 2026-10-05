import { type Faq, faqs, guides } from '@arqhive/content';
import { useId } from 'react';
import { MarkdownBody } from '@/shared/markdown';

/** 자주 묻는 질문 묶음 순서 */
const GROUPS: readonly Faq['group'][] = ['apply', 'environment', 'trouble'];

/** 묶음 이름. 문자열 상수로 두면 Biome noSecrets가 한글을 비밀값으로 잘못 보므로 JSX로 쓴다 */
function GroupLabel({ group }: { readonly group: Faq['group'] }) {
  if (group === 'apply') {
    return <>적용하기</>;
  }
  return group === 'environment' ? <>실행 환경</> : <>문제가 생겼을 때</>;
}

interface FaqItem {
  readonly id: string;
  readonly question: string;
  readonly answer: string;
}

/**
 * 묶음 하나의 질문 목록. "적용하기" 묶음 끝에는 패치 방식별 적용 가이드(content/guides)를 질문처럼 덧붙인다.
 */
function itemsOf(group: Faq['group']): readonly FaqItem[] {
  const questions = faqs
    .filter((faq) => faq.group === group)
    .toSorted((a, b) => a.order - b.order)
    .map((faq) => ({ id: faq.question, question: faq.question, answer: faq.answer }));
  if (group !== 'apply') {
    return questions;
  }
  const howTo = guides.map((guide) => ({
    id: guide.slug,
    question: `적용 방법: ${guide.title}`,
    answer: `${guide.summary}\n\n${guide.raw}`,
  }));
  return [...questions, ...howTo];
}

/**
 * 질문 하나 = <details> 하나(아코디언). JS 없이 열고 닫히고, 브라우저 찾기(Ctrl+F)가 접힌 답 안의 글자도 찾아 펼쳐 준다.
 * 기본 펼침 표시(▶)는 지우고(list-none) 오른쪽 화살표를 열림 상태(group-open)에 맞춰 돌린다.
 * 답은 왼쪽 선이 있는 칸에 넣어 질문과 구분하고, 어디서 끝나는지 보이게 한다.
 */
function FaqDetails({ item }: { readonly item: FaqItem }) {
  return (
    <details className="group border-line border-b">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-bold text-base text-ink hover:text-stamp [&::-webkit-details-marker]:hidden">
        <span className="break-keep">{item.question}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 16 16"
          className="size-4 shrink-0 fill-none stroke-current stroke-2 transition-transform group-open:rotate-180"
        >
          <path d="M3.5 6l4.5 4.5L12.5 6" />
        </svg>
      </summary>
      <div className="mb-5 border-ink/30 border-l-2 pl-4">
        <MarkdownBody markdown={item.answer} variant="reading" />
      </div>
    </details>
  );
}

export function FaqSection() {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="space-y-10">
      <h2 id={titleId} className="font-bold font-title text-xl">
        자주 묻는 질문
      </h2>
      {GROUPS.map((group) => (
        <div key={group}>
          <h3 className="font-bold text-ink-sub text-xs tracking-wider">
            <GroupLabel group={group} />
          </h3>
          <div className="mt-2 border-ink/40 border-t-2">
            {itemsOf(group).map((item) => (
              <FaqDetails key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
