import { PLATFORMS } from '@arqhive/shared';
import { defineCollection, defineConfig, s } from 'velite';

/**
 * Velite: 저장소의 MDX 파일을 읽어 frontmatter를 스키마로 검사하고, 타입이 붙은 데이터(.velite/)로 내보낸다.
 * frontmatter에 필수 항목이 빠지거나 값이 틀리면 빌드가 실패한다. 그래서 CI가 콘텐츠 실수를 잡아 준다.
 *
 * 주의: Velite의 `s`는 Velite에 들어 있는 Zod 3 기반이다. @arqhive/shared의 Zod 4 스키마를 직접 섞지 않고,
 * 값 목록(PLATFORMS)만 가져와 같은 기준을 쓴다.
 */

/** 적용 가이드 slug. 작품의 patchMethod가 이 목록 중 하나를 가리킨다. */
const GUIDE_SLUGS = [
  'disc-file-patcher',
  'xdelta',
  'wiiu-sdcafiine',
  '3ds-layeredfs-cia',
  'bps-ips',
  'dsiware',
] as const;

const baseRequirement = s.object({
  region: s.string(),
  gameId: s.string().nullable(),
  dumpFormat: s.string().nullable(),
  md5: s.string().nullable(),
  sha1: s.string().nullable(),
  crc32: s.string().nullable(),
  note: s.string().nullable(),
});

const compatibility = s.object({
  environment: s.string(),
  status: s.enum(['works', 'issues', 'broken', 'untested']),
  note: s.string().nullable(),
});

const patches = defineCollection({
  name: 'Patch',
  // 작품마다 폴더 하나(index.mdx + 나중에 스크린샷 원본)
  pattern: 'patches/*/index.mdx',
  schema: s.object({
    slug: s.slug('patches'),
    // 분류 번호: ARQ-<기종>-<기종 안에서 저장소를 만든 순서>. 목록 보기에 쓴다.
    catalogNo: s.string().regex(/^ARQ-[A-Z0-9]+-\d{3}$/),
    titleKo: s.string(),
    titleOriginal: s.string(),
    titleEn: s.string().nullable(),
    platform: s.enum(PLATFORMS),
    // released: 공개 릴리즈 / in_progress: 비공개 릴리즈라 사이트에서는 "작업 중", 다운로드·제보 숨김
    status: s.enum(['released', 'in_progress']),
    repo: s.object({ owner: s.string(), name: s.string() }),
    baseRegion: s.string(),
    baseRequirements: s.array(baseRequirement),
    patchMethod: s.enum(GUIDE_SLUGS),
    patchMethodLabel: s.string(),
    latestVersion: s.string(),
    latestReleaseDate: s.isodate(),
    translationScope: s.string().nullable(),
    compatibility: s.array(compatibility),
    knownIssues: s.array(s.string()),
    extraDownloads: s.array(s.object({ label: s.string(), url: s.string().url() })).default([]),
    // 전후 비교 스크린샷. 아직 없어서 비워 두고, 화면에는 자리표시를 보여 준다.
    screenshots: s
      .array(s.object({ before: s.string(), after: s.string(), caption: s.string().nullable() }))
      .default([]),
    credits: s.string().nullable(),
    summary: s.string(),
    featured: s.boolean().default(false),
    body: s.mdx(),
  }),
});

const guides = defineCollection({
  name: 'Guide',
  pattern: 'guides/*.mdx',
  schema: s.object({
    slug: s.enum(GUIDE_SLUGS),
    title: s.string(),
    summary: s.string(),
    platforms: s.array(s.enum(PLATFORMS)),
    body: s.mdx(),
  }),
});

export default defineConfig({
  // 콘텐츠는 저장소 맨 위 content/ 폴더에 둔다(코드와 분리).
  root: '../../content',
  output: {
    data: '.velite',
    assets: '.velite/static',
    base: '/static/',
    clean: true,
  },
  collections: { patches, guides },
});
