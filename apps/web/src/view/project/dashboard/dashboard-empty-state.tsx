import React from 'react';
import { DSButton } from '@testea/ui';
import { Plus } from 'lucide-react';

type DashboardEmptyStateProps = {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  buttonLabel: string;
  onAction: () => void;
  image?: React.ReactNode;
  actionOverride?: React.ReactNode;
};

export const DashboardEmptyState = ({ icon, title, description, buttonLabel, onAction, image, actionOverride }: DashboardEmptyStateProps) => (
  <div className="rounded-3 border-line-2 bg-bg-2/50 border-2 border-dashed flex flex-col items-center justify-center gap-4 py-12">
    {image ?? (
      <div className="bg-bg-3 text-text-3 flex h-12 w-12 items-center justify-center rounded-full">
        {icon}
      </div>
    )}
    <div className="flex flex-col items-center gap-1 text-center">
      <h3 className="typo-h3-heading text-text-1">{title}</h3>
      <p className="typo-body2-normal text-text-3">{description}</p>
    </div>
    {actionOverride ?? (
      <DSButton variant="solid" className="flex items-center gap-2" onClick={onAction}>
        <Plus className="h-4 w-4" />
        <span>{buttonLabel}</span>
      </DSButton>
    )}
  </div>
);
