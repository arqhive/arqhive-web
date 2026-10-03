import { SITE } from '@/shared/config';

/** 사이트 푸터. 팬 번역 사이트로서의 원칙과 고지를 짧게 둔다(자세한 문구는 소개 페이지에서). */
export function SiteFooter() {
  return (
    <footer className="mt-20 border-line border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-ink-sub text-xs sm:px-6 md:flex-row md:items-center md:justify-between">
        <p className="break-keep">
          비공식 팬 번역입니다. 게임 롬·디스크 이미지는 배포하지 않으며, 각 게임의 권리는
          원저작권자에게 있습니다.
        </p>
        <p className="flex gap-4 font-num">
          <a href="https://github.com/arqhive" className="hover:text-ink">
            GitHub
          </a>
          <span>
            {SITE.name} · {SITE.reading}
          </span>
        </p>
      </div>
    </footer>
  );
}
