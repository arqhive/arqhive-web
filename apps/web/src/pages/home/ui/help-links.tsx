import type { ReactNode } from 'react';

/**
 * 홈 아래쪽 도움 안내 칸 하나. 아직 갈 페이지가 없으면 단추 자리에 흐린 "준비 중"을 보여 준다(없는 주소로 가지 않게).
 * 페이지를 만들면 action 자리에 <Link>를 넘긴다(typedRoutes가 있는 주소인지 검사한다).
 */
function HelpCard({
  question,
  children,
  action,
}: {
  readonly question: string;
  readonly children: ReactNode;
  readonly action: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 border border-line bg-card p-4">
      <p className="font-bold text-ink">{question}</p>
      <p className="break-keep text-ink-sub text-sm">{children}</p>
      <div className="mt-auto pt-1">{action}</div>
    </li>
  );
}

/** 아직 없는 페이지로 가는 단추 자리 */
function Pending({ children }: { readonly children: ReactNode }) {
  return (
    <span
      title="준비 중"
      aria-disabled="true"
      className="inline-block border border-line px-3 py-1.5 text-ink-sub text-sm opacity-60"
    >
      {children} · 준비 중
    </span>
  );
}

/**
 * 홈의 도움 안내 두 칸: 가이드(Q&A 형식의 적용 방법·자주 묻는 질문)와 제보.
 * 문구는 JSX 안에 직접 쓴다(문자열 상수로 빼면 Biome noSecrets가 한글 문장을 비밀값으로 잘못 본다).
 */
export function HelpLinks() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      <HelpCard question="안내가 필요하신가요?" action={<Pending>가이드 보기</Pending>}>
        패치를 적용하는 방법과 자주 묻는 질문을 모아 두었습니다.
      </HelpCard>
      <HelpCard question="패치에 문제가 있었나요?" action={<Pending>제보하기</Pending>}>
        오역, 깨진 글자, 실행 문제를 알려 주시면 확인해 고칩니다.
      </HelpCard>
    </ul>
  );
}
