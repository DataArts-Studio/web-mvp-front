'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bot, Check, Eye, EyeOff, Loader2, Trash2 } from 'lucide-react';

import { aiConfigQueryOptions, aiConfigQueryKeys } from '@/entities/ai-config';
import { saveAiConfig, deleteAiConfig } from '@/entities/ai-config/api/server-actions';
import { DSButton, DsInput } from '@/shared/ui';

type Props = {
  projectId: string;
};

export const AiConfigCard = ({ projectId }: Props) => {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: configData, isLoading } = useQuery(aiConfigQueryOptions(projectId));
  const config = configData?.success ? configData.data : null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: aiConfigQueryKeys.config(projectId) });
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
        const msg = Object.values(result.errors).flat().join(', ');
        toast.error(msg);
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

  if (isLoading) {
    return (
      <div className="rounded-5 border-line-2 bg-bg-2 flex flex-col border p-6 animate-pulse">
        <div className="h-10 w-10 rounded-full bg-bg-3" />
      </div>
    );
  }

  const providerLabel = config?.provider === 'openai' ? 'OpenAI' : config?.provider === 'anthropic' ? 'Anthropic Claude' : '';
  const defaultModels = {
    openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'gpt-4.1-nano'],
    anthropic: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-5-20250514'],
  };

  return (
    <section className="rounded-5 border-line-2 bg-bg-2 flex flex-col border transition-colors">
      <div className="p-6 pb-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <h2 className="typo-h2-heading text-text-1">AI 테스트 케이스 생성</h2>
            <p className="typo-caption text-text-3">
              AI를 사용하여 기능 설명에서 테스트 케이스를 자동 생성합니다. API 키는 암호화되어 저장됩니다.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-line-2" />

      <div className="p-6 pt-5">
        {config && !isEditing ? (
          /* 설정 완료 상태 */
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-4 w-4 text-green-400" />
              </div>
              <div className="flex flex-col">
                <span className="typo-body2-heading text-text-1">{providerLabel}</span>
                <span className="typo-caption text-text-3">
                  {config.model || '기본 모델'} · API 키 설정됨
                </span>
              </div>
            </div>
            <div className="flex gap-2">
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
            </div>
          </div>
        ) : (
          /* 설정 폼 */
          <div className="flex flex-col gap-4">
            {/* 프로바이더 선택 */}
            <div className="flex flex-col gap-2">
              <span className="typo-label-heading text-text-2">AI 프로바이더</span>
              <div className="flex gap-2">
                {(['anthropic', 'openai'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`typo-body2-normal rounded-2 border px-4 py-2 transition-colors ${
                      provider === p
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-line-2 text-text-3 hover:border-line-1'
                    }`}
                  >
                    {p === 'anthropic' ? 'Anthropic Claude' : 'OpenAI'}
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
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
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
              <p className="typo-caption text-text-4">
                {provider === 'anthropic'
                  ? 'console.anthropic.com에서 API 키를 발급받을 수 있습니다.'
                  : 'platform.openai.com에서 API 키를 발급받을 수 있습니다.'}
              </p>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-2 pt-2">
              {isEditing && (
                <DSButton variant="ghost" size="small" onClick={() => { setIsEditing(false); setApiKey(''); }}>
                  취소
                </DSButton>
              )}
              <DSButton
                variant="solid"
                size="small"
                onClick={() => saveMutation.mutate()}
                disabled={!apiKey.trim() || saveMutation.isPending}
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
      </div>
    </section>
  );
};
