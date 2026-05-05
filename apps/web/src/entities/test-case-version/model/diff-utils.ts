import type { ChangeType, FieldDiff, TestCaseVersion } from './types';

type SnapshotData = {
  name: string;
  test_type?: string | null;
  tags?: string[] | null;
  pre_condition?: string | null;
  steps?: string | null;
  expected_result?: string | null;
};

const FIELD_LABELS: Record<string, string> = {
  name: '이름',
  test_type: '테스트 유형',
  tags: '태그',
  pre_condition: '전제 조건',
  steps: '테스트 단계',
  expected_result: '예상 결과',
};

const COMPARABLE_FIELDS = ['name', 'test_type', 'tags', 'pre_condition', 'steps', 'expected_result'] as const;

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return JSON.stringify(value.sort());
  return String(value);
}

export function detectChangedFields(
  oldData: SnapshotData,
  newData: SnapshotData
): string[] {
  const changed: string[] = [];
  for (const field of COMPARABLE_FIELDS) {
    const oldVal = normalizeValue(oldData[field]);
    const newVal = normalizeValue(newData[field]);
    if (oldVal !== newVal) {
      changed.push(field);
    }
  }
  return changed;
}

export function generateChangeSummary(
  changedFields: string[],
  changeType: ChangeType
): string {
  if (changeType === 'create') return '테스트 케이스 생성';
  if (changeType === 'rollback') return '이전 버전으로 복원';

  if (changedFields.length === 0) return '변경 사항 없음';

  const labels = changedFields
    .map((f) => FIELD_LABELS[f] || f)
    .slice(0, 3);

  const suffix = changedFields.length > 3 ? ` 외 ${changedFields.length - 3}개` : '';
  return `${labels.join(', ')}${suffix} 수정`;
}

export function computeFieldDiffs(
  oldVersion: TestCaseVersion,
  newVersion: TestCaseVersion
): FieldDiff[] {
  const fieldMap: { key: keyof TestCaseVersion; field: string }[] = [
    { key: 'name', field: 'name' },
    { key: 'testType', field: 'test_type' },
    { key: 'tags', field: 'tags' },
    { key: 'preCondition', field: 'pre_condition' },
    { key: 'steps', field: 'steps' },
    { key: 'expectedResult', field: 'expected_result' },
  ];

  return fieldMap.map(({ key, field }) => {
    const oldVal = normalizeValue(oldVersion[key]);
    const newVal = normalizeValue(newVersion[key]);

    let type: FieldDiff['type'] = 'unchanged';
    if (oldVal === '' && newVal !== '') type = 'added';
    else if (oldVal !== '' && newVal === '') type = 'removed';
    else if (oldVal !== newVal) type = 'modified';

    return {
      field,
      fieldLabel: FIELD_LABELS[field] || field,
      oldValue: field === 'tags'
        ? (Array.isArray(oldVersion[key]) ? (oldVersion[key] as string[]).join(', ') : oldVal)
        : oldVal,
      newValue: field === 'tags'
        ? (Array.isArray(newVersion[key]) ? (newVersion[key] as string[]).join(', ') : newVal)
        : newVal,
      type,
    };
  });
}
