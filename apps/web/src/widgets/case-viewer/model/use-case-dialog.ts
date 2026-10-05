'use client';

import {
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { flyIn, flyOut, transitionsSettled } from '../lib/motion.ts';
import { type CasePhase, closeSteps, openSteps, runSteps } from '../lib/phases.ts';

const ignore = () => undefined;

/** 브라우저가 직접 닫았을 때 상태를 맞추는 데 필요한 것들 */
interface NativeCloseArgs {
  readonly isClosingRef: RefObject<boolean>;
  readonly runRef: RefObject<number>;
  readonly setPhase: (phase: CasePhase) => void;
  readonly setStage: (stage: DialogStage) => void;
  readonly onClosed: () => void;
}

/**
 * dialog를 닫는 사용자 입력 두 가지를 연출이 있는 close로 연결한다.
 * - ESC: 브라우저가 바로 닫아 버리므로(cancel 이벤트) 막고 close로 바꾼다.
 * - 빈 곳 클릭: 무대가 클릭을 통과시켜 클릭 대상이 dialog 자신이 될 때만 닫는다.
 */
function useDismissHandlers(close: () => void, closed: NativeCloseArgs) {
  const onCancel = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      // 안쪽에 뜬 다른 dialog(업데이트 내역)의 cancel이 React 트리를 타고 올라온 것이면 건드리지 않는다
      if (event.target !== event.currentTarget) {
        return;
      }
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
  const onNativeClose = useNativeClose(closed);
  return { onCancel, onBackdropClick, onNativeClose };
}

/**
 * 열기 화면의 큰 흐름. 화면(ui)이 쓰는 세 값을 여기서 끌어낸다.
 * - idle: 안 보임 / opening: 여는 중 / settled: 여는 연출이 다 끝남 / closing: 단계 되돌리는 중 / leaving: 제자리로 날아가는 중
 * - isShown(배경 어둡게): opening·settled·closing, isClosing(닫기 배율): closing·leaving, isSettled(닫기 단추): settled
 */
type DialogStage = 'idle' | 'opening' | 'settled' | 'closing' | 'leaving';

function stageFlags(stage: DialogStage) {
  return {
    isShown: stage === 'opening' || stage === 'settled' || stage === 'closing',
    isClosing: stage === 'closing' || stage === 'leaving',
    isSettled: stage === 'settled',
  };
}

/** 여는·닫는 흐름 한 번에 필요한 재료. isCurrent()가 false가 되면(다른 흐름이 시작됨) 남은 단계를 멈춘다 */
interface Play {
  readonly box: HTMLElement;
  readonly origin: HTMLElement | null;
  readonly boxed: boolean;
  readonly setPhase: (phase: CasePhase) => void;
  readonly setStage: (stage: DialogStage) => void;
  readonly isCurrent: () => boolean;
}

/**
 * 여는 흐름: 날아오기(flyIn) → 단계 진행(openSteps) → 안쪽 transition이 다 끝나면 settled.
 * 기다리는 사이 닫기가 시작됐으면 settled로 덮어쓰지 않는다. 돌려준 Animation은 정리(cleanup) 때 이동을 취소하는 데 쓴다.
 */
function playOpen(play: Play): Animation {
  const move = flyIn(play.box, play.origin);
  move.finished
    .then(() => runSteps(openSteps(play.boxed), play.setPhase, () => !play.isCurrent()))
    .then(() => transitionsSettled(play.box))
    .then(() => (play.isCurrent() ? play.setStage('settled') : undefined))
    .catch(ignore);
  return move;
}

/**
 * 닫는 흐름: closing(배율로 빨라짐) → 단계 되돌리기(closeSteps) → leaving(배경 걷힘) → 제자리로 날아가기(flyOut).
 * closing은 첫 단계 변경(setPhase)과 같은 렌더에 들어가야 첫 transition부터 빨라진다(React가 한 번에 묶어 그림).
 */
async function playClose(play: Play): Promise<void> {
  play.setStage('closing');
  await runSteps(closeSteps(play.boxed), play.setPhase, () => !play.isCurrent());
  play.setStage('leaving');
  await flyOut(play.box, play.origin);
  play.setStage('idle');
}

/**
 * 브라우저가 우리 닫기 흐름을 거치지 않고 dialog를 닫은 경우를 받는다(close 이벤트).
 * 사용자 동작 없이 연 모달은 ESC에 cancel 없이 바로 닫힌다(작품 주소로 들어와 바로 ESC를 누를 때).
 * 연출 없이 상태만 닫힘으로 맞추고 onClosed(주소·제목·등줄기 되돌리기)를 부른다.
 * 우리 흐름이 dialog.close()를 부를 때도 close 이벤트가 오지만, 그때는 isClosingRef가 true라 무시한다.
 */
function useNativeClose({ isClosingRef, runRef, setPhase, setStage, onClosed }: NativeCloseArgs) {
  return useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      // 안쪽에 뜬 다른 dialog(업데이트 내역)의 close가 React 트리를 타고 올라온 것이면 무시
      if (event.target !== event.currentTarget || isClosingRef.current) {
        return;
      }
      isClosingRef.current = true;
      runRef.current += 1;
      setPhase('closed');
      setStage('idle');
      onClosed();
    },
    [isClosingRef, runRef, setPhase, setStage, onClosed],
  );
}

/**
 * 케이스 열기·닫기 순서(FSD model 칸: 화면이 아닌 동작 로직). 움직임 계산은 lib/motion.ts, 단계 순서는 lib/phases.ts가 맡는다.
 *
 * 열기: dialog 띄우기 → playOpen / 닫기: playClose → dialog 닫기 → onClosed()
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
  const [stage, setStage] = useState<DialogStage>('idle');
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
    setStage('opening');
    runRef.current += 1;
    const run = runRef.current;
    const isCurrent = () => runRef.current === run;
    const move = playOpen({ box, origin: originRef.current, boxed, setPhase, setStage, isCurrent });
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
    const isCurrent = () => runRef.current === run;
    playClose({ box, origin: originRef.current, boxed, setPhase, setStage, isCurrent })
      .then(() => {
        dialog.close();
        onClosed();
      })
      .catch(ignore);
  }, [boxed, originRef, onClosed]);

  const dismiss = useDismissHandlers(close, { isClosingRef, runRef, setPhase, setStage, onClosed });

  return {
    dialogRef,
    caseRef,
    ...stageFlags(stage),
    phase,
    close,
    ...dismiss,
  };
}
