# Test Suite Management

This guide explains how to manage test cases by grouping them.

---

## What is a Test Suite?

A test suite is a group that brings related test cases together for management. You can classify cases by feature, by module, or by test type.

### Usage Examples

- **By feature**: Login suite, Payment suite, Search suite
- **By type**: Smoke test, Regression test, Performance test
- **By priority**: Critical suite, High suite, Low suite

---

## Test Suite List

Click the **"Test Suites"** menu in the project sidebar to view the full list of suites.

### List Information

| Item       | Description                        |
| ---------- | ---------------------------------- |
| Name       | Suite name                         |
| Case count | Number of included test cases      |
| Status     | Active / archived status           |
| Modified   | Date and time of last modification |

### Filtering

- **Search**: Search by suite name
- **Status filter**: All, Active, Archived

---

## Creating a Test Suite

### Quick Creation

1. Click **"Create Test Suite"** in the **"Quick Start"** section of the dashboard
2. Or click the **"+ New Suite"** button in the suite list

### Input Fields

| Field       | Required | Description                        |
| ----------- | -------- | ---------------------------------- |
| Name        | ✓        | 10-200 characters, the suite title |
| Description |          | A description of the suite         |

> **Note**: The suite name must be at least 10 characters. Use a name that clearly conveys the suite's purpose.

---

## Adding Cases to a Suite

### Method 1: Add from the Suite Detail

1. Go to the suite detail screen
2. Click the **"Add Case"** button
3. Select the cases to add

### Method 2: Assign a Suite When Creating a Case

1. Select a suite when creating a test case
2. The case is automatically added to that suite

> **Note**: Cases not included in a suite can be found in the [Test Case List](/docs?tab=test-cases) using the **"Unassigned"** filter.

---

## Test Suite Detail

Click a suite to go to its detail screen.

### Detail Screen Composition

- **Header**: Suite name, description, edit button
- **Case list**: The test cases included in the suite
- **Statistics**: Number of cases by status

---

## Creating a Test Run from a Suite

You can create a [Test Run](/docs?tab=test-runs) directly from the suite detail screen. The test cases included in the suite are selected automatically.

---

## Editing a Test Suite

1. Click the suite you want to edit in the suite list
2. Edit the name and description on the detail screen
3. Click the **"Save"** button

---

## Deleting a Test Suite

1. Click the **"Delete"** button on the suite detail screen
2. Confirm the deletion in the confirmation dialog

> **Note**: Deleting a suite does not delete the test cases it contains. The cases remain in the "Unassigned" state.
