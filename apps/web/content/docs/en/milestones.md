# Milestone Management

This guide explains how to plan and manage tests on a schedule basis.

---

## What is a Milestone?

A milestone is a unit that defines the test goals to be achieved during a specific period. You can build test plans aligned with sprints, releases, or specific events.

### Usage Examples

- **Sprint**: Sprint 1, Sprint 2, Sprint 3
- **Release**: v1.0 Release, v2.0 Release
- **Event**: QA Sign-off, UAT, Production Deploy

---

## Milestone List

Click the **"Milestones"** menu in the project sidebar to view the full list of milestones.

### List Information

| Item     | Description                   |
| -------- | ----------------------------- |
| Name     | Milestone name                |
| Period   | Start date - end date         |
| Status   | Planned, In Progress, Done    |
| Progress | Percentage of completed tests |

---

## Creating a Milestone

### Quick Creation

1. Click **"Create Milestone"** in the **"Quick Start"** section of the dashboard
2. Or click the **"+ New Milestone"** button in the milestone list

### Input Fields

| Field       | Required | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| Name        | ✓        | 1-50 characters, the milestone name             |
| Description |          | Up to 500 characters, the milestone description |
| Start date  |          | Milestone start date                            |
| End date    |          | Milestone end date                              |

---

## Milestone Status

| Status          | Description              |
| --------------- | ------------------------ |
| **Planned**     | Planned, not yet started |
| **In Progress** | In progress              |
| **Done**        | Complete                 |

---

## Milestone Detail

Click a milestone to go to its detail screen.

### Detail Screen Composition

- **Header**: Milestone name, period, status
- **Description**: A description of the milestone
- **Progress**: Visualized with a progress bar
- **Test suites**: The list of suites linked to the milestone
- **Test cases**: The list of cases included in the milestone

---

## Adding Suites/Cases to a Milestone

You can add test suites and individual cases to a milestone.

### Adding a Suite

1. Click the **"Add Suite"** button on the milestone detail screen
2. Select the suite to add
3. All cases included in the selected suite are linked to the milestone

### Adding a Case

1. Click the **"Add Case"** button on the milestone detail screen
2. Select the cases to add individually

> **Note**: When you add a suite, it is managed as a suite unit, and you can check progress per suite under the milestone in the Gantt chart on the [Dashboard](/docs/dashboard).

---

## Creating a Test Run from a Milestone

When you click the **"Create Test Run"** button on the milestone detail screen:

1. A new test run is created
2. The test cases included in the milestone are selected automatically
3. You are taken to the test run screen

---

## Editing a Milestone

1. Click the milestone you want to edit in the milestone list
2. Edit the name, description, and period on the detail screen
3. Click the **"Save"** button

---

## Deleting a Milestone

1. Click the **"Delete"** button on the milestone detail screen
2. Confirm the deletion in the confirmation dialog

> **Note**: Deleting a milestone does not delete the linked test cases and suites.

---

## Usage Limit

During the beta period, you can create up to **10** milestones per project.
