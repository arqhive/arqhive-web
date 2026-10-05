'use client';

import { type ReactNode, type SyntheticEvent, useEffect, useId, useRef } from 'react';

/**
 * 업데이트 내역 모달. 케이스 열기 화면(<dialog>) 위에 하나 더 뜨는 <dialog>다.
 * - 브라우저는 맨 위 모달에만 ESC(cancel)를 보내므로, ESC를 누르면 이 창만 닫히고 케이스는 열린 채로 남는다.
 * - 바깥(배경)을 누르면 닫힌다. 클릭 대상이 dialog 자신일 때만 닫는다(안쪽 내용 클릭은 무시).
 * - 내용(children)은 서버 함수가 그려 보낸 CHANGELOG다. 받는 중이면 null이라 자리표시(ChangelogSkeleton)를 보여 준다.
 * - 창 높이는 고정이다. 내용에 맞춰 늘면 받은 순간 창이 작았다 커져서 출렁이므로, 늘 같은 크기로 두고 길면 본문 칸 안에서 스크롤된다.
 */
/** 자리표시 한 덩어리(버전 제목 한 줄 + 본문 몇 줄)의 줄 폭. 실제 CHANGELOG 모양을 흉내 낸다 */
const SKELETON_BLOCKS = [
  ['w-2/5', 'w-11/12', 'w-4/5', 'w-3/5'],
  ['w-1/3', 'w-full', 'w-2/3'],
  ['w-2/5', 'w-5/6', 'w-3/4', 'w-1/2'],
] as const;

/**
 * 받는 동안 보여 줄 회색 막대(스켈레톤). 깜박임(animate-pulse)은 "동작 줄이기" 설정이면 끈다.
 * 화면 낭독기에는 막대 대신 "불러오는 중"만 읽힌다.
 */
function ChangelogSkeleton() {
  return (
    <div role="status" className="space-y-6">
      <span className="sr-only">업데이트 내역을 불러오는 중</span>
      {SKELETON_BLOCKS.map((lines) => (
        <div
          key={lines.join()}
          aria-hidden="true"
          className="space-y-2.5 motion-safe:animate-pulse"
        >
          {lines.map((width, index) => (
            <div
              key={`${width}-${index.toString()}`}
              className={`${index === 0 ? 'mb-4 h-4' : 'h-3'} ${width} bg-line`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ChangelogDialog({
  open,
  title,
  children,
  onClose,
}: {
  readonly open: boolean;
  readonly title: string;
  readonly children: ReactNode;
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // open 값에 맞춰 브라우저 dialog를 열고 닫는다(ESC로 닫히면 close 이벤트 → onClose → open이 false가 됨)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const onBackdropClick = (event: SyntheticEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: 키보드 닫기는 dialog 기본 ESC(close 이벤트)가 맡는다. 클릭은 배경 닫기 전용이다
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={onBackdropClick}
      className="m-auto h-[min(80dvh,40rem)] max-h-none w-[min(92vw,36rem)] overflow-hidden border border-line bg-paper p-0 text-ink shadow-xl backdrop:bg-black/40"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between gap-4 border-line border-b px-5 py-3">
          <h2 id={titleId} className="break-keep font-bold font-title">
            {title} 업데이트 내역
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            title="닫기"
            className="flex size-8 shrink-0 items-center justify-center rounded-full border border-line hover:bg-card focus-visible:outline-2 focus-visible:outline-stamp"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="size-1/2 fill-none stroke-current stroke-2 [stroke-linecap:round]"
            >
              <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
            </svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children ?? <ChangelogSkeleton />}
        </div>
      </div>
    </dialog>
  );
}
