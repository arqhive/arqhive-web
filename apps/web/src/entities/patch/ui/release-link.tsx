import type { DownloadFile } from '@arqhive/shared';
import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

/** 1MB(바이트). 파일 크기 표시용 */
const BYTES_PER_MB = 1_048_576;
/** 갈래(파일 이름 꼬리)별 버튼 이름. 받는 방식이 다른 두 벌을 나눠 받는 패치(3DS)에 쓴다 */
const VARIANT_LABELS: Readonly<Record<string, string>> = {
  // biome-ignore lint/style/useNamingConvention: 파일 이름 꼬리(CIA)를 그대로 키로 쓴다
  CIA: 'CIA 패처',
  // biome-ignore lint/style/useNamingConvention: 파일 이름 꼬리(LayeredFS)를 그대로 키로 쓴다
  LayeredFS: 'LayeredFS',
};

/**
 * 매체를 부르는 말: 디스크 / 게임 카드(3DS·NDS 킵 케이스) / 카트리지(SFC·GB·GBA 종이상자).
 * 문자열 대신 JSX로 돌려준다(한글 문자열 상수는 Biome noSecrets가 비밀값으로 잘못 본다).
 */
function MediaNoun({ patch }: { readonly patch: PatchCaseData }) {
  const spec = CASE_SPECS[patch.platform];
  if (spec.media === 'disc') {
    return <>디스크를</>;
  }
  return spec.form === 'carton' ? <>카트리지를</> : <>게임 카드를</>;
}

function releasePage(patch: PatchCaseData): string {
  return `https://github.com/${patch.repo.owner}/${patch.repo.name}/releases/latest`;
}

/** "13.4MB"(1MB 미만은 "0.6MB"처럼 소수 한 자리) */
function sizeLabel(bytes: number): string {
  return `${(bytes / BYTES_PER_MB).toFixed(1)}MB`;
}

/** 받는 방식이 다른 두 벌(CIA·LayeredFS)을 나란히 놓는 버튼 */
function DownloadChoices({
  patch,
  files,
  className,
}: {
  readonly patch: PatchCaseData;
  readonly files: readonly DownloadFile[];
  readonly className: string;
}) {
  return (
    <div className={`flex gap-[3cqw] ${className}`}>
      {files.map((file) => (
        <a
          key={file.name}
          href={file.url}
          title={file.name}
          data-track="download"
          data-track-patch={patch.slug}
          data-track-file={file.name}
          // 마우스를 올리면: 케이스 인쇄 잉크색으로 칠해지고(글자는 케이스 바탕색) 살짝 떠오르며, 화살표가 아래로 내려간다.
          // 키보드 포커스(focus-visible)도 같은 모양. "동작 줄이기"면 움직임 없이 색만 바뀐다
          className="group flex flex-1 flex-col items-center rounded-[1.5cqw] border border-current px-[2cqw] py-[1.2cqw] text-center leading-tight transition-[background-color,color,translate,box-shadow] duration-200 hover:-translate-y-[0.6cqw] hover:bg-(--p-ink) hover:text-(--p-mid) hover:shadow-lg focus-visible:-translate-y-[0.6cqw] focus-visible:bg-(--p-ink) focus-visible:text-(--p-mid) focus-visible:outline-2 focus-visible:outline-stamp motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
        >
          <span className="font-bold text-[max(3.8cqw,0.75rem)]">
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-y-[0.5cqw] motion-reduce:group-hover:translate-y-0"
            >
              ⬇
            </span>{' '}
            {VARIANT_LABELS[file.variant ?? ''] ?? file.variant}
          </span>
          <span className="font-num text-[max(3cqw,0.625rem)] opacity-80">
            {patch.latestVersion} · {sizeLabel(file.size)}
          </span>
        </a>
      ))}
    </div>
  );
}

/**
 * 패치 파일 말고 따로 받는 선택 파일(예: 환영이문록 동영상 자막 패치, 구글 드라이브).
 * 크기가 커서 GitHub 릴리즈에 못 올린 것들이라 외부 페이지를 새 탭으로 연다. 모양·호버는 DownloadChoices와 같다
 */
function ExtraDownload({
  patch,
  extra,
}: {
  readonly patch: PatchCaseData;
  readonly extra: PatchCaseData['extraDownloads'][number];
}) {
  return (
    <a
      href={extra.url}
      target="_blank"
      rel="noopener noreferrer"
      data-track="download-extra"
      data-track-patch={patch.slug}
      className="group flex flex-col items-center rounded-[1.5cqw] border border-current px-[3cqw] py-[1.2cqw] text-center leading-tight opacity-100 transition-[background-color,color,translate,box-shadow] duration-200 hover:-translate-y-[0.6cqw] hover:bg-(--p-ink) hover:text-(--p-mid) hover:shadow-lg focus-visible:-translate-y-[0.6cqw] focus-visible:bg-(--p-ink) focus-visible:text-(--p-mid) focus-visible:outline-2 focus-visible:outline-stamp motion-reduce:transition-colors motion-reduce:hover:translate-y-0"
    >
      <span className="font-bold text-[max(3.6cqw,0.75rem)]">
        <span
          aria-hidden="true"
          className="inline-block transition-transform duration-200 group-hover:translate-y-[0.5cqw] motion-reduce:group-hover:translate-y-0"
        >
          ⬇
        </span>{' '}
        {extra.label}
      </span>
      {extra.note ? (
        <span className="text-[max(3cqw,0.625rem)] opacity-80">{extra.note}</span>
      ) : null}
    </a>
  );
}

/**
 * 케이스 안 매체(디스크·게임 카드·카트리지) 위에 덮는 투명한 링크 판.
 * - 대표 파일이 있으면(`[코드]_KPatch_[버전]`) 누르는 즉시 그 파일을 받는다(GitHub가 첨부 파일로 내려 주므로 페이지는 그대로).
 * - 받을 파일을 못 찾았으면(게임 코드 없음·GitHub를 못 읽음) 예전처럼 최신 릴리즈 페이지를 새 탭으로 연다.
 * - 받는 방식이 두 벌인 패치(대표 없이 CIA·LayeredFS)는 판을 두지 않고, 케이스 아래 버튼(ReleaseHint)으로 고르게 한다.
 * - 매체 위에 허브 등 다른 부품이 겹쳐 있어서, 매체를 감싸지 않고 같은 모양의 판을 맨 위에 덮는다(shape: 위치·모양 클래스).
 * - 작업 중인 패치는 저장소가 비공개라 링크를 만들지 않는다.
 */
export function ReleaseLink({
  patch,
  shape,
}: {
  readonly patch: PatchCaseData;
  readonly shape: string;
}) {
  if (patch.status !== 'released') {
    return null;
  }
  const main = patch.downloads?.main ?? null;
  if (patch.downloads !== null && main === null) {
    return null;
  }
  const className = `z-10 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-stamp ${shape}`;
  if (main === null) {
    return (
      <a
        href={releasePage(patch)}
        target="_blank"
        rel="noopener noreferrer"
        title="최신 릴리즈 페이지 열기"
        data-track="download"
        data-track-patch={patch.slug}
        className={className}
      >
        <span className="sr-only">{patch.titleKo} 최신 릴리즈 페이지 열기(새 탭)</span>
      </a>
    );
  }
  return (
    <a
      href={main.url}
      title={`패치 파일 받기 — ${main.name}(${sizeLabel(main.size)})`}
      // 방문 통계: 어느 패치의 어떤 파일을 받았는지
      data-track="download"
      data-track-patch={patch.slug}
      data-track-file={main.name}
      className={className}
    >
      <span className="sr-only">
        {patch.titleKo} 패치 파일 받기({main.name}, {sizeLabel(main.size)})
      </span>
    </a>
  );
}

/**
 * 케이스 아래쪽 안내(공개 패치만). 받는 방식이 두 벌이면 안내 대신 버튼 두 개를 놓는다.
 * 글자 크기는 판 폭 비례(cqw)라 가장 가까운 @container(케이스 판)를 기준으로 하되, 작은 화면에서 읽을 수 있게 최소값을 둔다.
 * 색·위치는 놓이는 곳(className)이 정한다.
 */
export function ReleaseHint({
  patch,
  className,
}: {
  readonly patch: PatchCaseData;
  readonly className: string;
}) {
  if (patch.status !== 'released') {
    return null;
  }
  const { downloads } = patch;
  if (downloads !== null && downloads.main === null && downloads.variants.length > 0) {
    return <DownloadChoices patch={patch} files={downloads.variants} className={className} />;
  }
  const hint = (
    <p className="pointer-events-none break-keep text-center text-[max(3.8cqw,0.6875rem)] leading-snug">
      <MediaNoun patch={patch} /> 누르면{' '}
      {downloads?.main ? <>패치 파일을 받습니다.</> : <>최신 릴리즈 페이지로 이동합니다.</>}
    </p>
  );
  if (patch.extraDownloads.length === 0) {
    return <div className={className}>{hint}</div>;
  }
  return (
    // 버튼만큼 위로 자라 작은 화면에서 안내 글이 디스크에 겹치므로, 작은 화면에서는 판 아래 끝 가까이 내린다
    <div className={`flex flex-col items-center gap-[1.5cqw] max-md:bottom-[2%] ${className}`}>
      {hint}
      {patch.extraDownloads.map((extra) => (
        <ExtraDownload key={extra.url} patch={patch} extra={extra} />
      ))}
    </div>
  );
}
