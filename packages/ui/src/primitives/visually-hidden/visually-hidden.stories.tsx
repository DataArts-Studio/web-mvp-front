import React from 'react';
import {
  VisuallyHidden,
  type VisuallyHiddenProps,
} from './index';
import type { Meta, StoryObj } from '@storybook/react';

// ------------------------------------------------------------------
// 타입 정의 및 Meta 정의
// ------------------------------------------------------------------

// Storybook Controls에 노출할 VisuallyHidden의 Props를 정의합니다.
// children은 필수이지만 Controls에서 변경할 수 있도록 합니다.
type VisuallyHiddenRootProps = Omit<VisuallyHiddenProps, 'ref'> & {
  content: string; // children 대신 사용할 스토리북 전용 prop
};

const meta: Meta<VisuallyHiddenRootProps> = {
  title: 'Primitive Components/VisuallyHidden',
  component: VisuallyHidden,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: '시각적으로 숨겨질 내용입니다. 스크린 리더에서만 읽힙니다.',
      table: {
        category: 'Content',
        type: { summary: 'string' },
      },
    },
    element: {
      control: 'select',
      options: ['span', 'div', 'p', 'button'],
      description: '숨겨진 내용을 렌더링할 HTML 태그입니다.',
      table: {
        category: 'Configuration',
        type: { summary: 'keyof HTMLElementTagNameMap' },
        defaultValue: { summary: 'span' },
      },
    },
    // 나머지 HTML 속성 (style은 styles prop과 겹치므로 제외)
    id: { control: 'text', table: { category: 'HTML Attributes' } },
  },
  args: {
    content: '이 내용은 시각적으로 숨겨져 있으며, 스크린 리더 사용자만 접근할 수 있습니다.',
    element: 'span',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ------------------------------------------------------------------
// Stories 정의
// ------------------------------------------------------------------

/**
 * 컴포넌트의 기본 사용법과 목적을 보여줍니다.
 * (실제 페이지에서는 숨겨지지만, 접근성 도구에서 읽히는 텍스트)
 */
export const Default: Story = {
  render: ({ content, ...args }) => {
    return (
      <div
        style={{
          border: '1px solid #ccc',
          padding: '20px',
          width: '400px',
          textAlign: 'center',
          position: 'relative',
        }}
      >
        <p>이것은 시각적으로 보이는 텍스트입니다.</p>

        {/* VisuallyHidden 컴포넌트 사용 */}
        <VisuallyHidden {...args}>{content}</VisuallyHidden>

        <p style={{ marginTop: '10px' }}>
          (위의 숨겨진 텍스트는 **Controls** 패널에서 `content`를 변경하여 스크린 리더 작동 여부를
          테스트할 수 있습니다.)
        </p>
      </div>
    );
  },
};

/**
 * 디버깅 모드 (Debug Mode)
 * - VisuallyHidden 컴포넌트의 스타일을 일시적으로 비활성화하여
 * 숨겨진 텍스트가 실제로 DOM에 존재하는지 시각적으로 확인합니다.
 */
export const DebugMode: Story = {
  args: {
    content: '디버그 모드: 이 텍스트는 일반적으로 숨겨져야 합니다.',
    element: 'div',
  },
  render: ({ content, ...args }) => {
    // Note: 스토리북 테스트를 위해 visuallyHiddenStyles를 임시로 오버라이드합니다.
    const debugStyle: React.CSSProperties = {
      position: 'static',
      width: 'auto',
      height: 'auto',
      margin: '10px 0',
      overflow: 'visible',
      clip: 'auto',
      clipPath: 'none',
      whiteSpace: 'normal',
      border: '1px dashed red',
      padding: '5px',
    };

    return (
      <div style={{ border: '1px solid #ccc', padding: '20px', width: '400px' }}>
        <p style={{ fontWeight: 'bold', color: 'red' }}>
          디버그 모드 활성화: 숨겨진 요소가 표시됩니다.
        </p>

        {/* 스타일을 오버라이드하여 텍스트를 보이게 함 */}
        <VisuallyHidden {...args} style={debugStyle}>
          {content}
        </VisuallyHidden>

        <p>이 텍스트는 숨겨지지 않은 상태의 텍스트입니다.</p>
      </div>
    );
  },
};

/**
 * 버튼 레이블로 사용 (Element: span)
 * - 아이콘만 있는 버튼에 스크린 리더용 텍스트를 추가하는 일반적인 사용 사례입니다.
 */
export const UsedAsButtonLabel: Story = {
  args: {
    content: '장바구니에 아이템 추가',
    element: 'span',
  },
  render: ({ content, ...args }) => (
    <button
      style={{
        padding: '8px 12px',
        backgroundColor: '#3b82f6',
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {/* 🛒 아이콘 가정 (이모지로 대체) */}
      🛒
      <VisuallyHidden {...args}>{content}</VisuallyHidden>
    </button>
  ),
};
