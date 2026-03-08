'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bot, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

import { aiConfigQueryOptions, aiConfigQueryKeys } from '@/entities/ai-config';
import { saveAiConfig, deleteAiConfig } from '@/entities/ai-config/api/server-actions';
import { API_KEY_RULES } from '@/entities/ai-config/model/schema';
import { DSButton, DsInput, SettingsCard } from '@/shared/ui';

const PROVIDER_META = {
  anthropic: { label: 'Anthropic Claude', placeholder: 'sk-ant-...', hint: 'console.anthropic.com에서 API 키를 발급받을 수 있습니다.' },
  openai: { label: 'OpenAI', placeholder: 'sk-...', hint: 'platform.openai.com에서 API 키를 발급받을 수 있습니다.' },
  gemini: { label: 'Google Gemini', placeholder: 'AIza...', hint: 'aistudio.google.com에서 API 키를 발급받을 수 있습니다.' },
} as const;

type Provider = keyof typeof PROVIDER_META;

type Props = {
  projectId: string;
};

export const AiConfigCard = ({ projectId }: Props) => {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<Provider>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const { data: configData, isLoading } = useQuery(aiConfigQueryOptions(projectId));
  const config = configData?.success ? configData.data : null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: aiConfigQueryKeys.config(projectId) });
  };

  const validateApiKey = (key: string, p: Provider): string | null => {
    const trimmed = key.trim();
    if (!trimmed) return null;
    const rule = API_KEY_RULES[p];
    if (!trimmed.startsWith(rule.prefix)) return rule.prefixError;
    if (trimmed.length < rule.minLength || trimmed.length > rule.maxLength) return rule.lengthError;
    return null;
  };

  const saveMutation = useMutation({
    mutationFn: () => saveAiConfig({ projectId, provider, apiKey }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('AI 설정이 저장되었습니다.');
        setApiKey('');
        setIsEditing(false);
        invalidate();
      } else {
        toast.error(Object.values(result.errors).flat().join(', '));
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteAiConfig(projectId),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('AI 설정이 삭제되었습니다.');
        invalidate();
      }
    },
  });

  if (isLoading) return <SettingsCard.LoadingSkeleton />;

  const meta = PROVIDER_META[provider];

  return (
    <SettingsCard.Root>
      <SettingsCard.Header
        icon={<Bot className="h-5 w-5" />}
        title="AI 테스트 케이스 생성"
        description="AI를 사용하여 기능 설명에서 테스트 케이스를 자동 생성합니다. API 키는 암호화되어 저장됩니다."
      />
      <SettingsCard.Divider />
      <SettingsCard.Body>
        {config && !isEditing ? (
          <SettingsCard.ConnectedStatus
            label={PROVIDER_META[config.provider]?.label ?? config.provider}
            description={`${config.model || '기본 모델'} · API 키 설정됨`}
            actions={
              <>
                <DSButton variant="ghost" size="small" onClick={() => { setIsEditing(true); setProvider(config.provider); }}>
                  변경
                </DSButton>
                <DSButton
                  variant="ghost"
                  size="small"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </DSButton>
              </>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {/* 프로바이더 선택 */}
            <div className="flex flex-col gap-2">
              <span className="typo-label-heading text-text-2">AI 프로바이더</span>
              <div className="flex gap-2">
                {(Object.keys(PROVIDER_META) as Provider[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setProvider(p); setKeyError(validateApiKey(apiKey, p)); }}
                    className={`typo-body2-normal rounded-2 border px-4 py-2 transition-colors ${
                      provider === p
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-line-2 text-text-3 hover:border-line-1'
                    }`}
                  >
                    {PROVIDER_META[p].label}
                  </button>
                ))}
              </div>
            </div>

            {/* API 키 */}
            <div className="flex flex-col gap-2">
              <span className="typo-label-heading text-text-2">API 키</span>
              <div className="relative">
                <DsInput
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setKeyError(validateApiKey(e.target.value, provider)); }}
                  placeholder={meta.placeholder}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-4 hover:text-text-2"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="typo-caption text-text-4">{meta.hint}</p>
              {keyError && <p className="typo-caption text-red-400">{keyError}</p>}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              {isEditing && (
                <DSButton variant="ghost" size="small" onClick={() => { setIsEditing(false); setApiKey(''); setKeyError(null); }}>
                  취소
                </DSButton>
              )}
              <DSButton
                variant="solid"
                size="small"
                onClick={() => saveMutation.mutate()}
                disabled={!apiKey.trim() || !!keyError || saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '저장'
                )}
              </DSButton>
            </div>
          </div>
        )}
      </SettingsCard.Body>
    </SettingsCard.Root>
  );
};
