import { SITE } from '@/shared/config';

/**
 * GitHub 마크(Octicons `mark-github`, MIT License). GitHub 로고 사용 지침상 GitHub 계정으로 가는 링크에 쓸 수 있다.
 * 색은 글자색(currentColor)을 따라 화면 모드·hover에 맞춰 바뀐다.
 */
const GITHUB_MARK =
  'M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z';

/** 사이트를 연 해 */
const SINCE = 2026;

/** 저작권 표기의 연도: 연 해와 올해가 같으면 "2026", 다르면 "2026–2027" (한국 시간 기준 올해) */
function copyrightYears(): string {
  const thisYear = Number(
    new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric' }).format(new Date()),
  );
  return thisYear > SINCE ? `${SINCE}–${thisYear}` : `${SINCE}`;
}

/**
 * 사이트 푸터: 저작권 표기와 GitHub 링크.
 * 팬 번역 고지(비공식, 롬 배포 안 함, 권리 귀속)는 홈의 면책 조항에 자세히 둔다.
 */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-line border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-ink-sub text-xs sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="font-num">
          © {copyrightYears()} {SITE.name}
        </p>
        <p className="flex items-center gap-4 font-num">
          {/* 아이콘만 보이므로 링크 이름은 화면에 안 보이는 글자(sr-only)로 준다(화면 낭독기가 "GitHub 링크"로 읽음) */}
          <a href="https://github.com/arqhive" className="hover:text-ink">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-[2.5em] fill-current">
              <path d={GITHUB_MARK} />
            </svg>
            <span className="sr-only">GitHub</span>
          </a>
        </p>
      </div>
    </footer>
  );
}
