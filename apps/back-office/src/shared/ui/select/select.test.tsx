import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './select';

const OPTIONS = [
  { value: 'active', label: 'Active only' },
  { value: 'archived', label: 'Archived' },
  { value: 'all', label: 'All projects' },
];

function SelectFixture({
  defaultValue,
  disabled,
  error,
  onValueChange = vi.fn(),
  size,
}: {
  defaultValue?: string;
  disabled?: boolean;
  error?: boolean;
  onValueChange?: (value: string) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <Select.Root
      defaultValue={defaultValue}
      disabled={disabled}
      error={error}
      size={size}
      onValueChange={onValueChange}
    >
      <Select.Trigger aria-label="Project filter">
        <Select.Value placeholder="Select a project" />
      </Select.Trigger>
      <Select.Content>
        {OPTIONS.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
        <Select.Separator />
      </Select.Content>
    </Select.Root>
  );
}

describe('Select', () => {
  it('renders placeholder and selects an item', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<SelectFixture onValueChange={onValueChange} />);

    const trigger = screen.getByRole('combobox', { name: 'Project filter' });
    expect(screen.getByText('Select a project')).toBeInTheDocument();

    await user.click(trigger);
    await user.click(await screen.findByRole('option', { name: 'Archived' }));

    expect(onValueChange).toHaveBeenCalledWith('archived');
  });

  it('supports keyboard navigation with Arrow keys, Enter, Escape, Home, and End', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(<SelectFixture onValueChange={onValueChange} />);

    const trigger = screen.getByRole('combobox', { name: 'Project filter' });
    trigger.focus();

    await user.keyboard('{ArrowDown}');
    expect(await screen.findByRole('option', { name: 'Active only' })).toBeInTheDocument();

    await user.keyboard('{End}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('all');

    await user.click(trigger);
    expect(await screen.findByRole('option', { name: 'Active only' })).toBeInTheDocument();

    await user.keyboard('{Home}{Enter}');
    expect(onValueChange).toHaveBeenCalledWith('active');

    await user.click(trigger);
    expect(await screen.findByRole('option', { name: 'Active only' })).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: 'Active only' })).not.toBeInTheDocument();
    });
  });

  it('marks open, disabled, error, and md size states on the trigger', async () => {
    const user = userEvent.setup();
    render(<SelectFixture error size="md" />);

    const trigger = screen.getByRole('combobox', { name: 'Project filter' });
    expect(trigger).toHaveClass('h-10');
    expect(trigger).toHaveClass('border-system-red');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');

    await user.click(trigger);

    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(trigger.className).toContain('data-[state=open]:border-primary');

    await user.keyboard('{Escape}');
    cleanup();

    render(<SelectFixture disabled />);
    expect(screen.getByRole('combobox', { name: 'Project filter' })).toBeDisabled();
  });
});
