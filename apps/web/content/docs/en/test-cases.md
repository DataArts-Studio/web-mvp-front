# Test Case Management

This guide explains how to author and manage test cases.

---

## What is a Test Case?

A test case is a unit of testing for verifying a specific feature or scenario. Each test case includes preconditions, test steps, and expected results.

---

## Test Case List

Click the **"Test Cases"** menu in the project sidebar to view the full list of test cases.

### List Information

| Item     | Description                                                        |
| -------- | ------------------------------------------------------------------ |
| Case key | An automatically generated unique identifier (for example, TC-001) |
| Name     | Test case name                                                     |
| Status   | Untested, Pass, Fail, Blocked                                      |
| Tags     | Tags for classification                                            |
| Modified | Date and time of last modification                                 |

### Filtering and Search

- **Search**: Search by case name
- **Status filter**: Show only cases with a specific status
- **Tag filter**: Show only cases with a specific tag
- **Suite filter**: Show only cases included in a specific suite
  - **"Unassigned"**: Show only cases not assigned to a suite

### Sort Options

| Option            | Description                              |
| ----------------- | ---------------------------------------- |
| Recently modified | Show recently modified cases first       |
| Oldest modified   | Show least recently modified cases first |
| Recently created  | Show recently created cases first        |
| Oldest created    | Show least recently created cases first  |
| Title ascending   | Sort in alphabetical (ABC) order         |
| Title descending  | Sort in reverse order                    |

### Pagination

- Shows 30 items by default
- Click the **"Load More"** button to load additional cases

---

## Creating a Test Case

### Quick Creation

1. Click **"Create Test Case"** in the **"Quick Start"** section of the dashboard
2. Or click the **"+ New Case"** button in the test case list

### Input Fields

| Field           | Required | Description                                              |
| --------------- | -------- | -------------------------------------------------------- |
| Name            | ✓        | 1-200 characters, the test case title                    |
| Test type       |          | Type of test (functional, regression, integration, etc.) |
| Tags            |          | Up to 10, tags for classification                        |
| Preconditions   |          | Conditions required before running the test              |
| Test steps      |          | The procedure for performing the test                    |
| Expected result |          | The expected outcome when the test succeeds              |

> **Note**: The case key (for example, TC-001) is assigned automatically on creation.

---

## Test Case Status

| Status       | Description          | Color  |
| ------------ | -------------------- | ------ |
| **Untested** | Not yet run          | Gray   |
| **Pass**     | Test passed          | Green  |
| **Fail**     | Test failed          | Red    |
| **Blocked**  | Cannot run (blocked) | Orange |

> **Note**: A test case's status is updated automatically when you enter a result in a [Test Run](/docs/test-runs).

---

## Editing a Test Case

1. Click the case you want to edit in the case list
2. Edit the content in the side panel or detail screen
3. Click the **"Save"** button

---

## Deleting a Test Case

1. Click the **"Delete"** button on the case detail screen
2. Confirm the deletion in the confirmation dialog

> **Caution**: A deleted test case cannot be recovered. Be sure to confirm before deleting.

---

## CSV Export

You can export the test case list to a CSV file.

### How to Export

1. Click the **"Export"** button on the test case list screen
2. The CSV file is downloaded automatically

### Included Information

| Item            | Description                         |
| --------------- | ----------------------------------- |
| Case key        | Unique identifier                   |
| Title           | Test case name                      |
| Test type       | Type of test                        |
| Tags            | Classification tags                 |
| Preconditions   | Conditions required before the test |
| Test steps      | The procedure                       |
| Expected result | Expected outcome                    |
| Status          | Current test status                 |
| Suite           | Name of the suite it belongs to     |
| Created         | Case creation date                  |
| Modified        | Date of last modification           |

> **Note**: The currently applied filter and sort order are reflected in the export. CSV files containing Korean text are saved in UTF-8 BOM format so they can be opened directly in Excel.
