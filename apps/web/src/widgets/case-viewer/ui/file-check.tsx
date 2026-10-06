import type { PatchCaseData } from '@/entities/patch';

type FileCheckData = NonNullable<PatchCaseData['fileCheck']>;

/** 크기 값의 단위(끝에 붙는 낱말) */
const SIZE_UNIT = ' 바이트';

/**
 * 표 칸 값. 해시는 좁은 칸에서 아무 데서나 줄을 바꾸지만(break-all),
 * 크기("1,048,576 바이트")는 단위가 쪼개지지 않게 숫자 뒤에서 항상 줄을 바꾼다(10/7 사용자 결정).
 */
function CellValue({ value }: { readonly value: string | null }) {
  if (value === null) {
    return <>-</>;
  }
  if (!value.endsWith(SIZE_UNIT)) {
    return <>{value}</>;
  }
  return (
    <>
      {value.slice(0, -SIZE_UNIT.length)}
      <br />
      <span className="break-keep">{SIZE_UNIT.trim()}</span>
    </>
  );
}

/**
 * 속지의 "파일 확인값" 표: 롬 패치(BPS·IPS)의 원본·패치 후 크기와 해시(항목 | 원본 | 결과).
 * 패치 전에 원본이 맞는지, 패치 후 결과가 맞는지 대조할 때 쓴다. 정보 목록 아래에 속지 폭을 다 쓰는 표로 둔다(10/7 사용자 결정: 접지 않음).
 * 해시 칸은 한 번 누르면 통째로 선택된다(select-all) — 복사해서 대조하기 쉽게.
 * 결과 값은 적어 둔 버전(version) 기준이다. 최신 버전과 다르면(릴리즈만 새로 올림) 그 사실을 알린다.
 */
export function FileCheck({
  check,
  latestVersion,
}: {
  readonly check: FileCheckData;
  readonly latestVersion: string;
}) {
  return (
    <section className="mt-3 border-line border-t border-dashed pt-2 text-xs md:mt-[1.5em] md:pt-[1em] md:text-[1em]">
      <h3 className="font-bold">파일 확인값</h3>
      <p className="mt-[0.25em] break-keep text-ink-sub">
        원본: {check.source} · 결과: {check.version}
        {check.version === latestVersion ? null : <> (최신 {latestVersion}과 다를 수 있습니다)</>}
      </p>
      <table className="mt-[0.5em] w-full table-fixed border-collapse text-left">
        <thead className="text-ink-sub">
          <tr className="border-line border-b">
            <th scope="col" className="w-[4.5em] py-[0.25em] pr-[0.5em] font-normal">
              항목
            </th>
            <th scope="col" className="py-[0.25em] pr-[0.5em] font-normal">
              원본
            </th>
            <th scope="col" className="py-[0.25em] font-normal">
              결과
            </th>
          </tr>
        </thead>
        <tbody className="align-top">
          {check.rows.map((row) => (
            <tr key={row.label} className="border-line border-b border-dotted last:border-b-0">
              <th scope="row" className="py-[0.35em] pr-[0.5em] font-bold font-num">
                {row.label}
              </th>
              <td className="select-all break-all py-[0.35em] pr-[0.5em] font-num">
                <CellValue value={row.original} />
              </td>
              <td className="select-all break-all py-[0.35em] font-num">
                <CellValue value={row.patched} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
