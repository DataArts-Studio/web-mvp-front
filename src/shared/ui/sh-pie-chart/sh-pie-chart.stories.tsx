import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DonutChart } from './sh-pie-chart';

const meta: Meta<typeof DonutChart> = {
  title: 'Design System/DonutChart',
  component: DonutChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['donut', 'pie'],
      description: '차트의 형태를 지정합니다.',
    },
    showLabel: {
      control: 'boolean',
      description: '중앙에 레이블을 표시합니다.',
    },
    showTooltip: {
      control: 'boolean',
      description: '툴팁을 표시합니다.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const testStatusData = [
  { status: 'Pass', count: 45 },
  { status: 'Fail', count: 12 },
  { status: 'Skip', count: 8 },
  { status: 'Pending', count: 5 },
];

const valueFormatter = (value: number) => `${value}개`;

export const Default: Story = {
  args: {
    data: testStatusData,
    category: 'status',
    value: 'count',
    variant: 'donut',
    showTooltip: true,
    valueFormatter,
  },
};

export const WithLabel: Story = {
  args: {
    data: testStatusData,
    category: 'status',
    value: 'count',
    variant: 'donut',
    showLabel: true,
    label: '70개',
    valueFormatter,
  },
};

export const PieVariant: Story = {
  args: {
    data: testStatusData,
    category: 'status',
    value: 'count',
    variant: 'pie',
    showTooltip: true,
    valueFormatter,
  },
};

export const CustomColors: Story = {
  args: {
    data: testStatusData,
    category: 'status',
    value: 'count',
    variant: 'donut',
    colors: ['emerald', 'rose', 'amber', 'slate'],
    valueFormatter,
  },
};

export const LargeSize: Story = {
  args: {
    data: testStatusData,
    category: 'status',
    value: 'count',
    variant: 'donut',
    showLabel: true,
    className: 'h-64 w-64',
    valueFormatter,
  },
};
