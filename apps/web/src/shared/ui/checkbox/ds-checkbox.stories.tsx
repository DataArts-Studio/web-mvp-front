import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DsCheckbox } from '@/shared';

const meta: Meta<typeof DsCheckbox> = {
  title: 'Design System/DsCheckbox',
  component: DsCheckbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: '체크박스의 선택 상태를 지정합니다.',
    },
    disabled: {
      control: 'boolean',
      description: '체크박스를 비활성화합니다.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const CheckedDisabled: Story = {
  args: {
    checked: true,
    disabled: true,
  },
};

const WithLabelTemplate = () => {
  const [checked, setChecked] = useState(false);
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <DsCheckbox checked={checked} onCheckedChange={setChecked} />
      <span>이용약관에 동의합니다</span>
    </label>
  );
};

export const WithLabel: Story = {
  render: () => <WithLabelTemplate />,
};
