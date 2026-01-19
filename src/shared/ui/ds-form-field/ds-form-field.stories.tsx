import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DsFormField } from './ds-form-field';
import { DsInput } from '../ds-input/ds-input';

const meta: Meta<typeof DsFormField.Root> = {
  title: 'Design System/DSFormField',
  component: DsFormField.Root,
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

export const Default: Story = {
  render: () => (
    <DsFormField.Root>
      <DsFormField.Label>이메일</DsFormField.Label>
      <DsFormField.Control>
        <DsInput placeholder="이메일을 입력하세요" />
      </DsFormField.Control>
    </DsFormField.Root>
  ),
};

export const WithError: Story = {
  render: () => (
    <DsFormField.Root error={{ message: '올바른 이메일 형식이 아닙니다.' }}>
      <DsFormField.Label>이메일</DsFormField.Label>
      <DsFormField.Control>
        <DsInput variant="error" placeholder="이메일을 입력하세요" />
      </DsFormField.Control>
      <DsFormField.Message>올바른 이메일 형식이 아닙니다.</DsFormField.Message>
    </DsFormField.Root>
  ),
};

export const WithSrOnlyLabel: Story = {
  render: () => (
    <DsFormField.Root>
      <DsFormField.Label srOnly>검색</DsFormField.Label>
      <DsFormField.Control>
        <DsInput placeholder="검색어를 입력하세요" />
      </DsFormField.Control>
    </DsFormField.Root>
  ),
};
