/**
 * 배포 단계. 속지 "상태" 칸에 쓴다(10/6 사용자 규칙).
 * - in-progress: 아직 공개 배포 전(status가 released가 아님)
 * - test: 공개 배포했지만 버전이 v1.0 미만 = 공개 테스트 배포
 * - reviewed: 버전이 v1.0 이상 = 검수판 배포
 * 화면 문구는 ui가 JSX 안에 쓴다(문자열 상수로 두면 Biome noSecrets가 한글 문장을 비밀값으로 잘못 본다).
 */
type ReleaseStage = 'in-progress' | 'test' | 'reviewed';

/** v1.0부터 검수판 */
const REVIEWED_MAJOR = 1;

/** 버전 맨 앞의 숫자(주 버전). 앞의 v는 있어도 없어도 된다 */
const MAJOR_PATTERN = /^v?(\d+)/i;

/** "v1.2f", "v0.1.1", "1.0" 같은 버전에서 맨 앞 숫자(주 버전)만 읽는다. 읽을 수 없으면 0(테스트로 본다) */
function majorOf(version: string): number {
  const match = MAJOR_PATTERN.exec(version.trim());
  return match ? Number(match[1]) : 0;
}

function releaseStage(patch: {
  readonly status: string;
  readonly latestVersion: string;
}): ReleaseStage {
  if (patch.status !== 'released') {
    return 'in-progress';
  }
  return majorOf(patch.latestVersion) >= REVIEWED_MAJOR ? 'reviewed' : 'test';
}

export { type ReleaseStage, releaseStage };
