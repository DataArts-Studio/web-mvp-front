export type AiProvider = 'openai' | 'anthropic';

export type AiConfig = {
  id: string;
  projectId: string;
  provider: AiProvider;
  model: string | null;
  hasApiKey: boolean; // 키 존재 여부만 노출 (실제 키는 노출 안 함)
  createdAt: string;
  updatedAt: string;
};

export type GeneratedTestCase = {
  name: string;
  preCondition: string;
  steps: string;
  expectedResult: string;
  tags: string[];
  category: 'positive' | 'negative' | 'edge_case';
};
