import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * 홈 아래쪽 도움 안내 칸 하나. action 자리에 가이드·제보 페이지로 가는 <Link>를 넘긴다(typedRoutes가 있는 주소인지 검사한다).
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

/**
 * 홈의 도움 안내 두 칸: 가이드(Q&A 형식의 적용 방법·자주 묻는 질문)와 제보.
 * 문구는 JSX 안에 직접 쓴다(문자열 상수로 빼면 Biome noSecrets가 한글 문장을 비밀값으로 잘못 본다).
 */
export function HelpLinks() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      <HelpCard
        question="안내가 필요하신가요?"
        action={
          <Link
            href="/guide"
            className="inline-block border border-ink bg-ink px-3 py-1.5 text-paper text-sm hover:opacity-90"
          >
            가이드 보기
          </Link>
        }
      >
        패치를 적용하는 방법과 자주 묻는 질문을 모아 두었습니다.
      </HelpCard>
      <HelpCard
        question="패치에 문제가 있었나요?"
        action={
          <Link
            href="/report"
            className="inline-block border border-ink bg-ink px-3 py-1.5 text-paper text-sm hover:opacity-90"
          >
            제보하기
          </Link>
        }
      >
        오역, 깨진 글자, 실행 문제를 알려 주시면 확인해 고칩니다.
      </HelpCard>
    </ul>
  );
}
