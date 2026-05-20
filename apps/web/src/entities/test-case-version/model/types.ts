export type ChangeType = 'create' | 'edit' | 'rollback';

export type TestCaseVersion = {
  id: string;
  testCaseId: string;
  versionNumber: number;
  name: string;
  testType: string;
  tags: string[];
  preCondition: string;
  steps: string;
  expectedResult: string;
  changeSummary: string;
  changeType: ChangeType;
  changedFields: string[];
  createdAt: Date;
};

export type TestCaseVersionSummary = {
  id: string;
  testCaseId: string;
  versionNumber: number;
  changeSummary: string;
  changeType: ChangeType;
  changedFields: string[];
  createdAt: Date;
};

export type FieldDiff = {
  field: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  type: 'unchanged' | 'modified' | 'added' | 'removed';
};

export type VersionCompareResult = {
  oldVersion: TestCaseVersion;
  newVersion: TestCaseVersion;
  diffs: FieldDiff[];
};
