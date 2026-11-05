const ZWSP = '\u200B';

/**
 * 사용자 입력을 GitHub 이슈 제목·본문에 넣기 전 멘션·참조를 무력화한다.
 *
 * - `@user`, `@org/team` 멘션 알림 방지.
 * - `#123`, `owner/repo#123`, `GH-123` 자동 참조(다른 이슈·교차 레포 backlink) 방지.
 * - `github.com/...` 이슈·PR URL 의 타임라인 참조 방지.
 *
 * 각 트리거 문자 뒤에 zero-width space 를 넣는 방식이라 화면상 글자는 그대로 보인다.
 * `&#64;`·`&commat;` 같은 HTML 엔티티는 렌더링 뒤 `@`·`#` 이 되어 위 처리를 우회하므로,
 * 먼저 `&` 를 `&amp;` 로 바꿔 엔티티가 글자 그대로 보이게 한다.
 */
export function neutralizeGithubRefs(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/@(?=[A-Za-z0-9_-])/g, `@${ZWSP}`)
    .replace(/#(?=\d)/g, `#${ZWSP}`)
    .replace(/\b(GH)-(?=\d)/gi, `$1-${ZWSP}`)
    .replace(/github\.com\//gi, (m) => `${m.slice(0, 6)}${ZWSP}${m.slice(6)}`);
}
