import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DsSelect } from './ds-select';

const sampleOptions = [
  { value: 'functional', label: '기능 테스트' },
  { value: 'ui', label: 'UI 테스트' },
  { value: 'api', label: 'API 테스트' },
  { value: 'e2e', label: 'E2E 테스트' },
  { value: 'performance', label: '성능 테스트' },
];

const meta: Meta<typeof DsSelect> = {
  title: 'Design System/DsSelect',
  component: DsSelect,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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

const SelectTemplate = (args: React.ComponentProps<typeof DsSelect>) => {
  const [value, setValue] = useState(args.value ?? '');
  return <DsSelect {...args} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <SelectTemplate {...args} />,
  args: {
    options: sampleOptions,
    placeholder: '테스트 유형을 선택하세요',
  },
};

export const WithValue: Story = {
  render: (args) => <SelectTemplate {...args} />,
  args: {
    options: sampleOptions,
    value: 'api',
  },
};

export const Disabled: Story = {
  render: (args) => <SelectTemplate {...args} />,
  args: {
    options: sampleOptions,
    value: 'ui',
    disabled: true,
  },
};
