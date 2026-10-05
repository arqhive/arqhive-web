import { CASE_SPECS } from '../lib/case-spec.ts';
import type { PatchCaseData } from '../model/case-data.ts';

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

/**
 * 케이스 안 매체(디스크·게임 카드·카트리지) 위에 덮는 투명한 링크 판. 누르면 그 작품의 **최신 릴리즈 페이지**가 새 탭으로 열린다.
 * - 주소 끝의 /releases/latest는 GitHub가 그때그때 "Latest" 릴리즈로 보내 준다(시험판·초안 제외). 새 버전을 올려도 고칠 것이 없다.
 * - 매체 위에 허브 등 다른 부품이 겹쳐 있어서, 매체를 감싸지 않고 같은 모양의 판을 맨 위에 덮는다(shape: 위치·모양 클래스).
 * - 작업 중인 작품은 저장소가 비공개라 방문자에게 404가 나므로 링크를 만들지 않는다.
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
  return (
    <a
      href={`https://github.com/${patch.repo.owner}/${patch.repo.name}/releases/latest`}
      target="_blank"
      rel="noopener noreferrer"
      title="최신 릴리즈 페이지 열기"
      className={`z-10 transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-stamp ${shape}`}
    >
      <span className="sr-only">{patch.titleKo} 최신 릴리즈 페이지 열기(새 탭)</span>
    </a>
  );
}

/**
 * 케이스 아래쪽 안내 한 줄: 매체를 누르면 최신 릴리즈 페이지로 간다는 것을 알린다(링크가 있는 공개 작품만).
 * 글자 크기는 판 폭 비례(cqw)라 가장 가까운 @container(케이스 판)를 기준으로 하되, 작은 화면에서 읽을 수 있게 최소 0.6875rem. 색·위치는 놓이는 곳(className)이 정한다.
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
  return (
    <p
      className={`pointer-events-none break-keep text-center text-[max(3.8cqw,0.6875rem)] leading-snug ${className}`}
    >
      <MediaNoun patch={patch} /> 누르면 최신 릴리즈 페이지로 이동합니다.
    </p>
  );
}
