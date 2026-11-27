/** 원본판 지역 코드를 읽을 수 있는 이름으로 바꾸고 리비전 표기는 유지한다. */
export function regionLabel(region: string): string {
  const noteStart = region.indexOf('(');
  const codes = noteStart === -1 ? region : region.slice(0, noteStart);
  const note = noteStart === -1 ? '' : region.slice(noteStart);
  const names = codes
    .split('/')
    .map((code) => {
      const trimmed = code.trim();
      if (trimmed === 'JP') {
        return '일본판';
      }
      if (trimmed === 'US') {
        return '북미판';
      }
      return trimmed === 'EU' ? '유럽판' : `${trimmed}판`;
    })
    .join('·');
  return `${names}${note}`;
}
