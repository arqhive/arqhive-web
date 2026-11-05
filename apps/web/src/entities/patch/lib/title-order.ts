/**
 * 글자 종류 순서. 앞에 있을수록 먼저 온다: 빈칸 → 영문 → 숫자 → 기호 → 한글.
 * 빈칸이 맨 앞이라 "스타폭스 2"가 "스타폭스 가드"보다 앞이다. 어디에도 안 맞는 글자는 기호로 친다.
 */
const SPACE = /\s/;
const LATIN = /[a-z]/i;
const DIGIT = /[0-9]/;
const SYMBOL = /[^\s0-9a-z가-힣ㄱ-ㆎ]/i;
const HANGUL = /[가-힣ㄱ-ㆎ]/;
const CHAR_ORDER = [SPACE, LATIN, DIGIT, SYMBOL, HANGUL] as const;

function charRank(ch: string): number {
  return CHAR_ORDER.findIndex((pattern) => pattern.test(ch));
}

/**
 * 진열장 기종 칸 안의 제목 순서. 글자마다 종류를 먼저 보고(영문 → 숫자 → 기호 → 한글),
 * 같은 종류끼리는 사전 순이다. 영문은 대소문자를 가리지 않는다.
 * 앞부분이 모두 같으면 짧은 제목이 먼저다.
 */
export function compareTitle(a: string, b: string): number {
  const x = [...a.toLowerCase()];
  const y = [...b.toLowerCase()];
  const at = x.findIndex((ch, i) => i < y.length && ch !== y[i]);
  if (at === -1 || at >= y.length) {
    return x.length - y.length;
  }
  const cx = x[at] as string;
  const cy = y[at] as string;
  const rank = charRank(cx) - charRank(cy);
  if (rank !== 0) {
    return rank;
  }
  return cx < cy ? -1 : 1;
}
