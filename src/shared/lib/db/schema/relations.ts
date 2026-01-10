// src/shared/lib/db/schema/relations.ts
import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { testSuites } from './test-suites';
import { testCases } from './test-cases';
import { testRuns } from './test-runs';
import { milestones } from './milestones';
import { testCaseRuns } from './test-case-runs';
import { testRunSuites } from './test-run-suites';
import { testRunMilestones } from './test-run-milestones';
import { suiteTestCases } from './suite-test-cases';
import { milestoneTestCases } from './milestone-test-cases';

// Project Relations
export const projectRelations = relations(projects, ({ many }) => ({
	testSuites: many(testSuites),
	testCases: many(testCases),
	testRuns: many(testRuns),
	milestones: many(milestones),
}));

// Test Suite Relations
export const testSuiteRelations = relations(testSuites, ({ one, many }) => ({
	project: one(projects, {
		fields: [testSuites.project_id],
		references: [projects.id],
	}),
	testRunSuites: many(testRunSuites),
	suiteTestCases: many(suiteTestCases),
}));

// Test Case Relations
export const testCaseRelations = relations(testCases, ({ one, many }) => ({
	project: one(projects, {
		fields: [testCases.project_id],
		references: [projects.id],
	}),
	testCaseRuns: many(testCaseRuns),
	suiteTestCases: many(suiteTestCases),
	milestoneTestCases: many(milestoneTestCases),
}));

// Test Run Relations
export const testRunRelations = relations(testRuns, ({ one, many }) => ({
	project: one(projects, {
		fields: [testRuns.project_id],
		references: [projects.id],
	}),
	testCaseRuns: many(testCaseRuns),
	testRunSuites: many(testRunSuites),
	testRunMilestones: many(testRunMilestones),
}));

// Milestone Relations
export const milestoneRelations = relations(milestones, ({ one, many }) => ({
	project: one(projects, {
		fields: [milestones.project_id],
		references: [projects.id],
	}),
	testRunMilestones: many(testRunMilestones),
	milestoneTestCases: many(milestoneTestCases),
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

// Test Run Milestones Relations (Join Table)
export const testRunMilestonesRelations = relations(testRunMilestones, ({ one }) => ({
	testRun: one(testRuns, {
		fields: [testRunMilestones.test_run_id],
		references: [testRuns.id],
	}),
	milestone: one(milestones, {
		fields: [testRunMilestones.milestone_id],
		references: [milestones.id],
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
