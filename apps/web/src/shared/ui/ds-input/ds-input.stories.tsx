import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DsInput } from './ds-input';

const meta: Meta<typeof DsInput> = {
  title: 'Design System/DSInput',
  component: DsInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'completed', 'disabled', 'error'],
      description: '인풋의 상태 변형을 지정합니다.',
    },
    uiSize: {
      control: 'select',
      options: ['medium'],
      description: '인풋의 크기를 지정합니다.',
    },
    placeholder: {
      control: 'text',
      description: '플레이스홀더 텍스트를 지정합니다.',
    },
    disabled: {
      control: 'boolean',
      description: '인풋을 비활성화합니다.',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '320px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    uiSize: 'medium',
    placeholder: '텍스트를 입력하세요',
  },
};

export const Completed: Story = {
  args: {
    variant: 'completed',
    uiSize: 'medium',
    defaultValue: '입력 완료된 텍스트',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'disabled',
    uiSize: 'medium',
    placeholder: '비활성화됨',
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    uiSize: 'medium',
    placeholder: '잘못된 입력',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '320px' }}>
      <DsInput variant="default" placeholder="Default" />
      <DsInput variant="completed" defaultValue="Completed" />
      <DsInput variant="disabled" placeholder="Disabled" disabled />
      <DsInput variant="error" placeholder="Error" />
    </div>
  ),
};
