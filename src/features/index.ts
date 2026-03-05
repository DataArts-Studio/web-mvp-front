// dashboard
export { getDashboardStats, getDashboardMilestones, getStorageInfo, dashboardQueryKeys, dashboardQueryOptions } from '@/features/dashboard';
export type { DashboardMilestoneSuite, DashboardMilestone, StorageInfo, ProjectInfo, TestCaseStats, TestSuiteSummary, RecentActivity, DashboardStats } from '@/features/dashboard';

// projects-create
export { createProject, getProjects, checkProjectNameDuplicate, hashIdentifier, ProjectCreateForm } from '@/features/projects-create';
export { createProjectMock, getProjectsMock, checkProjectNameDuplicateMock, resetMockDatabase, getMockDatabase } from '@/features/projects-create';
export type { ActionResult } from '@/shared/types';

// project-search
export type { SearchKeyword, ProjectSearchResult, SearchProjectsResponse, SearchModalStatus, SearchModalState } from '@/features/project-search';
export { ProjectSearchButton, ProjectSearchModal, ProjectSearchForm, ProjectSearchResultList, ProjectSearchResultItem, ProjectSearchAutocomplete } from '@/features/project-search';

// suites-create
export { SuiteCreateForm, useCreateSuite } from '@/features/suites-create';

// suites-edit
export { SuiteEditForm, AddCasesToSuiteModal, useUpdateSuite, UpdateTestSuiteSchema } from '@/features/suites-edit';
export type { UpdateTestSuite } from '@/features/suites-edit';

// milestones
export { getMilestoneById, milestoneByIdQueryOptions } from '@/features/milestones';

// milestones-create
export { milestoneQueryKeys, milestonesQueryOptions, createMilestoneAction, useCreateMilestone, MilestoneCreateForm } from '@/features/milestones-create';

// milestones-edit
export { MilestoneEditForm, AddCasesToMilestoneModal, AddSuitesToMilestoneModal, useUpdateMilestone, UpdateMilestoneSchema } from '@/features/milestones-edit';
export type { UpdateMilestone } from '@/features/milestones-edit';

// cases-list
export { testCaseQueryKeys, testCasesQueryOptions, testCaseByIdQueryOptions } from '@/features/cases-list';

// runs
export type { FetchedTestRun, TestCaseRunDetail, SourceInfo, TestRunDetail, UpdateTestCaseRunInput, UpdateTestCaseRunResult } from '@/entities/test-run';
export { getTestRunsByProjectId, getTestRunById, updateTestCaseRunStatus, testRunsQueryOptions, testRunByIdQueryOptions } from '@/features/runs';

// onboarding-tour
export { getOnboardingStatus, completeOnboardingTour, onboardingQueryKeys, onboardingQueryOptions, useOnboardingTour } from '@/features/onboarding-tour';

// beta-notice
export { BetaNoticePopup, useBetaNotice } from '@/features/beta-notice';
