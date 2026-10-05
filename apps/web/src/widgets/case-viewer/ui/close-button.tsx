/**
 * 케이스 오른쪽 위에 붙는 동그란 X 닫기 단추. 케이스(caseRef) 안에 있어 케이스와 함께 움직인다.
 * - 여는 연출(이동·표지 넘김·매체 움직임)이 모두 끝난 뒤에야 나타난다(isVisible). 닫기를 누르면 바로 숨는다.
 *   그래서 단추는 언제나 "펼친 뒤" 자리에만 있으면 된다.
 * - 데스크톱: 케이스가 오른쪽으로 펼쳐지므로(속지는 왼쪽) 케이스 오른쪽 위 = 펼친 전체의 오른쪽 위.
 * - 휴대폰: 속지가 케이스 위로 펼쳐지므로 케이스 높이 하나만큼 더 올라간 자리(펼친 전체의 오른쪽 위)에 둔다.
 *   위쪽 여백이 좁아(펼친 높이 88dvh) 휴대폰에서는 단추를 조금 작게, 간격도 좁게 둔다.
 */
export function CloseButton({
  isVisible,
  onClick,
}: {
  readonly isVisible: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="닫기"
      title="닫기"
      className={`absolute right-0 bottom-[calc(200%+0.25rem)] z-20 flex size-8 items-center justify-center rounded-full border border-line bg-paper text-ink shadow-md transition-[opacity,background-color] duration-200 hover:bg-card focus-visible:outline-2 focus-visible:outline-stamp focus-visible:outline-offset-2 motion-reduce:transition-none md:bottom-[calc(100%+0.5rem)] md:size-9 ${
        isVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 16 16"
        className="size-1/2 fill-none stroke-current stroke-2 [stroke-linecap:round]"
      >
        <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
      </svg>
    </button>
  );
}
