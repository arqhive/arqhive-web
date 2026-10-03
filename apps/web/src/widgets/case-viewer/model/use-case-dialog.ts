'use client';

import {
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flyIn, flyOut } from '../lib/motion.ts';
import { type CasePhase, closeSteps, openSteps, runSteps } from '../lib/phases.ts';

const ignore = () => undefined;

/**
 * dialog를 닫는 사용자 입력 두 가지를 연출이 있는 close로 연결한다.
 * - ESC: 브라우저가 바로 닫아 버리므로(cancel 이벤트) 막고 close로 바꾼다.
 * - 빈 곳 클릭: 무대가 클릭을 통과시켜 클릭 대상이 dialog 자신이 될 때만 닫는다.
 */
function useDismissHandlers(close: () => void) {
  const onCancel = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      close();
    },
    [close],
  );
  const onBackdropClick = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      if (event.target === event.currentTarget) {
        close();
      }
    },
    [close],
  );
  return { onCancel, onBackdropClick };
}

/**
 * 케이스 열기·닫기 순서(FSD model 칸: 화면이 아닌 동작 로직). 움직임 계산은 lib/motion.ts, 단계 순서는 lib/phases.ts가 맡는다.
 *
 * 열기: dialog 띄우기 → 케이스를 "누른 표지 자리"에서 화면 가운데로 이동(flyIn) → 단계 진행(openSteps)
 * 닫기: 단계 되돌리기(closeSteps) → 케이스를 원래 표지 자리로 이동(flyOut) → dialog 닫기 → onClosed()
 * boxed(GC): 종이상자 뚜껑 열기·상자 빼기 단계가 앞뒤로 붙는다.
 * runRef: 진행 중인 순서의 번호. 새 순서가 시작되면 번호가 바뀌어 앞 순서의 남은 단계가 멈춘다.
 */
export function useCaseDialog(
  key: string | null,
  boxed: boolean,
  originRef: RefObject<HTMLElement | null>,
  onClosed: () => void,
) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const caseRef = useRef<HTMLDivElement>(null);
  const [isShown, setIsShown] = useState(false);
  const [phase, setPhase] = useState<CasePhase>('closed');
  const isClosingRef = useRef(false);
  const runRef = useRef(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    const box = caseRef.current;
    if (key === null || dialog === null || box === null) {
      return;
    }
    dialog.showModal();
    isClosingRef.current = false;
    setIsShown(true);
    runRef.current += 1;
    const run = runRef.current;
    const move = flyIn(box, originRef.current);
    move.finished
      .then(() => runSteps(openSteps(boxed), setPhase, () => runRef.current !== run))
      .catch(ignore);
    return () => {
      runRef.current += 1;
      move.cancel();
    };
  }, [key, boxed, originRef]);

  const close = useCallback(() => {
    const dialog = dialogRef.current;
    const box = caseRef.current;
    if (dialog === null || box === null || isClosingRef.current) {
      return;
    }
    isClosingRef.current = true;
    runRef.current += 1;
    const run = runRef.current;
    runSteps(closeSteps(boxed), setPhase, () => runRef.current !== run)
      .then(() => {
        setIsShown(false);
        return flyOut(box, originRef.current);
      })
      .then(() => {
        dialog.close();
        onClosed();
      })
      .catch(ignore);
  }, [boxed, originRef, onClosed]);

  const { onCancel, onBackdropClick } = useDismissHandlers(close);

  return { dialogRef, caseRef, isShown, phase, close, onCancel, onBackdropClick };
}
