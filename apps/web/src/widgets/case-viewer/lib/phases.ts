import { CLOSE_TEMPO, prefersReducedMotion, wait } from './motion.ts';

/**
 * 케이스 열기 단계.
 * - closed: 다 닫힘(GC는 종이상자 뚜껑도 닫힘)
 * - lid: GC 상자 윗뚜껑이 열림
 * - unboxed: GC 상자가 아래로 빠져 킵 케이스가 드러남
 * - open: 표지가 넘어가 안이 보임
 */
type CasePhase = 'closed' | 'lid' | 'unboxed' | 'open';

/** 한 단계: phase로 바꾼 뒤 holdMs만큼 기다린다. 시간은 ui의 transition 시간과 맞춘다. */
interface Step {
  readonly phase: CasePhase;
  readonly holdMs: number;
}

/** 표지가 덮이는 시간(ms) */
const COVER_CLOSE_MS = 900;
/** 상자 뚜껑이 열리고 닫히는 시간(ms) */
const LID_MS = 450;
/** 상자가 빠지고 돌아오는 시간(ms) */
const UNBOX_MS = 650;

/** 여는 순서. 종이상자가 있으면 뚜껑 열기 → 상자 빼기 → 표지 넘기기 */
export function openSteps(boxed: boolean): readonly Step[] {
  if (!boxed) {
    return [{ phase: 'open', holdMs: 0 }];
  }
  return [
    { phase: 'lid', holdMs: LID_MS },
    { phase: 'unboxed', holdMs: UNBOX_MS },
    { phase: 'open', holdMs: 0 },
  ];
}

/** 닫는 순서. 여는 순서를 거꾸로: 표지 덮기 → 상자 다시 씌우기 → 뚜껑 닫기. 기다리는 시간은 닫기 배율만큼 줄인다 */
export function closeSteps(boxed: boolean): readonly Step[] {
  const steps: readonly Step[] = boxed
    ? [
        { phase: 'unboxed', holdMs: COVER_CLOSE_MS },
        { phase: 'lid', holdMs: UNBOX_MS },
        { phase: 'closed', holdMs: LID_MS },
      ]
    : [{ phase: 'closed', holdMs: COVER_CLOSE_MS }];
  return steps.map((step) => ({ ...step, holdMs: step.holdMs * CLOSE_TEMPO }));
}

/**
 * 단계를 차례로 밟는다. isCancelled()가 true가 되면(새 열기·닫기가 시작됨) 남은 단계를 건너뛴다.
 * 동작 줄이기를 켠 사용자는 기다리지 않고 마지막 단계로 바로 간다.
 */
export async function runSteps(
  steps: readonly Step[],
  setPhase: (phase: CasePhase) => void,
  isCancelled: () => boolean,
): Promise<void> {
  const reduced = prefersReducedMotion();
  for (const step of steps) {
    if (isCancelled()) {
      return;
    }
    setPhase(step.phase);
    // 단계마다 앞 단계의 transition이 끝나야 다음으로 넘어가므로 순서대로 기다린다.
    // biome-ignore lint/performance/noAwaitInLoops: 단계는 앞 단계가 끝난 뒤에만 시작해야 한다
    await wait(reduced ? 0 : step.holdMs);
  }
}

export type { CasePhase };
