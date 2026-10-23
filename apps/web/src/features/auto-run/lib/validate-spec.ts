/**
 * 생성된 spec 의 셀렉터가 캡처한 접근성 트리에 실제로 있는지 실행 전에 대조한다.
 *
 * 프롬프트로 "트리에 있는 role/name 만 쓴다"고 지시해도 모델이 단계 문구에서 셀렉터를
 * 추측하는 일이 있어(예: 트리에 없는 region "푸터 영역"), 그 규칙을 코드로 확인한다.
 *
 * 트리는 첫 화면 한 장이라 클릭 뒤에 나타나는 요소(다이얼로그 등)는 없다. 그래서 첫
 * 상호작용(click, fill 등)까지 등장한 셀렉터만 검사한다. 정규식 name, 템플릿 문자열처럼
 * 정적으로 판단할 수 없는 인자는 건너뛴다(오탐보다 미탐이 낫다).
 */

export interface SpecIssue {
  /** spec 에 쓰인 셀렉터 원문(요약). */
  selector: string;
  reason: string;
}

interface TreeNode {
  role: string;
  name: string | null;
}

/** 첫 상호작용으로 보는 호출. 이 호출 이후 셀렉터는 첫 화면 트리로 판단할 수 없다. */
const ACTION_PATTERN =
  /\.(click|dblclick|fill|type|press|pressSequentially|check|uncheck|selectOption|setInputFiles|hover|tap|dragTo)\(/;

const GET_BY_ROLE_PATTERN = /getByRole\(\s*(['"])([a-z]+)\1\s*(?:,\s*\{([^}]*)\})?\s*\)/g;
const GET_BY_TEXT_PATTERN =
  /getByText\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1\s*(?:,\s*\{([^}]*)\})?\s*\)/g;
const NAME_OPTION_PATTERN = /name\s*:\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/;
const EXACT_OPTION_PATTERN = /exact\s*:\s*true/;
const TREE_LINE_PATTERN = /^\s*-\s+([a-z]+)(?:\s+"((?:\\.|[^"\\])*)")?/;

function unescape(value: string): string {
  return value.replace(/\\(.)/g, '$1');
}

/** Playwright 기본 name 매칭처럼 공백을 정리하고 대소문자를 무시해 비교한다. */
function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function parseTree(snapshot: string): TreeNode[] {
  const nodes: TreeNode[] = [];
  for (const line of snapshot.split('\n')) {
    const match = line.match(TREE_LINE_PATTERN);
    if (!match) continue;
    nodes.push({ role: match[1], name: match[2] === undefined ? null : unescape(match[2]) });
  }
  return nodes;
}

function matchesName(nodeName: string | null, name: string, exact: boolean): boolean {
  if (nodeName === null) return false;
  return exact
    ? nodeName.replace(/\s+/g, ' ').trim() === name.replace(/\s+/g, ' ').trim()
    : normalize(nodeName).includes(normalize(name));
}

export function validateSpecAgainstSnapshot(spec: string, snapshot: string): SpecIssue[] {
  const actionIndex = spec.search(ACTION_PATTERN);
  const checkedPart = actionIndex === -1 ? spec : spec.slice(0, actionIndex);

  const tree = parseTree(snapshot);
  const treeText = normalize(unescape(snapshot));
  const issues: SpecIssue[] = [];

  for (const match of checkedPart.matchAll(GET_BY_ROLE_PATTERN)) {
    const [selector, , role, options = ''] = match;
    const sameRole = tree.filter((node) => node.role === role);
    if (sameRole.length === 0) {
      issues.push({ selector, reason: `페이지에 ${role} 요소가 없습니다.` });
      continue;
    }
    const nameMatch = options.match(NAME_OPTION_PATTERN);
    if (!nameMatch) continue;
    const name = unescape(nameMatch[2]);
    const exact = EXACT_OPTION_PATTERN.test(options);
    if (!sameRole.some((node) => matchesName(node.name, name, exact))) {
      issues.push({ selector, reason: `이름이 "${name}"인 ${role} 요소가 없습니다.` });
    }
  }

  for (const match of checkedPart.matchAll(GET_BY_TEXT_PATTERN)) {
    const [selector, , rawText] = match;
    const text = normalize(unescape(rawText));
    if (text && !treeText.includes(text)) {
      issues.push({ selector, reason: `"${unescape(rawText)}" 텍스트가 페이지에 없습니다.` });
    }
  }

  return issues;
}
