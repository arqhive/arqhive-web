/**
 * 릴리즈 첨부 파일에서 "직접 다운로드"할 파일 고르기(10/7 사용자 결정).
 *
 * 파일 이름 규칙: `[게임 코드]_KPatch_[버전][_꼬리].[확장자]`
 * - 게임 코드: 기기·GameTDB의 4글자 제품 코드(GEDJ, BAGJ …). 정식 코드가 없으면 영문 이름(STARFOX2).
 * - 꼬리: 확장자까지 같은 파일이 여럿일 때만 붙인다. `_CIA`·`_LayeredFS`(받는 방식이 다른 두 벌), `_from-v1.1.2`(업그레이드용).
 *
 * 고르는 법
 * - 대표 파일(main): 꼬리 없는 파일. 여럿이면 zip(설명서까지 든 묶음)을 고른다. 매체를 누르면 이 파일을 받는다.
 * - 갈래(variants): `_CIA`·`_LayeredFS`처럼 받는 방식이 다른 파일. 대표가 없을 때 케이스 아래 버튼으로 나눠 보여 준다.
 * - 업그레이드용(`_from-…`)·README·체크섬은 고르지 않는다(릴리즈 노트에서 받는다).
 */

/** GitHub 릴리즈 첨부 파일에서 쓰는 부분 */
interface ReleaseAsset {
  readonly name: string;
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름을 그대로 쓴다
  readonly browser_download_url: string;
  readonly size: number;
}

/** 받을 파일 하나 */
interface DownloadFile {
  readonly name: string;
  readonly url: string;
  readonly size: number;
  /** 갈래 이름(CIA·LayeredFS). 대표 파일은 null */
  readonly variant: string | null;
}

interface PatchDownloads {
  readonly main: DownloadFile | null;
  readonly variants: readonly DownloadFile[];
}

/** 버튼으로 나눌 갈래(꼬리) — 그 밖의 꼬리는 버튼으로 만들지 않는다 */
const VARIANTS = new Set(['CIA', 'LayeredFS']);

/** 정규식 특수 문자 이스케이프(게임 코드는 영문·숫자뿐이지만 안전하게) */
function escapeRegExp(text: string): string {
  return text.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function pickDownloads(assets: readonly ReleaseAsset[], code: string): PatchDownloads {
  const pattern = new RegExp(
    `^${escapeRegExp(code)}_KPatch_v[^_]+(?:_([A-Za-z0-9.-]+))?\\.([a-z0-9]+)$`,
  );
  const files = assets.flatMap((asset) => {
    const match = pattern.exec(asset.name);
    if (match === null) {
      return [];
    }
    return [
      {
        name: asset.name,
        url: asset.browser_download_url,
        size: asset.size,
        variant: match[1] ?? null,
        extension: match[2] ?? '',
      },
    ];
  });
  const plain = files.filter((file) => file.variant === null);
  const main = plain.find((file) => file.extension === 'zip') ?? plain[0] ?? null;
  const toFile = (file: (typeof files)[number]): DownloadFile => ({
    name: file.name,
    url: file.url,
    size: file.size,
    variant: file.variant,
  });
  return {
    main: main === null ? null : toFile(main),
    variants: files
      .filter((file) => file.variant !== null && VARIANTS.has(file.variant))
      .map(toFile),
  };
}

export type { DownloadFile, PatchDownloads, ReleaseAsset };
export { pickDownloads };
