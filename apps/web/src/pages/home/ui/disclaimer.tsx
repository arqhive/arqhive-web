import { useId } from 'react';

/**
 * 면책 조항(홈 아래쪽). 팬 번역 사이트로서 지키는 원칙과 책임 범위를 밝힌다.
 * 푸터의 한 줄 고지는 모든 페이지에 짧게, 여기는 자세히 둔다.
 * 문구는 JSX 안에 직접 쓴다(문자열 상수로 빼면 Biome noSecrets가 한글 문장을 비밀값으로 잘못 본다).
 */
export function Disclaimer() {
  // 제목과 영역을 잇는 id. 같은 컴포넌트가 여러 번 쓰여도 겹치지 않게 useId로 만든다.
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="space-y-3 border-line border-t pt-6">
      <h2 id={titleId} className="font-bold text-ink text-sm">
        면책 조항
      </h2>
      <ul className="max-w-prose list-disc space-y-1.5 break-keep pl-5 text-ink-sub text-xs leading-relaxed">
        <li>
          이곳의 한글 패치는 개인이 만든 비공식 팬 번역입니다. 닌텐도를 비롯한 게임
          제작사·유통사와는 관계가 없으며, 그들의 승인이나 보증을 받지 않았습니다.
        </li>
        <li>
          게임의 롬·디스크 이미지는 배포하지 않습니다. 패치는 직접 가지고 있는 정품에서 추출한
          원본에만 적용해 주세요.
        </li>
        <li>
          게임 이름, 상표, 캐릭터, 원본 데이터의 권리는 각 권리자에게 있습니다. 패치에는 번역문과
          이를 적용하는 데 필요한 차이 정보만 들어 있습니다.
        </li>
        <li>
          패치는 무료이며 상업적으로 쓸 수 없습니다. 적용과 사용으로 생기는 문제(저장 데이터 손상,
          기기 이상 등)는 이용자의 책임이니, 적용 전에 원본과 저장 데이터를 꼭 백업해 주세요.
        </li>
        <li>권리자가 요청하면 해당 패치와 자료를 확인 후 바로 내리겠습니다.</li>
      </ul>
    </section>
  );
}
