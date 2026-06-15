'use client';

import type { ReactNode } from 'react';

import type { GeneratedScenario, RequirementAnalysis } from '@/entities/requirement-analysis';
import { cn } from '@testea/util';
import { CheckSquare, Square } from 'lucide-react';

type Props = {
  analysis: RequirementAnalysis;
  scenarios: GeneratedScenario[];
  selected: Set<number>;
  onToggleAll: () => void;
  onToggleOne: (idx: number) => void;
};

const TYPE_LABEL: Record<string, { text: string; cls: string }> = {
  positive: { text: 'Positive', cls: 'bg-green-500/10 text-green-400' },
  negative: { text: 'Negative', cls: 'bg-red-500/10 text-red-400' },
  edge_case: { text: 'Edge Case', cls: 'bg-yellow-500/10 text-yellow-400' },
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col gap-2">
    <h4 className="typo-label-heading text-text-2">{title}</h4>
    {children}
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="flex flex-col gap-1">
    {items.map((item, i) => (
      <li key={i} className="typo-body2-normal text-text-3 flex gap-2">
        <span className="text-text-4">·</span>
        <span className="whitespace-pre-line">{item}</span>
      </li>
    ))}
  </ul>
);

export const RequirementAnalysisPreview = ({
  analysis,
  scenarios,
  selected,
  onToggleAll,
  onToggleOne,
}: Props) => (
  <div className="flex flex-col gap-6">
    {/* 요구사항 분석서 */}
    <div className="border-line-2 bg-bg-1 rounded-3 flex flex-col gap-5 border p-5">
      <div className="flex flex-col gap-1">
        <span className="typo-caption text-primary">요구사항 분석서</span>
        <h3 className="typo-body1-heading text-text-1">{analysis.title}</h3>
        {analysis.summary && (
          <p className="typo-body2-normal text-text-3 whitespace-pre-line">{analysis.summary}</p>
        )}
      </div>

      {analysis.functionalRequirements.length > 0 && (
        <Section title="기능 요구사항">
          <div className="flex flex-col gap-2">
            {analysis.functionalRequirements.map((fr) => (
              <div key={fr.id} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="typo-caption bg-bg-3 text-text-3 rounded-full px-2 py-0.5">
                    {fr.id}
                  </span>
                  <span className="typo-body2-heading text-text-1">{fr.title}</span>
                </div>
                {fr.description && (
                  <p className="typo-caption text-text-3 pl-1 whitespace-pre-line">
                    {fr.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {analysis.nonFunctionalRequirements.length > 0 && (
        <Section title="비기능 요구사항">
          <div className="flex flex-col gap-2">
            {analysis.nonFunctionalRequirements.map((nfr, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="typo-body2-heading text-text-1">{nfr.category}</span>
                {nfr.description && (
                  <p className="typo-caption text-text-3 whitespace-pre-line">{nfr.description}</p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {analysis.constraints.length > 0 && (
        <Section title="제약사항">
          <BulletList items={analysis.constraints} />
        </Section>
      )}

      {analysis.assumptions.length > 0 && (
        <Section title="가정">
          <BulletList items={analysis.assumptions} />
        </Section>
      )}

      {analysis.openQuestions.length > 0 && (
        <Section title="확인이 필요한 항목">
          <BulletList items={analysis.openQuestions} />
        </Section>
      )}
    </div>

    {/* 테스트 시나리오 선택 */}
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleAll}
          aria-label={
            selected.size === scenarios.length ? '시나리오 전체 선택 해제' : '시나리오 전체 선택'
          }
          className="text-text-3 hover:text-text-1 transition-colors"
        >
          {selected.size === scenarios.length ? (
            <CheckSquare className="text-primary h-4.5 w-4.5" />
          ) : (
            <Square className="h-4.5 w-4.5" />
          )}
        </button>
        <span className="typo-body2-heading text-text-1">테스트 시나리오 {scenarios.length}개</span>
        <span className="typo-caption text-text-3">({selected.size}개 선택)</span>
      </div>
      <p className="typo-caption text-text-4">선택한 시나리오가 테스트 스위트로 저장됩니다.</p>

      <div className="flex flex-col gap-2">
        {scenarios.map((scenario, idx) => {
          const type = TYPE_LABEL[scenario.type ?? 'positive'] ?? TYPE_LABEL.positive;
          return (
            <div
              key={idx}
              className={cn(
                'rounded-3 border p-4 transition-colors',
                selected.has(idx) ? 'border-primary/30 bg-primary/[0.02]' : 'border-line-2 bg-bg-1'
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onToggleOne(idx)}
                  aria-label={
                    selected.has(idx)
                      ? `시나리오 선택 해제: ${scenario.name}`
                      : `시나리오 선택: ${scenario.name}`
                  }
                  className="mt-0.5 shrink-0"
                >
                  {selected.has(idx) ? (
                    <CheckSquare className="text-primary h-4.5 w-4.5" />
                  ) : (
                    <Square className="text-text-4 h-4.5 w-4.5" />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="typo-body2-heading text-text-1 flex-1 truncate">
                      {scenario.name}
                    </span>
                    <span
                      className={cn('typo-caption shrink-0 rounded-full px-2 py-0.5', type.cls)}
                    >
                      {type.text}
                    </span>
                  </div>
                  {scenario.description && (
                    <p className="typo-caption text-text-3 line-clamp-3 whitespace-pre-line">
                      {scenario.description}
                    </p>
                  )}
                  {scenario.relatedRequirementIds && scenario.relatedRequirementIds.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {scenario.relatedRequirementIds.map((rid) => (
                        <span
                          key={rid}
                          className="typo-caption bg-bg-3 text-text-4 rounded-full px-2 py-0.5"
                        >
                          {rid}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
