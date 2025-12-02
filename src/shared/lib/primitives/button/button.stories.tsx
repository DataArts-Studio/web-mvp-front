import React from 'react';

import { Button, type ButtonProps } from '@/shared/lib/primitives/button/index';
import type { Meta, StoryObj } from '@storybook/react';
import { Check, Loader, Play } from 'lucide-react';

// ButtonProps에서 Storybook Controls에서 불필요한 속성을 제거
type ButtonOmittedProps = Omit<ButtonProps, 'className'>;

// ------------------------------------------------------------------
// Meta 정의
// ------------------------------------------------------------------
const meta: Meta<ButtonOmittedProps> = {
  title: 'Primitive Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // ------------------------------------------------------------------
    // 상태 관련 Props
    // ------------------------------------------------------------------
    loading: {
      control: 'boolean',
      description:
        '로딩 상태를 나타냅니다. `disabled`와 유사하게 동작하며 `aria-busy`를 설정합니다.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    pressed: {
      control: 'boolean',
      description: '토글 버튼처럼 현재 눌린 상태(`aria-pressed`)임을 나타냅니다.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: '버튼을 비활성화합니다. `loading` 상태일 때도 자동으로 비활성화됩니다.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    // ------------------------------------------------------------------
    // 렌더링 관련 Props
    // ------------------------------------------------------------------
    asChild: {
      control: 'boolean',
      description: '버튼을 렌더링하지 않고 하위 요소에 props와 동작을 전달합니다. (태그 변경)',
      table: {
        category: 'Rendering',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    // ------------------------------------------------------------------
    // HTML Props (Omitted 속성은 제외)
    // ------------------------------------------------------------------
    type: {
      control: 'radio',
      options: ['button', 'submit', 'reset'],
      description: 'HTML `type` 속성. `asChild`일 경우 무시됩니다.',
      table: {
        category: 'Attributes',
        type: { summary: 'string' },
        defaultValue: { summary: 'button' },
      },
    },
    onClick: {
      action: 'clicked',
      description: '버튼 클릭 시 호출되는 콜백 함수입니다.',
      table: {
        category: 'Events',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ------------------------------------------------------------------
// 2. Input 기본 스타일 (Tailwind 없이 인라인 스타일)
// ------------------------------------------------------------------

// 기본 스타일 정의
const baseButtonStyle: React.CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '0.5rem',
  fontSize: '1rem',
  fontWeight: '600',
  lineHeight: '1.5rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease-in-out',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: 'none',
};

// 동적 스타일 결정 함수
const getDynamicButtonStyle = (
  isDisabled: boolean | undefined,
  isLoading: boolean | undefined,
  isPressed: boolean | undefined
): React.CSSProperties => {
  let backgroundColor = '#2563eb'; // blue-600 (기본)
  let color = '#fff';
  let opacity = 1;
  let cursor = 'pointer';

  // 1. Pressed 상태 (Pressed는 Disabled/Loading과 분리하여 스타일링 가능)
  if (isPressed) {
    backgroundColor = '#1d4ed8'; // blue-700
  }

  // 2. Disabled 또는 Loading 상태
  if (isDisabled || isLoading) {
    backgroundColor = '#9ca3af'; // gray-400
    cursor = 'not-allowed';
  } else if (!isPressed) {
    // Hover 효과 시뮬레이션
    backgroundColor = '#1e40af'; // blue-800
  }

  return {
    ...baseButtonStyle,
    backgroundColor: backgroundColor,
    color: color,
    opacity: opacity,
    cursor: cursor,
  };
};

// ------------------------------------------------------------------
// Stories 정의
// ------------------------------------------------------------------

// Primary (기본 버튼)
export const Primary: Story = {
  args: {
  },
  render: (args) => {
    const isDisabled = args.disabled || args.loading;
    const dynamicStyle = getDynamicButtonStyle(isDisabled, args.loading, args.pressed);

    return (
      <Button {...args} style={dynamicStyle}>
        버튼 액션
      </Button>
    );
  },
};

// Loading (로딩 상태)
export const Loading: Story = {
  args: {
    loading: true,
    children: '처리 중...',
  },
  render: (args) => {
    const dynamicStyle = getDynamicButtonStyle(true, args.loading, args.pressed);

    return (
      <Button {...args} style={dynamicStyle}>
        <Loader
          size={20}
          className="animate-spin"
          style={{ animation: 'spin 1s linear infinite' }}
        />
        {args.children}
      </Button>
    );
  },
};

// 3.3. Disabled (비활성화 상태)
export const Disabled: Story = {
  args: {
    disabled: true, // 비활성화 상태 활성화
    children: '사용 불가',
  },
  render: Primary.render,
};

// 3.4. Pressed (눌린 상태 - 토글 버튼)
export const Pressed: Story = {
  args: {
    pressed: true, // 눌린 상태 활성화
    children: '활성화됨',
  },
  render: Primary.render,
};

// 3.5. With Icon (아이콘과 함께 사용)
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Play size={20} />
        게임 시작
      </>
    ),
  },
  render: Primary.render,
};

// 3.6. Custom Element as Link (asChild를 이용한 태그 변경)
export const AsLink: Story = {
  args: {
    asChild: true, // a 태그로 렌더링
  },
  render: (args) => {
    const dynamicStyle = getDynamicButtonStyle(false, args.loading, args.pressed);

    // asChild가 true이면 Button 컴포넌트가 props를 하위 요소에 전달합니다.
    return (
      <Button {...args} asChild>
        <a
          href="#link"
          style={{
            ...dynamicStyle,
            textDecoration: 'none',
            // a 태그는 inline-flex를 직접 정의해야 합니다.
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            e.preventDefault();
            args.onClick?.(e as any);
          }} // preventDefault로 스토리북에서 이동 방지
        >
          <Check size={20} />
          외부 링크로 렌더링
        </a>
      </Button>
    );
  },
};
