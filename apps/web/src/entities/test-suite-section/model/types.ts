export type TestSuiteSection = {
  id: string;
  suiteId: string;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateSectionInput = {
  suiteId: string;
  name: string;
};

export type UpdateSectionInput = {
  id: string;
  name?: string;
  sortOrder?: number;
};

export type ReorderSectionsInput = {
  suiteId: string;
  sectionIds: string[];
};
