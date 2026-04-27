// src/shared/lib/db/schema/relations.ts
import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { testSuites } from './test-suites';
import { testCases } from './test-cases';
import { testRuns } from './test-runs';
import { milestones } from './milestones';
import { testCaseRuns } from './test-case-runs';
import { testRunSuites } from './test-run-suites';
import { suiteTestCases } from './suite-test-cases';
import { milestoneTestCases } from './milestone-test-cases';
import { milestoneTestSuites } from './milestone-test-suites';
import { projectPreferences } from './project-preferences';
import { testCaseVersions } from './test-case-versions';
import { testSuiteSections } from './test-suite-sections';
import { checklists } from './checklists';
import { checklistItems } from './checklist-items';
import { githubConnections } from './github-connections';
import { testCaseExternalLinks } from './test-case-external-links';
import { projectAiConfigs } from './project-ai-configs';
import { aiUsageLogs } from './ai-usage-logs';

// Project Relations
export const projectRelations = relations(projects, ({ many }) => ({
	testSuites: many(testSuites),
	testCases: many(testCases),
	testRuns: many(testRuns),
	milestones: many(milestones),
	preferences: many(projectPreferences),
	checklists: many(checklists),
	githubConnection: many(githubConnections),
	aiConfig: many(projectAiConfigs),
	aiUsageLogs: many(aiUsageLogs),
}));

// Project Preferences Relations
export const projectPreferencesRelations = relations(projectPreferences, ({ one }) => ({
	project: one(projects, {
		fields: [projectPreferences.project_id],
		references: [projects.id],
	}),
}));

// Test Suite Relations
export const testSuiteRelations = relations(testSuites, ({ one, many }) => ({
	project: one(projects, {
		fields: [testSuites.project_id],
		references: [projects.id],
	}),
	testCases: many(testCases),
	sections: many(testSuiteSections),
	testRunSuites: many(testRunSuites),
	suiteTestCases: many(suiteTestCases),
	milestoneTestSuites: many(milestoneTestSuites),
}));

// Test Suite Section Relations
export const testSuiteSectionRelations = relations(testSuiteSections, ({ one, many }) => ({
	suite: one(testSuites, {
		fields: [testSuiteSections.suite_id],
		references: [testSuites.id],
	}),
	testCases: many(testCases),
}));

// Test Case Relations
export const testCaseRelations = relations(testCases, ({ one, many }) => ({
	project: one(projects, {
		fields: [testCases.project_id],
		references: [projects.id],
	}),
	suite: one(testSuites, {
		fields: [testCases.test_suite_id],
		references: [testSuites.id],
	}),
	section: one(testSuiteSections, {
		fields: [testCases.section_id],
		references: [testSuiteSections.id],
	}),
	testCaseRuns: many(testCaseRuns),
	suiteTestCases: many(suiteTestCases),
	milestoneTestCases: many(milestoneTestCases),
	versions: many(testCaseVersions),
	externalLinks: many(testCaseExternalLinks),
}));

// Test Case Version Relations
export const testCaseVersionRelations = relations(testCaseVersions, ({ one }) => ({
	testCase: one(testCases, {
		fields: [testCaseVersions.test_case_id],
		references: [testCases.id],
	}),
}));

// Test Run Relations
export const testRunRelations = relations(testRuns, ({ one, many }) => ({
	project: one(projects, {
		fields: [testRuns.project_id],
		references: [projects.id],
	}),
	milestone: one(milestones, {
		fields: [testRuns.milestone_id],
		references: [milestones.id],
	}),
	testCaseRuns: many(testCaseRuns),
	testRunSuites: many(testRunSuites),
}));

// Milestone Relations
export const milestoneRelations = relations(milestones, ({ one, many }) => ({
	project: one(projects, {
		fields: [milestones.project_id],
		references: [projects.id],
	}),
	testRuns: many(testRuns),
	milestoneTestCases: many(milestoneTestCases),
	milestoneTestSuites: many(milestoneTestSuites),
}));

// Test Case Run Relations (Join Table)
export const testCaseRunRelations = relations(testCaseRuns, ({ one }) => ({
	testRun: one(testRuns, {
		fields: [testCaseRuns.test_run_id],
		references: [testRuns.id],
	}),
	testCase: one(testCases, {
		fields: [testCaseRuns.test_case_id],
		references: [testCases.id],
	}),
}));

// Test Run Suites Relations (Join Table)
export const testRunSuitesRelations = relations(testRunSuites, ({ one }) => ({
	testRun: one(testRuns, {
		fields: [testRunSuites.test_run_id],
		references: [testRuns.id],
	}),
	testSuite: one(testSuites, {
		fields: [testRunSuites.test_suite_id],
		references: [testSuites.id],
	}),
}));

// Suite Test Cases Relations (Join Table)
export const suiteTestCasesRelations = relations(suiteTestCases, ({ one }) => ({
	testSuite: one(testSuites, {
		fields: [suiteTestCases.suite_id],
		references: [testSuites.id],
	}),
	testCase: one(testCases, {
		fields: [suiteTestCases.test_case_id],
		references: [testCases.id],
	}),
}));

// Milestone Test Cases Relations (Join Table)
export const milestoneTestCasesRelations = relations(milestoneTestCases, ({ one }) => ({
	milestone: one(milestones, {
		fields: [milestoneTestCases.milestone_id],
		references: [milestones.id],
	}),
	testCase: one(testCases, {
		fields: [milestoneTestCases.test_case_id],
		references: [testCases.id],
	}),
}));

// Milestone Test Suites Relations (Join Table)
export const milestoneTestSuitesRelations = relations(milestoneTestSuites, ({ one }) => ({
	milestone: one(milestones, {
		fields: [milestoneTestSuites.milestone_id],
		references: [milestones.id],
	}),
	testSuite: one(testSuites, {
		fields: [milestoneTestSuites.test_suite_id],
		references: [testSuites.id],
	}),
}));

// Checklist Relations
export const checklistRelations = relations(checklists, ({ one, many }) => ({
	project: one(projects, {
		fields: [checklists.project_id],
		references: [projects.id],
	}),
	items: many(checklistItems),
}));

// Checklist Item Relations
export const checklistItemRelations = relations(checklistItems, ({ one }) => ({
	checklist: one(checklists, {
		fields: [checklistItems.checklist_id],
		references: [checklists.id],
	}),
}));

// Project AI Config Relations
export const projectAiConfigRelations = relations(projectAiConfigs, ({ one }) => ({
	project: one(projects, {
		fields: [projectAiConfigs.project_id],
		references: [projects.id],
	}),
}));

// AI Usage Logs Relations
export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
	project: one(projects, {
		fields: [aiUsageLogs.project_id],
		references: [projects.id],
	}),
}));

// GitHub Connection Relations
export const githubConnectionRelations = relations(githubConnections, ({ one }) => ({
	project: one(projects, {
		fields: [githubConnections.project_id],
		references: [projects.id],
	}),
}));

// Test Case External Links Relations
export const testCaseExternalLinksRelations = relations(testCaseExternalLinks, ({ one }) => ({
	testCase: one(testCases, {
		fields: [testCaseExternalLinks.test_case_id],
		references: [testCases.id],
	}),
}));
