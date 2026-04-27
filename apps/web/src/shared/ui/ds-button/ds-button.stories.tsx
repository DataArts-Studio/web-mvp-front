import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DSButton } from './ds-button';
import { Play, Loader } from 'lucide-react';

const meta: Meta<typeof DSButton> = {
  title: 'Design System/DSButton',
  component: DSButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'ghost', 'text'],
      description: '버튼의 스타일 변형을 지정합니다.',
    },
    size: {
      control: 'select',
      options: ['large', 'medium', 'small'],
      description: '버튼의 크기를 지정합니다.',
    },
    disabled: {
      control: 'boolean',
      description: '버튼을 비활성화합니다.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {
  args: {
    variant: 'solid',
    size: 'medium',
    children: '버튼 액션',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    size: 'medium',
    children: '버튼 액션',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    size: 'medium',
    children: '버튼 액션',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <DSButton size="large">Large</DSButton>
      <DSButton size="medium">Medium</DSButton>
      <DSButton size="small">Small</DSButton>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <DSButton variant="solid">Solid</DSButton>
      <DSButton variant="ghost">Ghost</DSButton>
      <DSButton variant="text">Text</DSButton>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    variant: 'solid',
    size: 'medium',
    disabled: true,
    children: '비활성화됨',
  },
};

export const WithIcon: Story = {
  render: () => (
    <DSButton variant="solid" size="medium">
      <Play size={20} />
      시작하기
    </DSButton>
  ),
};

export const Loading: Story = {
  render: () => (
    <DSButton variant="solid" size="medium" disabled>
      <Loader size={20} className="animate-spin" />
      처리 중...
    </DSButton>
  ),
};
