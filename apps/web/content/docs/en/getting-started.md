# Getting Started

Welcome to Testea. This guide is for those using the service for the first time.

---

## What is Testea?

Testea is a test management platform that lets you efficiently manage test cases and track execution results.

### Key Features

- **Dashboard**: Grasp your test status at a glance
- **Test Cases**: Author test cases and manage their status
- **Test Suites**: Group test cases together
- **Test Runs**: Run tests and record results
- **Milestones**: Manage schedule-based test plans
- **CSV Export**: Export test cases to a CSV file

---

## Creating a Project

### Step 1: Visit the Homepage

On the service homepage, click the **"Start for Free"** button.

### Step 2: Enter Project Information

| Field        | Required | Description                                           |
| ------------ | -------- | ----------------------------------------------------- |
| Project name | ✓        | 1-50 characters, the name that identifies the project |
| Identifier   | ✓        | 8-16 characters, the project access password          |
| Description  |          | A brief description of the project                    |
| Owner name   |          | Name of the project administrator                     |

### Step 3: Project Creation Complete

Click the create button to create the project and move to the dashboard.

> **Important**: The identifier is stored hashed, so it cannot be recovered if lost. Keep it in a safe place.

---

## Accessing a Project

### Entering the Identifier

1. Go to the project URL. (`/projects/[project-name]`)
2. The identifier entry screen appears.
3. Enter the identifier you set when creating the project.
4. Click the **"Access"** button.

### Access Token

- On successful authentication, an access token valid for 24 hours is issued.
- When the token expires, you must enter the identifier again.
- If you clear your browser cookies, re-authentication is required.

### Access Restrictions

- If you enter the identifier incorrectly 5 times in a row, access is blocked for 15 minutes.
- After the block is lifted, you can try again.

---

## Provided Specifications

The following specifications are provided per project.

| Item             | Quota |
| ---------------- | ----- |
| Storage capacity | 20MB  |

---

## Next Steps

Once you have created a project, refer to the following guides.

- [Dashboard](/docs/dashboard)
- [Test Case Management](/docs/test-cases)
- [Test Suite Management](/docs/test-suites)
- [Test Runs](/docs/test-runs)
- [Milestone Management](/docs/milestones)
