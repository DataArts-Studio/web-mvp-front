import React from 'react';

import { Input, type InputProps } from '@/shared/lib/primitives/input/index';
import type { Meta, StoryObj } from '@storybook/react';

// children은 input에 없고, ref, onFocus, onBlur는 내부에서 처리
type InputOmittedProps = Omit<
  InputProps,
  'ref' | 'onFocus' | 'onBlur' | 'children' | 'className'
>;

// ------------------------------------------------------------------
// Meta 정의
// ------------------------------------------------------------------
const meta: Meta<InputOmittedProps> = {
  title: 'Primitive Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // ------------------------------------------------------------------
    // Input 상태 관련 Props
    // ------------------------------------------------------------------
    invalid: {
      control: 'boolean',
      description: '입력 필드가 유효하지 않은 상태임을 나타냅니다.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: '입력 필드를 비활성화하여 사용자 상호작용을 막습니다.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    // ------------------------------------------------------------------
    // Input 기본 HTML 속성 (주로 사용되는 것들)
    // ------------------------------------------------------------------
    type: {
      control: 'radio',
      options: ['text', 'email', 'password', 'number', 'search', 'url', 'tel'],
      description: 'Input 필드의 타입입니다.',
      table: {
        category: 'Attributes',
        type: { summary: 'string' },
        defaultValue: { summary: 'text' },
      },
    },
    placeholder: {
      control: 'text',
      description: '입력 필드가 비어있을 때 표시되는 힌트 텍스트입니다.',
      table: {
        category: 'Attributes',
        type: { summary: 'string' },
      },
    },
    value: {
      control: 'text',
      description: 'Input 필드의 현재 값입니다 (제어 컴포넌트).',
      table: {
        category: 'Control',
        type: { summary: 'string' },
      },
      // defaultValue가 있을 때 value는 제외
      if: { arg: 'defaultValue', eq: undefined },
    },
    defaultValue: {
      control: 'text',
      description: 'Input 필드의 초기 값입니다 (비제어 컴포넌트).',
      table: {
        category: 'Control',
        type: { summary: 'string' },
      },
      // value가 있을 때 defaultValue는 제외
      if: { arg: 'value', eq: undefined },
    },
    // ------------------------------------------------------------------
    // 이벤트 핸들러 (argTypes에서 action으로 쉽게 추적 가능)
    // ------------------------------------------------------------------
    onChange: {
      action: 'changed',
      description: 'Input 값이 변경될 때 호출되는 콜백 함수입니다.',
      table: {
        category: 'Events',
        type: { summary: '(e: React.ChangeEvent<HTMLInputElement>) => void' },
      },
    },
    // ------------------------------------------------------------------
    // 기타 HTML Input 속성 (필요에 따라 추가/변경)
    // ------------------------------------------------------------------
    name: {
      control: 'text',
      description: '폼 제출 시 Input을 식별하는 이름입니다.',
      table: {
        category: 'Attributes',
        type: { summary: 'string' },
      },
    },
    // min, max, step 등 숫자 타입에 필요한 속성들도 추가 가능
    // pattern, minLength, maxLength 등 텍스트 타입에 필요한 속성들도 추가 가능
    // required: { control: 'boolean', ... }
    // readOnly: { control: 'boolean', ... }

    // ------------------------------------------------------------------
    // Omitted Props (Controls에서 숨겨진 것들)
    // ------------------------------------------------------------------
    // ref: { table: { disable: true } },
    // onFocus: { table: { disable: true } },
    // onBlur: { table: { disable: true } },
    // 스타일은 주로 테마나 직접적인 style prop으로 관리
    // className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ------------------------------------------------------------------
// Input 기본 스타일 (Tailwind 없이 인라인 스타일)
// ------------------------------------------------------------------
const baseInputStyle: React.CSSProperties = {
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  border: '1px solid #d1d5db', // gray-300
  fontSize: '1rem',
  lineHeight: '1.5rem',
  outline: 'none',
  transition: 'border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out',
  width: '300px',
  boxSizing: 'border-box',
};

// 동적 스타일 결정 함수
const getDynamicInputStyle = (
  isInvalid: boolean | undefined,
  isDisabled: boolean | undefined,
  isFocused: boolean
): React.CSSProperties => {
  let borderColor = '#d1d5db';
  let boxShadow = 'none';
  let backgroundColor = '#fff';
  let cursor = 'auto';

  if (isDisabled) {
    borderColor = '#e5e7eb';
    backgroundColor = '#f3f4f6';
    cursor = 'not-allowed';
  } else if (isInvalid) {
    borderColor = '#ef4444';
    boxShadow = '0 0 0 2px rgba(239, 68, 68, 0.2)';
  } else if (isFocused) {
    borderColor = '#2563eb';
    boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.2)';
  }

  return {
    ...baseInputStyle,
    borderColor: borderColor,
    boxShadow: boxShadow,
    backgroundColor: backgroundColor,
    cursor: cursor,
  };
};

// ------------------------------------------------------------------
// Stories 정의
// ------------------------------------------------------------------

// Basic Input
export const Default: Story = {
  args: {
    placeholder: '텍스트를 입력하세요',
    type: 'text',
    invalid: false,
    disabled: false,
  },
  render: (args) => {
    // Focused 상태를 Storybook Controls에서 직접 조작할 수 없으므로,
    // 이 예시에서는 React.useState를 사용하여 내부적으로 관리합니다.
    // 실제 컴포넌트 내부의 focused 상태는 Input 컴포넌트가 처리합니다.
    const [focused, setFocused] = React.useState(false);
    const dynamicStyle = getDynamicInputStyle(args.invalid, args.disabled, focused);

    return (
      <Input
        {...args}
        style={dynamicStyle}
        /*onFocus={(e) => {
          setFocused(true);
          args.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          args.onBlur?.(e);
        }}*/
      />
    );
  },
};

// Input with Placeholder
export const WithPlaceholder: Story = {
  args: {
    placeholder: '여기에 이름을 입력해주세요',
    type: 'text',
  },
  render: Default.render,
};

// Invalid Input (유효하지 않은 상태)
export const Invalid: Story = {
  args: {
    placeholder: '이메일 형식이 아닙니다',
    type: 'email',
    invalid: true,
  },
  render: Default.render,
};

//  Disabled Input (비활성화 상태)
export const Disabled: Story = {
  args: {
    defaultValue: '이 필드는 비활성화되었습니다',
    disabled: true,
  },
  render: Default.render,
};

// Password Input
export const Password: Story = {
  args: {
    placeholder: '비밀번호를 입력하세요',
    type: 'password',
  },
  render: Default.render,
};

// Number Input
export const Number: Story = {
  args: {
    placeholder: '숫자를 입력하세요',
    type: 'number',
    defaultValue: '123',
  },
  render: Default.render,
};

// Controlled Input (제어 컴포넌트)
export const Controlled: Story = {
  render: () => {
    const [value, setValue] = React.useState('초기값');
    const [focused, setFocused] = React.useState(false);
    const dynamicStyle = getDynamicInputStyle(false, false, focused);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="값을 입력하고 변경해보세요"
          style={dynamicStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <p style={{ fontSize: '0.9rem', color: '#4b5563' }}>현재 값: {value}</p>
      </div>
    );
  },
  parameters: {
    controls: {
      exclude: ['invalid', 'disabled', 'type', 'placeholder', 'value', 'defaultValue', 'onChange'],
    },
  },
};

// 3.8. With Label (접근성을 위한 Label과 함께 사용)
export const WithLabel: Story = {
  render: () => {
    const [focused, setFocused] = React.useState(false);
    const dynamicStyle = getDynamicInputStyle(false, false, focused);
    const inputId = React.useId(); // 고유 ID 생성

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '300px' }}>
        <label
          htmlFor={inputId}
          style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#374151' }}
        >
          사용자 이름
        </label>
        <Input
          id={inputId} // label과 연결
          placeholder="사용자 이름을 입력하세요"
          style={dynamicStyle}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>
    );
  },
  parameters: {
    controls: {
      exclude: ['invalid', 'disabled', 'type', 'placeholder', 'value', 'defaultValue', 'onChange'],
    },
  },
};
