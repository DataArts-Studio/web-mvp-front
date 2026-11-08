import { describe, expect, it } from 'vitest';

import { parseGeneratedCases } from './normalize-cases';

describe('LLM 응답을 테스트 케이스로 변환', () => {
  it('cases 객체 형식의 응답을 케이스 목록으로 바꾼다.', () => {
    const raw = JSON.stringify({
      cases: [
        {
          name: '올바른 비밀번호로 접근',
          preCondition: '프로젝트가 있다',
          steps: '1. 비밀번호 입력\n2. 확인 클릭',
          expectedResult: '대시보드로 이동한다',
          tags: ['인증'],
          category: 'positive',
        },
      ],
    });

    const result = parseGeneratedCases(raw);

    expect(result).toEqual({
      cases: [
        {
          name: '올바른 비밀번호로 접근',
          preCondition: '프로젝트가 있다',
          steps: '1. 비밀번호 입력\n2. 확인 클릭',
          expectedResult: '대시보드로 이동한다',
          tags: ['인증'],
          category: 'positive',
        },
      ],
      dropped: 0,
      salvaged: false,
    });
  });

  it('예전 형식인 맨 배열 응답도 받는다.', () => {
    const raw = '[{"name":"a","category":"negative"}]';

    const result = parseGeneratedCases(raw);

    expect(result.cases).toEqual([
      {
        name: 'a',
        preCondition: '',
        steps: '',
        expectedResult: '',
        tags: [],
        category: 'negative',
      },
    ]);
  });

  it('이름이 없는 항목만 버리고 나머지는 쓴다.', () => {
    const raw = '{"cases":[{"name":"a"},{"steps":"1. x"},{"name":"  "},"문자열"]}';

    const result = parseGeneratedCases(raw);

    expect(result.cases.map((c) => c.name)).toEqual(['a']);
    expect(result.dropped).toBe(3);
  });

  it.each([
    ['Negative', 'negative'],
    ['edge-case', 'edge_case'],
    ['Edge Case', 'edge_case'],
    ['boundary', 'edge_case'],
    ['비정상 케이스', 'negative'],
    ['엣지케이스', 'edge_case'],
    ['알 수 없음', 'positive'],
  ])('분류 표기 %s 를 %s 로 맞춘다.', (input, expected) => {
    const raw = JSON.stringify({ cases: [{ name: 'a', category: input }] });

    const result = parseGeneratedCases(raw);

    expect(result.cases[0].category).toBe(expected);
  });

  it('배열로 온 스텝에 번호를 붙여 한 문자열로 잇는다.', () => {
    const raw = JSON.stringify({ cases: [{ name: 'a', steps: ['로그인', '2. 저장 클릭', ' '] }] });

    const result = parseGeneratedCases(raw);

    expect(result.cases[0].steps).toBe('1. 로그인\n2. 저장 클릭');
  });

  it('태그가 5개를 넘으면 앞 5개만 남기고 중복과 # 을 정리한다.', () => {
    const raw = JSON.stringify({
      cases: [{ name: 'a', tags: ['#ui', 'ui', 'b', 'c', 'd', 'e', 'f'] }],
    });

    const result = parseGeneratedCases(raw);

    expect(result.cases[0].tags).toEqual(['ui', 'b', 'c', 'd', 'e']);
  });

  it('쉼표로 이은 문자열 태그를 나눈다.', () => {
    const raw = JSON.stringify({ cases: [{ name: 'a', tags: '로그인, 보안' }] });

    const result = parseGeneratedCases(raw);

    expect(result.cases[0].tags).toEqual(['로그인', '보안']);
  });

  it('이름이 200자를 넘으면 버리지 않고 200자로 자른다.', () => {
    const raw = JSON.stringify({ cases: [{ name: '가'.repeat(201) }] });

    const result = parseGeneratedCases(raw);

    expect(result.cases[0].name).toHaveLength(200);
  });

  it('title·expected·type 같은 다른 필드명도 받는다.', () => {
    const raw = JSON.stringify({
      cases: [{ title: 'a', precondition: 'p', expected: 'e', type: 'edge' }],
    });

    const result = parseGeneratedCases(raw);

    expect(result.cases[0]).toMatchObject({
      name: 'a',
      preCondition: 'p',
      expectedResult: 'e',
      category: 'edge_case',
    });
  });

  it('잘린 응답이면 완결된 항목만 건지고 건졌다고 표시한다.', () => {
    const raw = '{"cases":[{"name":"a"},{"name":"b"},{"name":"c","steps":"1. 입';

    const result = parseGeneratedCases(raw, true);

    expect(result.cases.map((c) => c.name)).toEqual(['a', 'b']);
    expect(result.salvaged).toBe(true);
  });

  it('잘렸다는 표시가 없으면 깨진 JSON 에서 건지지 않고 예외를 던진다.', () => {
    const raw = '{"cases":[{"name":"a"},{"name":"b';

    const act = () => parseGeneratedCases(raw);

    expect(act).toThrow(SyntaxError);
  });

  it('쓸 수 있는 항목이 하나도 없으면 예외를 던진다.', () => {
    const raw = '{"cases":[{"steps":"1. x"}]}';

    const act = () => parseGeneratedCases(raw);

    expect(act).toThrow('쓸 수 있는 테스트 케이스가 없습니다');
  });

  it('케이스 목록이 없는 객체면 예외를 던진다.', () => {
    const raw = '{"error":"요청을 처리할 수 없습니다"}';

    const act = () => parseGeneratedCases(raw);

    expect(act).toThrow('테스트 케이스 목록을 찾지 못했습니다');
  });
});
