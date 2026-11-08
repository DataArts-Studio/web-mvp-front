import { describe, expect, it } from 'vitest';

import { extractJson, salvageArrayObjects } from './llm-json';

describe('LLM 응답 JSON 추출', () => {
  it('코드 펜스로 감싼 JSON 을 꺼낸다.', () => {
    const raw = '```json\n{"cases":[{"name":"로그인"}]}\n```';

    const result = extractJson(raw);

    expect(result).toEqual({ cases: [{ name: '로그인' }] });
  });

  it('앞뒤 설명문에 괄호가 있어도 첫 JSON 값만 꺼낸다.', () => {
    const raw = '결과입니다 (총 1건):\n[{"name":"a]b"}]\n참고 [끝]';

    const result = extractJson(raw);

    expect(result).toEqual([{ name: 'a]b' }]);
  });

  it('문자열 안의 이스케이프된 따옴표와 괄호를 짝으로 세지 않는다.', () => {
    const raw = '설명 {"name":"\\"}\\" 버튼","steps":"1. {"}';

    const result = extractJson(raw);

    expect(result).toEqual({ name: '"}" 버튼', steps: '1. {' });
  });

  it('JSON 이 없으면 예외를 던진다.', () => {
    const raw = '죄송합니다. 생성할 수 없습니다.';

    const act = () => extractJson(raw);

    expect(act).toThrow(SyntaxError);
  });

  it('끝이 잘린 JSON 은 예외를 던진다.', () => {
    const raw = '{"cases":[{"name":"a"},{"name":"b';

    const act = () => extractJson(raw);

    expect(act).toThrow(SyntaxError);
  });
});

describe('잘린 응답에서 완결된 항목 건지기', () => {
  it('마지막 미완성 객체를 빼고 앞의 완결된 객체만 돌려준다.', () => {
    const raw = '{"cases":[{"name":"a","tags":["x"]},{"name":"b"},{"name":"c","steps":"1. 입';

    const result = salvageArrayObjects(raw);

    expect(result).toEqual([{ name: 'a', tags: ['x'] }, { name: 'b' }]);
  });

  it('닫는 코드 펜스 없이 잘린 응답도 건진다.', () => {
    const raw = '```json\n[{"name":"a"},{"na';

    const result = salvageArrayObjects(raw);

    expect(result).toEqual([{ name: 'a' }]);
  });

  it('배열이 끝난 뒤의 객체는 항목으로 치지 않는다.', () => {
    const raw = '{"cases":[{"name":"a"}],"meta":{"name":"x"}';

    const result = salvageArrayObjects(raw);

    expect(result).toEqual([{ name: 'a' }]);
  });

  it('배열이 없으면 빈 목록을 돌려준다.', () => {
    const raw = '{"name":"a"';

    const result = salvageArrayObjects(raw);

    expect(result).toEqual([]);
  });
});
