'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import { useTicker } from '../run-model';

/**
 * 사용 흐름 섹션의 단계별 목업. 각 목업은 tick(박자)만으로 지금 장면을 계산한다.
 * 부모가 단계를 바꿀 때마다 key 로 새로 마운트해 장면이 처음부터 다시 시작한다.
 * reduceMotion 이면 박자를 멈추고 마지막 장면(완료 상태)을 그대로 보여 준다.
 */
type MockProps = { reduceMotion: boolean };

const TICK_MS = 350;

/** 목업 공통 창 틀. 실제 화면처럼 상단에 제목 막대를 둔다. */
const MockWindow = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-bg-2 overflow-hidden rounded-lg border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
    <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
      <span className="flex gap-1.5" aria-hidden="true">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
      </span>
      <p className="text-text-2 truncate text-xs font-medium">{title}</p>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

/** reduceMotion 이면 끝 장면 번호를, 아니면 박자를 돌려준다. */
const useScene = (reduceMotion: boolean, last: number) => {
  const tick = useTicker(!reduceMotion, TICK_MS);
  return reduceMotion ? last : tick;
};

const Field = ({
  label,
  children,
  active,
}: {
  label: string;
  children: React.ReactNode;
  active: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-text-3 text-xs">{label}</span>
    <span
      className={cn(
        'bg-bg-3 flex h-10 items-center rounded-md border px-3 text-sm transition-colors',
        active ? 'border-primary/70' : 'border-white/10'
      )}
    >
      {children}
    </span>
  </div>
);

const Caret = () => (
  <span aria-hidden="true" className="animate-landing-blink bg-primary ml-0.5 h-4 w-px" />
);

const PASSWORD_DOTS = 6;

/** 01 프로젝트 만들기: 이름을 타이핑하고, 비밀번호를 채우고, 봇 확인 후 만들기를 누른다. */
export const CreateProjectMock = ({ reduceMotion }: MockProps) => {
  const t = useTranslations('lending.flow.mock.create');
  const name = t('name');
  // 장면 끝(완료 카드)이 단계 표시 시간(9초) 안에 넉넉히 보이도록 전체를 약 20박자(7초)로 맞춘다.
  const nameEnd = name.length;
  const pwEnd = nameEnd + PASSWORD_DOTS;
  const botAt = pwEnd + 1;
  const pressAt = botAt + 2;
  const doneAt = pressAt + 1;
  const scene = useScene(reduceMotion, doneAt);

  const typed = name.slice(0, Math.min(scene, nameEnd));
  const dots = Math.max(0, Math.min(scene - nameEnd, PASSWORD_DOTS));
  const isDone = scene >= doneAt;

  return (
    <MockWindow title={t('window')}>
      <div className="flex flex-col gap-4">
        <Field label={t('nameLabel')} active={scene < nameEnd}>
          <span className="text-text-1">{typed}</span>
          {scene < nameEnd && <Caret />}
        </Field>
        <Field label={t('passwordLabel')} active={scene >= nameEnd && scene < pwEnd}>
          <span className="text-text-1 tracking-[0.3em]">{'•'.repeat(dots)}</span>
          {scene >= nameEnd && scene < pwEnd && <Caret />}
        </Field>
        <div className="bg-bg-3 flex items-center gap-2 rounded-md border border-white/10 px-3 py-2.5 text-xs">
          <span
            className={cn(
              'flex size-4 items-center justify-center rounded-sm border transition-colors',
              scene >= botAt
                ? 'border-primary bg-primary text-bg-1 animate-landing-pop'
                : 'border-white/30'
            )}
          >
            {scene >= botAt && (
              <svg viewBox="0 0 12 12" className="size-3" fill="none" aria-hidden="true">
                <path
                  d="M2.5 6.2 5 8.5l4.5-5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className={scene >= botAt ? 'text-text-1' : 'text-text-3'}>{t('bot')}</span>
        </div>
        {isDone ? (
          <div className="animate-landing-swap-in border-primary/40 bg-primary/10 flex flex-col gap-1 rounded-md border px-3 py-2.5">
            <p className="text-primary text-sm font-bold">{t('done')}</p>
            <p className="text-text-2 truncate text-xs">{t('url')}</p>
          </div>
        ) : (
          <span
            className={cn(
              'bg-primary text-bg-1 flex h-10 items-center justify-center rounded-md text-sm font-bold transition-transform',
              scene >= pressAt ? 'scale-[0.97] opacity-80' : scene < botAt && 'opacity-40'
            )}
          >
            {t('submit')}
          </span>
        )}
      </div>
    </MockWindow>
  );
};

/** 02 케이스 가져오기: CSV 를 올리면 케이스 행이 하나씩 쌓이고, AI 초안이 뒤따른다. */
export const WriteCasesMock = ({ reduceMotion }: MockProps) => {
  const t = useTranslations('lending.flow.mock.cases');
  const rows = t.raw('rows') as [string, string, string][];
  const firstRowAt = 3;
  const rowGap = 2;
  const aiAt = firstRowAt + rows.length * rowGap + 1;
  const scene = useScene(reduceMotion, aiAt);
  const shown = Math.max(0, Math.min(rows.length, Math.floor((scene - firstRowAt) / rowGap) + 1));
  const visibleRows = scene < firstRowAt ? 0 : shown;

  return (
    <MockWindow title={t('window')}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              'flex min-w-0 items-center gap-2 rounded-md border border-dashed px-3 py-2 text-xs transition-colors',
              scene >= 1 ? 'border-primary/60 text-text-1' : 'text-text-3 border-white/20'
            )}
          >
            <span aria-hidden="true" className="text-primary">
              CSV
            </span>
            <span className="truncate">{t('file')}</span>
          </span>
          <span className="text-primary shrink-0 text-xs font-medium">
            {t('imported', { count: visibleRows })}
          </span>
        </div>
        <ol className="flex flex-col">
          {rows.slice(0, visibleRows).map(([id, title, suite]) => (
            <li
              key={id}
              className="animate-landing-feed-in flex items-center gap-3 border-t border-white/5 py-2 text-sm"
            >
              <span className="text-primary w-14 shrink-0 font-mono text-xs">{id}</span>
              <span className="text-text-1 min-w-0 flex-1 truncate">{title}</span>
              <span className="bg-bg-4 text-text-3 shrink-0 rounded-sm px-1.5 py-0.5 text-[11px]">
                {suite}
              </span>
            </li>
          ))}
          {/* 아직 안 들어온 행 자리. 높이가 흔들리지 않게 미리 잡아 둔다. */}
          {Array.from({ length: rows.length - visibleRows }, (_, i) => (
            <li key={`empty-${i}`} aria-hidden="true" className="border-t border-white/5 py-2">
              <span className="bg-bg-3 block h-5 w-2/3 rounded-sm" />
            </li>
          ))}
        </ol>
        <span
          className={cn(
            'self-start rounded-full border px-3 py-1 text-xs transition-opacity',
            scene >= aiAt
              ? 'animate-landing-swap-in border-[#A78BFA]/50 text-[#C4B5FD]'
              : 'border-transparent opacity-0'
          )}
        >
          {t('ai', { count: 3 })}
        </span>
      </div>
    </MockWindow>
  );
};

type Verdict = 'pass' | 'fail' | 'blocked';

/** 실행 목업에서 위에서부터 차례로 내려지는 판정. 항목 수(i18n items)와 길이를 맞춘다. */
const RUN_VERDICTS: Verdict[] = ['pass', 'pass', 'fail', 'pass', 'blocked'];

const VERDICT_STYLE: Record<Verdict, { badge: string; bar: string }> = {
  pass: { badge: 'bg-primary/10 text-primary', bar: 'bg-primary' },
  fail: { badge: 'bg-system-red/10 text-system-red', bar: 'bg-system-red' },
  blocked: { badge: 'bg-[#F59E0B]/10 text-[#F59E0B]', bar: 'bg-[#F59E0B]' },
};

/** 03 테스트 런: 진행 중인 행이 위에서부터 내려오며 판정이 붙고 막대가 차오른다. */
export const RunMock = ({ reduceMotion }: MockProps) => {
  const t = useTranslations('lending.flow.mock.run');
  const items = t.raw('items') as string[];
  const stepGap = 3;
  const scene = useScene(reduceMotion, items.length * stepGap);
  const done = Math.min(items.length, Math.floor(scene / stepGap));

  return (
    <MockWindow title={t('window')}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div aria-hidden="true" className="flex flex-1 gap-1 pr-4">
            {items.map((item, i) => (
              <span key={item} className="bg-bg-4 h-1 flex-1 overflow-hidden rounded-full">
                <span
                  className={cn(
                    'block h-full transition-[width] duration-300',
                    i < done ? `w-full ${VERDICT_STYLE[RUN_VERDICTS[i]].bar}` : 'w-0'
                  )}
                />
              </span>
            ))}
          </div>
          <span className="text-primary shrink-0 text-xs font-medium">
            {t('counter', { done, total: items.length })}
          </span>
        </div>
        <ol className="flex flex-col">
          {items.map((item, i) => {
            const verdict = i < done ? RUN_VERDICTS[i] : undefined;
            const isCurrent = i === done;
            return (
              <li
                key={item}
                className={cn(
                  'flex min-h-10 items-center justify-between gap-3 border-t border-white/5 px-1 py-1.5 text-sm transition-colors',
                  isCurrent ? 'bg-bg-3 text-text-1' : verdict ? 'text-text-2' : 'text-text-3'
                )}
              >
                <span className="min-w-0 truncate">{item}</span>
                {verdict ? (
                  <span
                    className={cn(
                      'animate-landing-pop shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium',
                      VERDICT_STYLE[verdict].badge
                    )}
                  >
                    {t(verdict)}
                  </span>
                ) : (
                  isCurrent && (
                    <span className="animate-landing-hint border-primary/40 text-primary shrink-0 rounded-sm border px-2 py-0.5 text-xs">
                      ···
                    </span>
                  )
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </MockWindow>
  );
};

/** 결과 목업의 판정 분포(%). 합이 100 이다. */
const SHARE_RATIO: Record<Verdict, number> = { pass: 80, fail: 12, blocked: 8 };
const SHARE_ORDER: Verdict[] = ['pass', 'fail', 'blocked'];

/** 04 결과 공유: 분포 막대가 차오르고, 링크 복사를 누르면 복사 완료 알림이 뜬다. */
export const ShareMock = ({ reduceMotion }: MockProps) => {
  const t = useTranslations('lending.flow.mock.share');
  const fillAt = 2;
  const pressAt = 9;
  const copiedAt = pressAt + 1;
  const scene = useScene(reduceMotion, copiedAt);
  const isFilled = scene >= fillAt;
  const rate = isFilled ? SHARE_RATIO.pass : 0;

  return (
    <MockWindow title={t('window')}>
      <div className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-text-3 text-xs">{t('rate')}</p>
            <p className="text-text-1 text-3xl font-bold tabular-nums transition-all">{rate}%</p>
          </div>
          <dl className="flex gap-3 text-xs">
            {SHARE_ORDER.map((v) => (
              <div key={v} className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={cn('size-2 rounded-full', VERDICT_STYLE[v].bar)}
                />
                <dt className="text-text-3">{t(v)}</dt>
                <dd className="text-text-1 tabular-nums">{isFilled ? SHARE_RATIO[v] : 0}%</dd>
              </div>
            ))}
          </dl>
        </div>
        <div aria-hidden="true" className="bg-bg-4 flex h-2.5 overflow-hidden rounded-full">
          {SHARE_ORDER.map((v) => (
            <span
              key={v}
              style={{ width: isFilled ? `${SHARE_RATIO[v]}%` : '0%' }}
              className={cn(
                'h-full transition-[width] duration-700 ease-out',
                VERDICT_STYLE[v].bar
              )}
            />
          ))}
        </div>
        <div className="border-system-red/30 bg-system-red/5 rounded-md border px-3 py-2">
          <p className="text-text-3 text-[11px]">{t('failed')}</p>
          <p className="text-text-1 truncate text-sm">{t('failedItem')}</p>
        </div>
        <div className="relative flex items-center gap-2">
          <span className="bg-bg-3 text-text-2 flex h-9 min-w-0 flex-1 items-center truncate rounded-md border border-white/10 px-3 text-xs">
            {t('link')}
          </span>
          <span
            className={cn(
              'border-primary/50 text-primary flex h-9 shrink-0 items-center rounded-md border px-3 text-xs font-medium transition-transform',
              scene === pressAt && 'bg-primary/10 scale-95'
            )}
          >
            {t('copy')}
          </span>
          {scene >= copiedAt && (
            <span className="animate-landing-feed-in bg-text-1 text-bg-1 absolute -top-9 right-0 rounded-md px-2.5 py-1 text-xs font-medium">
              {t('copied')}
            </span>
          )}
        </div>
      </div>
    </MockWindow>
  );
};

export const FLOW_MOCKS = [CreateProjectMock, WriteCasesMock, RunMock, ShareMock] as const;
