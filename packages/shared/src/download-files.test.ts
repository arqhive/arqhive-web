import { describe, expect, it } from 'vitest';
import { pickDownloads, type ReleaseAsset } from './download-files.ts';

function asset(name: string): ReleaseAsset {
  // biome-ignore lint/style/useNamingConvention: GitHub API 응답의 필드 이름
  return { name, browser_download_url: `https://dl/${name}`, size: 1 };
}

describe('pickDownloads', () => {
  // biome-ignore lint/security/noSecrets: 한글 문장·파일 이름을 비밀값으로 잘못 본다
  it('꼬리 없는 파일이 여럿이면 zip이 대표, 업그레이드용·부가 파일은 고르지 않는다', () => {
    const result = pickDownloads(
      [
        asset('STARFOX2_KPatch_v1.2f.bps'),
        asset('STARFOX2_KPatch_v1.2f.ips'),
        asset('STARFOX2_KPatch_v1.2f.zip'),
        asset('STARFOX2_KPatch_v1.2f_from-v1.1.2.bps'),
        asset('SHA256SUMS.txt'),
      ],
      'STARFOX2',
    );
    expect(result.main?.name).toBe('STARFOX2_KPatch_v1.2f.zip');
    expect(result.variants).toHaveLength(0);
  });

  it('파일이 하나면 확장자와 상관없이 그게 대표', () => {
    expect(pickDownloads([asset('G8WJ_KPatch_v0.1.xdelta')], 'G8WJ').main?.name).toBe(
      'G8WJ_KPatch_v0.1.xdelta',
    );
  });

  it('CIA·LayeredFS 두 벌이면 대표 없이 갈래 두 개', () => {
    const result = pickDownloads(
      [asset('BAGJ_KPatch_v0.4_CIA.zip'), asset('BAGJ_KPatch_v0.4_LayeredFS.zip')],
      'BAGJ',
    );
    expect(result.main).toBeNull();
    expect(result.variants.map((file) => file.variant)).toStrictEqual(['CIA', 'LayeredFS']);
  });

  // biome-ignore lint/security/noSecrets: 한글 문장·파일 이름을 비밀값으로 잘못 본다
  it('다른 게임 코드·규칙에 안 맞는 이름은 무시한다', () => {
    const result = pickDownloads(
      [asset('GEDJ_KPatch_v0.1.zip'), asset('EternalDarkness-KO-v0.1.zip')],
      'GSAJ',
    );
    expect(result.main).toBeNull();
  });
});
