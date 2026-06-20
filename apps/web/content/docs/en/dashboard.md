# Dashboard

This guide explains how to use the dashboard to grasp your project's test status at a glance and start working quickly.

---

## What is the Dashboard?

The dashboard is the first screen you see when you access a project. It summarizes test progress, project information, recent activity, and more, and serves as a starting point for jumping quickly to the main features.

### Key Roles

- **Test status summary**: Check key metrics at a glance with KPI cards
- **Visual analysis**: Understand test status distribution and milestone progress with charts
- **Quick access**: Create or view test cases, suites, and runs directly
- **Project management**: Check project information such as storage usage and recent activity

---

## KPI Cards

Cards summarizing key metrics are shown at the top of the dashboard.

| Card            | Description                                          |
| --------------- | ---------------------------------------------------- |
| **Total Cases** | Total number of test cases registered in the project |
| **Test Suites** | Number of test suites created                        |
| **Pass Rate**   | Percentage of executed tests that passed             |
| **Key Issues**  | Number of failed (Fail) + blocked (Blocked) cases    |
| **Not Run**     | Number of test cases not yet run                     |

### How Pass Rate Is Calculated

```
Pass Rate = Pass / (Pass + Fail + Blocked) × 100
```

- If no tests have been run, it is shown as `N/A`

### Pass Rate Color Criteria

| Pass Rate   | Color  | Meaning         |
| ----------- | ------ | --------------- |
| 80% or more | Green  | Good            |
| 50-79%      | Orange | Needs attention |
| Below 50%   | Red    | At risk         |
| No data     | Gray   | Not run         |

---

## Project Information Card

The middle of the dashboard has a card area showing project-related information.

### Project Information

- Displays the project name
- Copies the project URL to the clipboard with the **Copy Link** button
- Displays the project creation date

### Storage Capacity

- Displays current usage / maximum capacity
- Visualizes usage with a progress bar

| Usage       | Color  | Meaning        |
| ----------- | ------ | -------------- |
| Below 80%   | Green  | Plenty of room |
| 80-94%      | Orange | Caution        |
| 95% or more | Red    | Out of space   |

### Recent Activity

Shows activity recently performed in the project in chronological order.

- Displays up to 7 items
- Records activity such as test case creation, suite creation, and test run completion
- Displays relative time (for example, "5 minutes ago", "1 hour ago")

---

## Test Status Chart

Visualizes test run results with a pie chart.

### Items Displayed

| Status      | Color  | Description          |
| ----------- | ------ | -------------------- |
| **Passed**  | Green  | Test passed          |
| **Failed**  | Red    | Test failed          |
| **Blocked** | Orange | Cannot run (blocked) |
| **Not Run** | Gray   | Not run              |

### Chart Information

- Displays the count and percentage for each status
- **Completion rate**: Percentage of tests run
  - `Completion rate = (Pass + Fail + Blocked) / Total × 100`
- Displays a badge with the total number of tests

### Selecting a Test Run

From the dropdown at the top of the chart, you can select a specific test run to view only that run's results.

- An In Progress run is selected first
- The run name, case count, and completion rate are shown together

> **Note**: If there are no test runs, a **"Start a Test Run"** button is shown instead of the chart.

---

## Milestone Gantt Chart

Shows the schedule and progress of milestones and their suites on a timeline.

### Chart Composition

- **Milestone row**: A top-level item showing overall progress
- **Suite row**: Shown indented under the milestone
- **Progress bar**: The test completion percentage for each item

### Navigating the Timeline

- Displays 6 weeks at a time
- Move between periods with the **Previous/Next** buttons
- **Today marker**: A vertical line shown on the current date
- Displays weekly gridlines

### Test Run Filter

- Selecting a specific test run from the dropdown displays milestone data based on that run
- You can collapse or expand a milestone row to show/hide its suites

---

## Test Cases Section

The bottom of the dashboard briefly shows recent test cases.

### Displayed Information

- Preview of up to 5 cases
- Displays the case key, name, and creation date
- Move to the full case list with the **"View All"** link
- Create a new case with the **"Add"** button

> **Note**: If there are no cases, a **"Create a Test Case"** button is shown.

---

## Test Suites Section

The bottom of the dashboard briefly shows recent test suites.

### Displayed Information

- Preview of up to 5 suites
- Displays the suite name, description, and number of included cases
- Move to the full suite list with the **"View All"** link
- Create a new suite with the **"Add"** button

> **Note**: If there are no suites, a **"Create a Test Suite"** button is shown.

---

## Onboarding Tour

If you are using the dashboard for the first time, you can start a guided tour by clicking the **"Onboarding"** button. The tour walks through each area of the dashboard in order.

---

## Quick Action Guide

These are the main actions you can perform directly from the dashboard.

| Action                | How                                                     |
| --------------------- | ------------------------------------------------------- |
| Create a test case    | Click the **"Add"** button in the cases section         |
| Create a test suite   | Click the **"Add"** button in the suites section        |
| Start a test run      | Click **"Start a Test Run"** in the test status area    |
| Share the project URL | Click the **Copy Link** icon in the project information |
| View all cases        | Click **"View All"** in the cases section               |
| View all suites       | Click **"View All"** in the suites section              |

---

## Next Steps

Once you have checked your project status on the dashboard, refer to the following guides.

- [Test Case Management](/docs/test-cases)
- [Test Suite Management](/docs/test-suites)
- [Test Runs](/docs/test-runs)
- [Milestone Management](/docs/milestones)
