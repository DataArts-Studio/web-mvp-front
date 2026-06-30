import { describe, expect, it } from 'vitest';

import {
  type ApiAttemptForGrade,
  gradeApiAttempts,
  gradeApiCodeSubmission,
} from './api-hidden-grader';

const baseAttempt: ApiAttemptForGrade = {
  method: 'GET',
  path: '/status/200',
  status: 200,
  assertions: [{ kind: 'status', path: '', expected: '200' }],
  script: '',
  checks: [{ pass: true }],
  scriptResults: [],
};

describe('gradeApiAttempts', () => {
  it('부분 점수를 계산한다', () => {
    const result = gradeApiAttempts([baseAttempt]);

    expect(result.score).toBe(40);
    expect(result.maxScore).toBe(100);
    expect(result.passed).toBe(2);
  });

  it('성공/실패 경로와 본문 단언을 모두 커버하면 만점이다', () => {
    const result = gradeApiAttempts(
      [
        baseAttempt,
        {
          ...baseAttempt,
          method: 'GET',
          path: '/status/404',
          status: 404,
          assertions: [
            { kind: 'status', path: '', expected: '404' },
            { kind: 'json', path: 'message', expected: 'Not Found' },
          ],
        },
      ],
      {
        targets: [
          { method: 'GET', path: '/status/200' },
          { method: 'GET', path: '/status/404' },
        ],
      }
    );

    expect(result.score).toBe(100);
    expect(result.passed).toBe(result.total);
  });

  it('실패한 사용자 단언은 성공/실패 경로 채점에 반영하지 않는다', () => {
    const result = gradeApiAttempts([
      {
        ...baseAttempt,
        checks: [{ pass: false }],
      },
    ]);

    expect(result.score).toBe(0);
    expect(result.cases.find((item) => item.id === 'success-path')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'request-coverage')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'status-assertion')?.pass).toBe(false);
  });

  it('주석과 문자열 안의 pm.response 참조는 단언으로 세지 않는다', () => {
    const result = gradeApiAttempts([
      {
        ...baseAttempt,
        assertions: [],
        script: `
          // pm.expect(pm.response.json().total).to.eql(12);
          const note = "pm.response.code";
          console.log(response.status);
        `,
        scriptResults: [{ pass: true }],
      },
    ]);

    expect(result.cases.find((item) => item.id === 'status-assertion')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'body-assertion')?.pass).toBe(false);
  });

  it('본문 단언은 pm.response.json 값을 실제 expect 대상으로 묶은 경우만 인정한다', () => {
    const parseOnly = gradeApiAttempts([
      {
        ...baseAttempt,
        assertions: [],
        script: `
          const body = pm.response.json();
          pm.response.to.have.status(200);
        `,
        scriptResults: [{ pass: true }],
      },
    ]);
    const bodyAssert = gradeApiAttempts([
      {
        ...baseAttempt,
        assertions: [],
        script: `pm.expect(pm.response.json().total).to.eql(12);`,
        scriptResults: [{ pass: true }],
      },
    ]);

    expect(parseOnly.cases.find((item) => item.id === 'body-assertion')?.pass).toBe(false);
    expect(bodyAssert.cases.find((item) => item.id === 'body-assertion')?.pass).toBe(true);
  });

  it('쿼리 문자열이 다른 대상 엔드포인트를 서로 다른 coverage로 계산한다', () => {
    const result = gradeApiAttempts(
      [
        {
          ...baseAttempt,
          path: '/health',
          assertions: [{ kind: 'status', path: '', expected: '200' }],
        },
        {
          ...baseAttempt,
          path: '/health?mode=degraded',
          status: 503,
          assertions: [
            { kind: 'status', path: '', expected: '503' },
            { kind: 'json', path: 'status', expected: 'degraded' },
          ],
        },
      ],
      {
        targets: [
          { method: 'GET', path: '/health' },
          { method: 'GET', path: '/health?mode=degraded' },
        ],
      }
    );

    expect(result.cases.find((item) => item.id === 'request-coverage')?.pass).toBe(true);
  });

  it('템플릿 엔드포인트는 실제 경로 세그먼트와 매칭한다', () => {
    const result = gradeApiAttempts(
      [
        {
          ...baseAttempt,
          path: '/products/1',
        },
      ],
      { targets: [{ method: 'GET', path: '/products/:id' }] }
    );

    expect(result.cases.find((item) => item.id === 'request-coverage')?.pass).toBe(true);
  });

  it('대상 챌린지 엔드포인트 밖의 요청은 숨김 점수로 인정하지 않는다', () => {
    const result = gradeApiAttempts(
      [
        baseAttempt,
        {
          ...baseAttempt,
          path: '/status/404',
          status: 404,
        },
      ],
      { targets: [{ method: 'GET', path: '/admin/reports' }] }
    );

    expect(result.cases.find((item) => item.id === 'success-path')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'failure-path')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'request-coverage')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'status-assertion')?.pass).toBe(false);
  });
  it('pm.response.json을 변수에 담아 단언해도 본문 단언으로 인정한다', () => {
    const result = gradeApiAttempts([
      {
        ...baseAttempt,
        assertions: [],
        script: `
          const json = pm.response.json();
          pm.test('total 검증', () => {
            pm.expect(json.total).to.eql(12);
          });
        `,
        scriptResults: [{ pass: true }],
      },
    ]);

    expect(result.cases.find((item) => item.id === 'body-assertion')?.pass).toBe(true);
  });

  it('타겟에 404가 명시된 경우 실제 404 응답을 보내야 실패 경로를 인정한다', () => {
    const onlyBodyCheck = gradeApiAttempts(
      [
        {
          ...baseAttempt,
          method: 'GET',
          path: '/products/9999',
          status: 200,
          assertions: [{ kind: 'status', path: '', expected: '200' }],
        },
      ],
      { targets: [{ method: 'GET', path: '/products/:id', desc: '상품 단건 (없으면 404)' }] }
    );
    const realNotFound = gradeApiAttempts(
      [
        {
          ...baseAttempt,
          method: 'GET',
          path: '/products/9999',
          status: 404,
          assertions: [{ kind: 'status', path: '', expected: '404' }],
        },
      ],
      { targets: [{ method: 'GET', path: '/products/:id', desc: '상품 단건 (없으면 404)' }] }
    );

    expect(onlyBodyCheck.cases.find((item) => item.id === 'failure-path')?.pass).toBe(false);
    expect(realNotFound.cases.find((item) => item.id === 'failure-path')?.pass).toBe(true);
  });
  it('실제 Postman 스타일 alias와 배열 길이 단언을 본문 단언으로 인정한다', () => {
    const result = gradeApiAttempts([
      {
        ...baseAttempt,
        assertions: [],
        script: `
          const json = pm.response.json();

          pm.test('상품 목록 메타데이터를 반환한다', () => {
            pm.expect(json.page).to.eql(1);
            pm.expect(json.data.length).to.eql(5);
          });
        `,
        scriptResults: [{ pass: true }],
      },
    ]);

    expect(result.cases.find((item) => item.id === 'body-assertion')?.pass).toBe(true);
  });

  it('상품 REST API 정답 스크립트 흐름은 만점으로 계산한다', () => {
    const attempts: ApiAttemptForGrade[] = [
      {
        ...baseAttempt,
        method: 'GET',
        path: '/products?page=1&limit=5',
        status: 200,
        assertions: [],
        script: `
          const json = pm.response.json();
          pm.test('상태 코드는 200', () => {
            pm.response.to.have.status(200);
          });
          pm.test('상품 목록과 페이지 메타데이터를 반환한다', () => {
            pm.expect(json.page).to.eql(1);
            pm.expect(json.limit).to.eql(5);
            pm.expect(json.total).to.eql(12);
            pm.expect(json.data.length).to.eql(5);
          });
        `,
        checks: [],
        scriptResults: [{ pass: true }, { pass: true }],
      },
      {
        ...baseAttempt,
        method: 'GET',
        path: '/products/1',
        status: 200,
        assertions: [],
        script: `
          const json = pm.response.json();
          pm.test('상품 상세를 반환한다', () => {
            pm.response.to.have.status(200);
            pm.expect(json.id).to.eql(1);
            pm.expect(json.name).to.eql('무선 키보드');
          });
        `,
        checks: [],
        scriptResults: [{ pass: true }],
      },
      {
        ...baseAttempt,
        method: 'GET',
        path: '/products/9999',
        status: 404,
        assertions: [],
        script: `
          const json = pm.response.json();
          pm.test('없는 상품은 404를 반환한다', () => {
            pm.response.to.have.status(404);
            pm.expect(json.error).to.eql('상품을 찾을 수 없습니다.');
          });
        `,
        checks: [],
        scriptResults: [{ pass: true }],
      },
      {
        ...baseAttempt,
        method: 'POST',
        path: '/auth/login',
        status: 200,
        assertions: [],
        script: `
          const json = pm.response.json();
          pm.test('로그인 토큰을 반환한다', () => {
            pm.response.to.have.status(200);
            pm.expect(json.token).to.eql('qaground-demo-token');
          });
        `,
        checks: [],
        scriptResults: [{ pass: true }],
      },
      {
        ...baseAttempt,
        method: 'POST',
        path: '/products',
        status: 201,
        assertions: [],
        script: `
          const json = pm.response.json();
          pm.test('상품 생성은 201을 반환한다', () => {
            pm.response.to.have.status(201);
            pm.expect(json.name).to.eql('테스트 상품');
            pm.expect(json.price).to.eql(12000);
          });
        `,
        checks: [],
        scriptResults: [{ pass: true }],
      },
      {
        ...baseAttempt,
        method: 'DELETE',
        path: '/products/1',
        status: 204,
        assertions: [],
        script: `
          pm.test('상품 삭제는 204를 반환한다', () => {
            pm.response.to.have.status(204);
          });
        `,
        checks: [],
        scriptResults: [{ pass: true }],
      },
    ];

    const result = gradeApiAttempts(attempts, {
      targets: [
        { method: 'GET', path: '/products?page=1&limit=5', desc: '상품 목록' },
        { method: 'GET', path: '/products/:id', desc: '상품 단건 (없으면 404)' },
        { method: 'POST', path: '/auth/login', desc: '로그인 → 토큰 (무효 시 401)' },
        { method: 'POST', path: '/products', auth: true, desc: '상품 생성 (검증 400 / 성공 201)' },
        { method: 'DELETE', path: '/products/:id', auth: true, desc: '상품 삭제 (204 / 404)' },
      ],
    });

    expect(result.score).toBe(result.maxScore);
    expect(result.passed).toBe(result.total);
  });
  it('API v2 Postman 스크립트 풀이가 요구사항 커버리지를 만족하면 만점으로 계산한다', () => {
    const code = `pm.sendRequest({ url: '/products?page=1&limit=5', method: 'GET' }, (err, res) => {
  pm.test('상품 목록과 페이지 메타데이터를 반환한다', () => {
    pm.expect(err).to.eql(null);
    pm.expect(res.code).to.eql(200);
    const json = res.json();
    pm.expect(json.page).to.eql(1);
    pm.expect(json.data.length).to.eql(5);
  });
});

pm.sendRequest({ url: '/products/1', method: 'GET' }, (err, res) => {
  pm.test('상품 상세를 반환한다', () => {
    pm.expect(res.code).to.eql(200);
    const json = res.json();
    pm.expect(json.id).to.eql(1);
  });
});

pm.sendRequest({ url: '/products/9999', method: 'GET' }, (err, res) => {
  pm.test('없는 상품은 404를 반환한다', () => {
    pm.expect(res.code).to.eql(404);
    const json = res.json();
    pm.expect(json.error).to.eql('상품을 찾을 수 없습니다.');
  });
});

pm.sendRequest({ url: '/auth/login', method: 'POST' }, (err, res) => {
  pm.test('로그인 토큰을 반환한다', () => {
    pm.expect(res.code).to.eql(200);
    const json = res.json();
    pm.expect(json.token).to.eql('qaground-demo-token');
  });
});

pm.sendRequest({
  url: '/products',
  method: 'POST',
  headers: { Authorization: 'Bearer qaground-demo-token' },
  body: JSON.stringify({ name: '테스트 상품', price: 12000 })
}, (err, res) => {
  pm.test('상품 생성은 201을 반환한다', () => {
    pm.expect(res.code).to.eql(201);
    const json = res.json();
    pm.expect(json.name).to.eql('테스트 상품');
  });
});

pm.sendRequest({
  url: '/products/1',
  method: 'DELETE',
  headers: { Authorization: 'Bearer qaground-demo-token' }
}, (err, res) => {
  pm.test('상품 삭제는 204를 반환한다', () => {
    pm.expect(res.code).to.eql(204);
  });
});`;

    const result = gradeApiCodeSubmission(code, {
      targets: [
        { method: 'GET', path: '/products?page=1&limit=5', desc: '상품 목록' },
        { method: 'GET', path: '/products/:id', desc: '상품 단건 (없으면 404)' },
        { method: 'POST', path: '/auth/login', desc: '로그인 → 토큰 (무효 시 401)' },
        { method: 'POST', path: '/products', auth: true, desc: '상품 생성 (검증 400 / 성공 201)' },
        { method: 'DELETE', path: '/products/:id', auth: true, desc: '상품 삭제 (204 / 404)' },
      ],
    });

    expect(result.score).toBe(result.maxScore);
    expect(result.passed).toBe(result.total);
  });
  it('주석에만 있는 API 테스트 코드는 채점에 반영하지 않는다', () => {
    const code = `// pm.sendRequest({ url: '/products/1', method: 'GET' }, (err, res) => {
//   pm.test('fake', () => {
//     pm.expect(res.code).to.eql(200);
//     pm.expect(res.json().id).to.eql(1);
//   });
// });`;

    const result = gradeApiCodeSubmission(code, {
      targets: [{ method: 'GET', path: '/products/:id' }],
    });

    expect(result.cases.find((item) => item.id === 'failure-path')?.pass).toBe(true);
    expect(result.cases.find((item) => item.id === 'success-path')?.pass).toBe(false);
    expect(result.cases.find((item) => item.id === 'request-coverage')?.pass).toBe(false);
  });

  it('method와 path가 서로 다른 sendRequest에 흩어져 있으면 커버리지로 인정하지 않는다', () => {
    const code = `pm.sendRequest({ url: '/products/1', method: 'POST' }, (err, res) => {
  pm.test('status', () => pm.expect(res.code).to.eql(201));
});
pm.sendRequest({ url: '/orders/1', method: 'GET' }, (err, res) => {
  pm.test('status', () => pm.expect(res.code).to.eql(200));
});`;

    const result = gradeApiCodeSubmission(code, {
      targets: [{ method: 'GET', path: '/products/:id' }],
    });

    expect(result.cases.find((item) => item.id === 'request-coverage')?.pass).toBe(false);
  });

  it('보호 API는 헤더와 본문을 포함해야 요청 커버리지로 인정한다', () => {
    const missingAuthAndBody = `pm.sendRequest({ url: '/products', method: 'POST' }, (err, res) => {
  pm.test('created', () => pm.expect(res.code).to.eql(201));
});`;
    const withAuthAndBody = `pm.sendRequest({
  url: '/products',
  method: 'POST',
  headers: { Authorization: 'Bearer qaground-demo-token' },
  body: JSON.stringify({ name: '테스트 상품', price: 12000 })
}, (err, res) => {
  pm.test('created', () => {
    pm.expect(res.code).to.eql(201);
    pm.expect(res.json().name).to.eql('테스트 상품');
  });
});`;

    const target = {
      method: 'POST',
      path: '/products',
      auth: true,
      desc: '상품 생성 (검증 400 / 성공 201)',
    };

    expect(
      gradeApiCodeSubmission(missingAuthAndBody, { targets: [target] }).cases.find(
        (item) => item.id === 'request-coverage'
      )?.pass
    ).toBe(false);
    expect(
      gradeApiCodeSubmission(withAuthAndBody, { targets: [target] }).cases.find(
        (item) => item.id === 'request-coverage'
      )?.pass
    ).toBe(true);
  });

  it('실패 상태가 없는 챌린지는 failure-path 없이도 만점 가능하다', () => {
    const code = `pm.sendRequest({ url: '/health', method: 'GET' }, (err, res) => {
  pm.test('health', () => {
    pm.response.to.have.status(200);
    pm.expect(res.json().status).to.eql('ok');
  });
});`;

    const result = gradeApiCodeSubmission(code, {
      targets: [{ method: 'GET', path: '/health', desc: '헬스 체크' }],
    });

    expect(result.cases.find((item) => item.id === 'failure-path')?.pass).toBe(true);
    expect(result.score).toBe(result.maxScore);
  });
});
