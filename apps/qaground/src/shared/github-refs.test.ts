import { describe, expect, it } from 'vitest';

import { neutralizeGithubRefs } from './github-refs';

const ZWSP = '\u200B';

describe('neutralizeGithubRefs', () => {
  it('@멘션 뒤에 zero-width space 를 넣는다', () => {
    expect(neutralizeGithubRefs('cc @octocat @org/team')).toBe(
      `cc @${ZWSP}octocat @${ZWSP}org/team`
    );
  });

  it('#번호·교차 레포·GH- 참조를 무력화한다', () => {
    expect(neutralizeGithubRefs('see #12, a/b#3, GH-4')).toBe(
      `see #${ZWSP}12, a/b#${ZWSP}3, GH-${ZWSP}4`
    );
  });

  it('github.com URL 을 무력화한다', () => {
    expect(neutralizeGithubRefs('https://github.com/a/b/issues/1')).toBe(
      `https://github${ZWSP}.com/a/b/issues/1`
    );
  });

  it('참조가 아닌 텍스트는 그대로 둔다', () => {
    const text = '버튼이 안 눌립니다. 색상 #fff, 이메일 기호 단독 @ 사용';
    expect(neutralizeGithubRefs(text)).toBe(text);
  });

  it('제로폭 문자를 빼면 원문과 같다', () => {
    const text = '@a #1 GH-2 github.com/x';
    expect(neutralizeGithubRefs(text).replaceAll(ZWSP, '')).toBe(text);
  });
});
