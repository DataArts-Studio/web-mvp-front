# Test Runs

This guide explains how to run tests and record results.

---

## What is a Test Run?

A test run is a session for running test cases at a specific point in time and recording the results. Each run is managed independently, and the run history lets you understand quality trends.

### Usage Examples

- **Sprint test**: Run a regression test before the sprint ends
- **Release verification**: Run tests on key features before deployment
- **Daily check**: Run a smoke test every day

---

## Test Run List

Click the **"Test Runs"** menu in the project sidebar to view the full list of runs.

### List Information

| Item        | Description                                                     |
| ----------- | --------------------------------------------------------------- |
| Name        | Test run name                                                   |
| Source type | Basis for creating the run (suite, milestone, manual selection) |
| Case count  | Number of included test cases                                   |
| Progress    | Percentage of completed cases                                   |
| Status      | Not Started, In Progress, Completed                             |
| Updated     | Time of last update                                             |

### Sort Options

- **Recently Updated**: By most recent update
- **Created Date**: By creation date
- **Name**: By name

---

## Creating a Test Run

### How to Create

1. Click **"Test Runs"** in the sidebar
2. Click the **"+ New Run"** button
3. Enter the run information

### Input Fields

| Field       | Required | Description                             |
| ----------- | -------- | --------------------------------------- |
| Name        | ✓        | At least 1 character, the test run name |
| Description |          | A description of the run                |
| Test cases  | ✓        | Select the cases to run                 |

### Selecting Cases by Source Type

There are three ways to select cases when creating a test run.

| Source type            | Description                                     |
| ---------------------- | ----------------------------------------------- |
| **Select a suite**     | Run the cases included in a specific test suite |
| **Select a milestone** | Run the cases linked to a milestone             |
| **Manual selection**   | Select the cases you want individually          |

### Creating Directly from a Milestone

When you click the **"Create Test Run"** button on a [Milestone](/docs/milestones) detail screen, a run is created with that milestone's cases selected automatically.

---

## Test Run Status

| Status          | Description                  |
| --------------- | ---------------------------- |
| **Not Started** | Run created, not yet started |
| **In Progress** | Tests in progress            |
| **Completed**   | All tests complete           |

---

## Running Tests

### Run Detail Screen

1. Click the item you want to run in the run list
2. Go to the run detail screen

### Entering Results per Case

Enter a result for each test case:

| Result       | Shortcut | Description                 |
| ------------ | -------- | --------------------------- |
| **Pass**     | `P`      | Test passed                 |
| **Fail**     | `F`      | Test failed                 |
| **Blocked**  | `B`      | Cannot run                  |
| **Untested** | `U`      | Revert to the not-run state |

### Adding Comments

- You can add a comment to each case's result
- Record the failure reason, bug links, reproduction steps, and so on
- When you enter a result, the execution time is recorded automatically

---

## Keyboard Shortcuts

On the test run detail screen, you can quickly enter results using only the keyboard.

| Shortcut  | Function                       |
| --------- | ------------------------------ |
| `P`       | Change to Pass                 |
| `F`       | Change to Fail                 |
| `B`       | Change to Blocked              |
| `U`       | Change to Untested             |
| `↑` / `↓` | Move to the previous/next case |

> **Note**: Using shortcuts, you can enter test results quickly without a mouse. With a case selected, pressing a status key applies the result immediately, and you can move to the next case with the arrow keys.

---

## Checking Run Results

### Progress

- Check the overall progress on the run detail screen
- Displays the number of cases by status

### Statistics

- **Pass Rate**: Percentage of passed cases
- **Fail Count**: Number of failed cases
- **Blocked Count**: Number of blocked cases

---

## Checking on the Dashboard

You can also check test run results on the [Dashboard](/docs/dashboard).

- **Test status chart**: Check the status distribution with a pie chart
- **Milestone Gantt chart**: Check the progress timeline by milestone
- You can select a specific run in the dashboard charts to switch the results shown
