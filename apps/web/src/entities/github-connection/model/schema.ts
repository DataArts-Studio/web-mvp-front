import { z } from 'zod';

export const ConnectGithubSchema = z.object({
  projectId: z.string().uuid(),
  code: z.string().min(1),
});

export const SelectRepoSchema = z.object({
  projectId: z.string().uuid(),
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
});

export const CreateExternalLinkSchema = z.object({
  testCaseId: z.string().uuid(),
  linkType: z.enum(['github_pr', 'github_issue']),
  externalUrl: z.string().url(),
  externalId: z.string().min(1),
  repoFullName: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  title: z.string().optional(),
  status: z.string().optional(),
});

export const CreateGithubIssueSchema = z.object({
  testCaseId: z.string().uuid(),
  title: z.string().min(1).max(256),
  body: z.string().max(10000).optional(),
});
