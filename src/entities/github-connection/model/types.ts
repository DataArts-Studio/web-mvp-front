export type GithubConnection = {
  id: string;
  projectId: string;
  repoFullName: string;
  connectedAt: string;
  updatedAt: string;
};

export type ExternalLink = {
  id: string;
  testCaseId: string;
  linkType: 'github_pr' | 'github_issue';
  externalUrl: string;
  externalId: string;
  repoFullName: string;
  title: string | null;
  status: string | null;
  createdAt: string;
};

export type GithubRepo = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  html_url: string;
};
