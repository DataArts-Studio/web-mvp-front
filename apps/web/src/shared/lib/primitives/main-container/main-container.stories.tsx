import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MainContainer } from './main-container';

const meta: Meta<typeof MainContainer> = {
  title: 'Primitive Components/MainContainer',
  component: MainContainer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: '추가할 CSS 클래스명입니다.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
          메인 콘텐츠 영역
        </h1>
        <p style={{ color: '#6b7280' }}>
          MainContainer는 페이지의 주요 콘텐츠를 감싸는 시맨틱 컴포넌트입니다.
        </p>
      </div>
    ),
  },
};

export const WithStyling: Story = {
  args: {
    style: {
      backgroundColor: '#f9fafb',
      minHeight: '400px',
      padding: '32px',
    },
    children: (
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
          대시보드
        </h1>
        <p style={{ color: '#6b7280' }}>스타일이 적용된 MainContainer입니다.</p>
      </div>
    ),
  },
};
