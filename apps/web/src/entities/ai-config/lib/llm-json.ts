/**
 * LLM 응답 텍스트에서 JSON 을 꺼낸다.
 *
 * 모델은 JSON 만 내라고 해도 코드 펜스(```json)로 감싸거나 앞뒤에 설명을 붙이곤 한다.
 * 정규식으로 "첫 [ 부터 마지막 ] 까지" 를 잡으면 설명문 속 괄호까지 삼켜 파싱이 깨지므로,
 * 문자열·이스케이프를 따라가며 괄호 짝이 맞는 첫 JSON 값만 잘라 낸다.
 */

const stripFence = (raw: string): string => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced ? fenced[1] : raw).trim();
};

/**
 * start 위치의 `{` 또는 `[` 와 짝이 맞는 닫는 괄호 다음 위치를 돌려준다. 끝까지 짝이 안 맞으면 -1.
 */
const findBalancedEnd = (text: string, start: number): number => {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
};

/** 응답에서 첫 JSON 값(객체 또는 배열)을 파싱한다. 찾지 못하거나 깨졌으면 예외. */
export const extractJson = (raw: string): unknown => {
  const text = stripFence(raw);
  try {
    return JSON.parse(text);
  } catch {
    // 앞뒤 설명문이 붙은 경우로 보고 아래에서 잘라 낸다.
  }
  const start = text.search(/[[{]/);
  if (start === -1) throw new SyntaxError('LLM 응답에 JSON 이 없습니다.');
  const end = findBalancedEnd(text, start);
  if (end === -1) throw new SyntaxError('LLM 응답의 JSON 이 끝나지 않았습니다.');
  return JSON.parse(text.slice(start, end));
};

/**
 * 출력 한도에 걸려 끝이 잘린 응답에서, 첫 배열 안의 "완결된" 객체만 건진다.
 * 예: `{"cases":[{...},{...},{"name":"세 번째` 이면 앞의 두 객체를 돌려준다.
 */
export const salvageArrayObjects = (raw: string): unknown[] => {
  const text = stripFence(raw);
  const arrayStart = text.indexOf('[');
  if (arrayStart === -1) return [];

  const items: unknown[] = [];
  let i = arrayStart + 1;
  while (i < text.length) {
    const next = text.indexOf('{', i);
    if (next === -1) break;
    // 객체 사이에 `]` 가 먼저 나오면 배열이 끝난 것이다.
    const close = text.indexOf(']', i);
    if (close !== -1 && close < next) break;
    const end = findBalancedEnd(text, next);
    if (end === -1) break;
    try {
      items.push(JSON.parse(text.slice(next, end)));
    } catch {
      break;
    }
    i = end;
  }
  return items;
};
