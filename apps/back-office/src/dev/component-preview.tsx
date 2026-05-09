'use client';

import React from 'react';

import { Button as BackOfficeButton } from '@/shared/ui';
import { CaseSelectionPanel } from '@testea/ui/case-selection-panel';
import { DsCheckbox } from '@testea/ui/checkbox';
import { DSButton } from '@testea/ui/ds-button';
import { DsFormField } from '@testea/ui/ds-form-field';
import { DsInput } from '@testea/ui/ds-input';
import { DsSelect } from '@testea/ui/ds-select';
import { EmptyState } from '@testea/ui/empty-state';
import { LoadingSpinner } from '@testea/ui/loading-spinner';
import { Logo } from '@testea/ui/logo';
import { Pagination } from '@testea/ui/pagination';
import { SettingsCard } from '@testea/ui/settings-card';
import { Skeleton, SkeletonCircle, SkeletonText } from '@testea/ui/skeleton';
import { TagChipInput } from '@testea/ui/tag-chip-input';

const selectOptions = [
  { value: 'all', label: 'All projects' },
  { value: 'active', label: 'Active only' },
  { value: 'archived', label: 'Archived' },
];

const cases = [
  { id: 'case-1', caseKey: 'TC-101', title: 'Create project from template' },
  { id: 'case-2', caseKey: 'TC-102', title: 'Invite project member' },
  { id: 'case-3', caseKey: 'TC-103', title: 'Export run result' },
];

export default function BackOfficeComponentPreview() {
  const [selectValue, setSelectValue] = React.useState('active');
  const [checked, setChecked] = React.useState(true);
  const [page, setPage] = React.useState(2);
  const [tags, setTags] = React.useState(['smoke', 'regression']);
  const [selectedCases, setSelectedCases] = React.useState(() => new Set(['case-1']));
  const [casePanelOpen, setCasePanelOpen] = React.useState(true);

  const toggleCase = (id: string) => {
    setSelectedCases((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-bg-1 px-6 py-8 text-text-1">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-line-2 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <Logo width={128} height={31} />
            <div>
              <h1 className="text-2xl font-bold tracking-zero">Back-office Component Preview</h1>
              <p className="mt-2 text-sm text-text-2">
                Temporary screen for visually checking components used by back-office.
              </p>
            </div>
          </div>
          <div className="rounded-4 border border-line-2 bg-bg-2 px-4 py-3 text-sm text-text-2">
            /dev/components
          </div>
        </header>

        <Section title="Back-office Local Button">
          <div className="flex flex-wrap gap-3">
            <BackOfficeButton>Primary</BackOfficeButton>
            <BackOfficeButton variant="outlined">Outlined</BackOfficeButton>
            <BackOfficeButton variant="text">Text</BackOfficeButton>
            <BackOfficeButton disabled>Disabled</BackOfficeButton>
            <BackOfficeButton leftIcon={<span aria-hidden="true">@</span>}>
              With icon
            </BackOfficeButton>
          </div>
        </Section>

        <Section title="@testea/ui Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <DSButton variant="solid">Solid</DSButton>
            <DSButton variant="ghost">Ghost</DSButton>
            <DSButton variant="text">Text</DSButton>
            <DSButton size="small">Small</DSButton>
            <DSButton size="large">Large</DSButton>
            <DSButton size="icon" aria-label="settings">
              <span aria-hidden="true">...</span>
            </DSButton>
          </div>
        </Section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Section title="Inputs">
            <div className="flex flex-col gap-5">
              <DsFormField.Root>
                <DsFormField.Label className="text-sm font-semibold tracking-zero text-text-1">
                  Project name
                </DsFormField.Label>
                <DsFormField.Control asChild>
                  <DsInput placeholder="QA workspace" defaultValue="Back-office QA" />
                </DsFormField.Control>
              </DsFormField.Root>

              <DsFormField.Root error={{ message: 'Required field sample' }}>
                <DsFormField.Label className="text-sm font-semibold tracking-zero text-text-1">
                  Error state
                </DsFormField.Label>
                <DsFormField.Control asChild>
                  <DsInput variant="error" placeholder="Required value" />
                </DsFormField.Control>
                <DsFormField.Message />
              </DsFormField.Root>

              <DsSelect value={selectValue} onChange={setSelectValue} options={selectOptions} />
            </div>
          </Section>

          <Section title="Selection Controls">
            <div className="flex flex-col gap-5">
              <label className="flex items-center gap-3 text-sm text-text-2">
                <DsCheckbox checked={checked} onCheckedChange={setChecked} />
                Checkbox checked: {String(checked)}
              </label>
              <TagChipInput
                value={tags}
                onChange={setTags}
                suggestions={['smoke', 'regression', 'payment', 'admin', 'release']}
                placeholder="Add a tag and press Enter"
              />
              <Pagination currentPage={page} totalPages={5} onPageChange={setPage} />
            </div>
          </Section>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Section title="Panels">
            <div className="flex flex-col gap-5">
              <CaseSelectionPanel
                allCases={cases}
                selectedCaseIds={selectedCases}
                onToggleCase={toggleCase}
                isExpanded={casePanelOpen}
                onToggleExpand={() => setCasePanelOpen((value) => !value)}
              />
              <SettingsCard.Root>
                <SettingsCard.Header
                  icon={<span className="text-sm font-bold">OK</span>}
                  title="Integration"
                  description="Connected state and card shell"
                />
                <SettingsCard.Divider />
                <SettingsCard.Body>
                  <SettingsCard.ConnectedStatus
                    label="Supabase connected"
                    description="Last checked just now"
                    actions={
                      <DSButton size="small" variant="ghost">
                        Manage
                      </DSButton>
                    }
                  />
                </SettingsCard.Body>
              </SettingsCard.Root>
            </div>
          </Section>

          <Section title="Feedback">
            <div className="flex flex-col gap-6">
              <EmptyState
                icon={
                  <span className="text-3xl" aria-hidden="true">
                    []
                  </span>
                }
                title="No projects"
                description="Empty state with an optional action."
                action={<DSButton size="small">Create project</DSButton>}
              />
              <div className="flex items-center gap-8 rounded-4 border border-line-2 bg-bg-2 p-6">
                <LoadingSpinner size="sm" text="Loading" />
                <div className="flex flex-1 flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <SkeletonCircle className="h-10 w-10" />
                    <SkeletonText className="w-40" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          </Section>
        </section>

        <Section title="Skipped Because Current Source Has Syntax Errors">
          <div className="grid gap-3 text-sm text-text-2 sm:grid-cols-2">
            <Skipped
              name="SuiteSelectionPanel"
              path="packages/ui/src/suite-selection-panel/suite-selection-panel.tsx"
            />
            <Skipped
              name="SelectionModal"
              path="packages/ui/src/selection-modal/selection-modal.tsx"
            />
            <Skipped name="StatusBadge" path="packages/ui/src/status-badge/status-badge.tsx" />
            <Skipped
              name="MvpBottomNavbar"
              path="packages/ui/src/mvp-bottom-navbar/mvp-bottom-navbar.tsx"
            />
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-4 border border-line-2 bg-bg-2 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-zero">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Skipped({ name, path }: { name: string; path: string }) {
  return (
    <div className="rounded-4 border border-line-2 bg-bg-3 p-4">
      <div className="font-medium text-text-1">{name}</div>
      <div className="mt-1 break-all font-mono text-xs">{path}</div>
    </div>
  );
}
