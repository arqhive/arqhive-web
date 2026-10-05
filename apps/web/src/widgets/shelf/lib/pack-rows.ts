/**
 * 책장 칸 나누기(순수 계산, FSD lib 칸). 케이스를 왼쪽부터 채우고 칸 폭을 넘으면 다음 칸으로 내린다.
 * 크기는 모두 rem 단위로 계산한다(화면의 실제 px 폭은 rem으로 바꿔서 넘긴다).
 *
 * 북엔드는 같은 칸 안에서 두 묶음(기종) 사이에 있을 때만 넣는다. 그래서 칸의 처음·끝에 홀로 서는 북엔드가 없다.
 * 묶음이 두 칸에 걸치면 칸마다 그 묶음의 첫 케이스에 표찰(label)을 붙인다.
 */

/** 등줄기 폭, 케이스 사이 간격, 북엔드 자리 폭(rem). shelf.tsx의 클래스(w-16, gap-x-0.5, w-8)와 맞춘다. */
const SPINE_REM = 4;
const GAP_REM = 0.125;
const BOOKEND_REM = 2;

interface ShelfGroup<T> {
  readonly key: string;
  readonly label: string;
  readonly members: readonly T[];
}

type ShelfSlot<T> =
  | { readonly kind: 'bookend'; readonly key: string }
  | { readonly kind: 'item'; readonly item: T; readonly label: string | null };

type ShelfRow<T> = readonly ShelfSlot<T>[];

/** 칸 하나를 채워 가는 중의 상태 */
interface RowBuilder<T> {
  slots: ShelfSlot<T>[];
  width: number;
}

/** 이 칸에 케이스 하나를 더 놓을 때 늘어나는 폭. 다른 묶음 뒤라면 북엔드 자리도 함께 든다 */
function addedWidth(row: RowBuilder<unknown>, needsBookend: boolean): number {
  if (row.slots.length === 0) {
    return SPINE_REM;
  }
  return needsBookend ? GAP_REM + BOOKEND_REM + GAP_REM + SPINE_REM : GAP_REM + SPINE_REM;
}

export function packRows<T>(
  groups: readonly ShelfGroup<T>[],
  capacityRem: number,
  keyOf: (item: T) => string,
): ShelfRow<T>[] {
  const rows: ShelfRow<T>[] = [];
  let row: RowBuilder<T> = { slots: [], width: 0 };

  for (const group of groups) {
    group.members.forEach((item, index) => {
      // 이 칸에서 이 묶음의 첫 케이스인지(칸이 바뀌면 다시 첫 케이스가 된다)
      let firstInRow = index === 0;
      let cost = addedWidth(row, firstInRow);
      if (row.slots.length > 0 && row.width + cost > capacityRem) {
        rows.push(row.slots);
        row = { slots: [], width: 0 };
        firstInRow = true;
        cost = addedWidth(row, true);
      }
      if (firstInRow && row.slots.length > 0) {
        row.slots.push({ kind: 'bookend', key: `bookend-${keyOf(item)}` });
      }
      row.slots.push({ kind: 'item', item, label: firstInRow ? group.label : null });
      row.width += cost;
    });
  }
  if (row.slots.length > 0) {
    rows.push(row.slots);
  }
  return rows;
}

export type { ShelfGroup, ShelfRow, ShelfSlot };
