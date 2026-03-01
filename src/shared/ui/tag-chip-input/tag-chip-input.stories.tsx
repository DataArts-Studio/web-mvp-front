import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { TagChipInput } from './tag-chip-input';

const sampleSuggestions = [
  'smoke',
  'regression',
  'critical-path',
  'login',
  'signup',
  'payment',
  'api',
  'ui',
  'performance',
];

const meta: Meta<typeof TagChipInput> = {
  title: 'Design System/TagChipInput',
  component: TagChipInput,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const TagChipInputTemplate = (args: React.ComponentProps<typeof TagChipInput>) => {
  const [tags, setTags] = useState<string[]>(args.value ?? []);
  return <TagChipInput {...args} value={tags} onChange={setTags} />;
};

export const Default: Story = {
  render: (args) => <TagChipInputTemplate {...args} />,
  args: {
    placeholder: '태그 입력 후 Enter',
    suggestions: sampleSuggestions,
  },
};

export const WithExistingTags: Story = {
  render: (args) => <TagChipInputTemplate {...args} />,
  args: {
    value: ['smoke', 'login'],
    suggestions: sampleSuggestions,
  },
};

export const MaxTags: Story = {
  render: (args) => <TagChipInputTemplate {...args} />,
  args: {
    value: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7', 'tag8', 'tag9', 'tag10'],
    maxTags: 10,
  },
};

export const Disabled: Story = {
  render: (args) => <TagChipInputTemplate {...args} />,
  args: {
    value: ['smoke', 'regression'],
    disabled: true,
  },
};
