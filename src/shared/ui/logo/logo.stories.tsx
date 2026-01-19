import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './logo';

const meta: Meta<typeof Logo> = {
  title: 'Design System/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: 'number',
      description: '로고의 너비를 지정합니다.',
    },
    height: {
      control: 'number',
      description: '로고의 높이를 지정합니다.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    width: 60,
    height: 14,
  },
};

export const Large: Story = {
  args: {
    width: 150,
    height: 36,
  },
};

export const SizeComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'flex-start' }}>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Small (60x14)</p>
        <Logo width={60} height={14} />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Default (97x23)</p>
        <Logo />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>Large (150x36)</p>
        <Logo width={150} height={36} />
      </div>
    </div>
  ),
};

export const OnDarkBackground: Story = {
  render: () => (
    <div style={{ backgroundColor: '#1a1a1a', padding: '24px', borderRadius: '8px' }}>
      <Logo />
    </div>
  ),
};
