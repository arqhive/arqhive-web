/**
 * 디스코드 웹훅으로 메시지 보내기. 웹훅 주소 하나가 곧 "이 채널에 글을 쓸 권한"이라 비밀값으로 다룬다.
 * 로그인·토큰 갱신이 없어서, 주소만 있으면 바로 보낼 수 있다.
 *
 * - 본문(content)은 폰 푸시 알림에 그대로 뜨는 한 줄, 임베드(embeds)는 제목 링크·내용을 담은 카드다.
 * - allowed_mentions.parse를 빈 배열로 두어, 사용자가 쓴 글에 @everyone·@here·<@아이디>가 있어도 멘션이 되지 않게 한다.
 * - 디스코드는 너무 자주 보내면 429(잠시 뒤 다시)로 거절한다. 실패는 던져서 부르는 쪽이 쌓아 두고 다시 보내게 한다.
 */

/** 디스코드 제한: 본문 2000자, 임베드 제목 256자, 임베드 설명 4096자 */
const CONTENT_MAX = 2000;
const TITLE_MAX = 256;
const DESCRIPTION_MAX = 4096;

/** 보낼 메시지. 제목을 누르면 url로 간다 */
export interface DiscordMessage {
  /** 푸시 알림에 뜨는 한 줄 */
  readonly content: string;
  readonly title: string;
  readonly url: string;
  readonly description: string;
  /** 임베드 왼쪽 띠 색(0xRRGGBB) */
  readonly color: number;
}

export async function sendDiscord(webhookUrl: string, message: DiscordMessage): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content: message.content.slice(0, CONTENT_MAX),
      embeds: [
        {
          title: message.title.slice(0, TITLE_MAX),
          url: message.url,
          description: message.description.slice(0, DESCRIPTION_MAX),
          color: message.color,
        },
      ],
      // biome-ignore lint/style/useNamingConvention: 디스코드 API의 필드 이름
      allowed_mentions: { parse: [] },
    }),
  });
  if (!response.ok) {
    throw new Error(`디스코드 보내기 실패: ${response.status}`);
  }
}
