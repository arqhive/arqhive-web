import { patches } from '@arqhive/content';

/**
 * 제보를 받을 수 있는 패치: 공개(released)된 것만. slug → 저장소(owner/name), 게임 이름.
 * 양식이 보낸 slug는 이 표에 있어야 한다(아무 저장소에나 이슈를 만들지 못하게, 저장소는 서버가 정한다).
 * 콘텐츠(Velite) 데이터를 빌드할 때 함께 묶는다.
 */
export const RELEASED_REPOS: ReadonlyMap<
  string,
  { readonly owner: string; readonly name: string; readonly title: string }
> = new Map(
  patches
    .filter((patch) => patch.status === 'released')
    .map((patch) => [
      patch.slug,
      { owner: patch.repo.owner, name: patch.repo.name, title: patch.titleKo },
    ]),
);
