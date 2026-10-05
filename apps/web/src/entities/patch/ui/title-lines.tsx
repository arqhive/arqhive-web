import type { PatchCaseData } from '../model/case-data.ts';

/**
 * 한글 제목을 등줄기와 같은 줄 나눔 위치에서 나눈 두 덩어리. 등줄기 줄(spineLines)이 없거나 위치를 못 찾으면 null.
 * 등줄기 줄은 문장부호를 빼고 적은 경우가 있어("키드 이카루스" / "신화와 괴물"), 글자는 titleKo에서 그대로 잘라 쓴다.
 */
function splitTitle(
  patch: Pick<PatchCaseData, 'titleKo' | 'spineLines'>,
): readonly [string, string] | null {
  const second = patch.spineLines?.[1];
  if (second === undefined) {
    return null;
  }
  const at = patch.titleKo.lastIndexOf(second);
  if (at <= 0) {
    return null;
  }
  return [patch.titleKo.slice(0, at).trimEnd(), patch.titleKo.slice(at)];
}

/**
 * 가로쓰기 제목(표지·속지). 덩어리마다 inline-block으로 감싸서, 한 줄에 다 들어가면 한 줄 그대로,
 * 넘칠 때만 등줄기와 같은 위치에서 줄이 바뀐다(덩어리 안은 break-keep으로 낱말 단위). 등줄기 줄이 없으면 제목 그대로.
 */
export function TitleLines({
  patch,
}: {
  readonly patch: Pick<PatchCaseData, 'titleKo' | 'spineLines'>;
}) {
  const parts = splitTitle(patch);
  if (parts === null) {
    return patch.titleKo;
  }
  return (
    <>
      <span className="inline-block">{parts[0]}</span>{' '}
      <span className="inline-block">{parts[1]}</span>
    </>
  );
}
