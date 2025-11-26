import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Check, Minus } from 'lucide-react';

import {
  Checkbox,
  type CheckboxRootProps,
  type CheckedState,
} from '@/shared/ui/checkbox';

// Checkbox.Root의 Props 타입에서 불필요한 속성을 제거
type CheckboxRootOmittedProps = Omit<
  CheckboxRootProps,
  'children' | 'className' | 'name' | 'value' | 'required' | 'id'
>;

// ------------------------------------------------------------------
// Meta 정의
// ------------------------------------------------------------------
const meta: Meta<CheckboxRootOmittedProps> = {
  title: 'Primitive Components/Checkbox',
  component: Checkbox.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // ------------------------------------------------------------------
    // 제어 속성 (Controlled Props)
    // ------------------------------------------------------------------
    checked: {
      control: 'radio',
      options: [true, false, 'indeterminate'],
      description: '체크박스의 현재 상태 (`true`, `false`, 또는 `indeterminate` (부분 선택)).',
      table: {
        category: 'Control',
        type: { summary: 'boolean | "indeterminate"' },
      },
      // defaultChecked가 정의되지 않은 경우에만 표시
      if: { arg: 'defaultChecked', eq: undefined },
    },
    // ------------------------------------------------------------------
    // 비제어 속성 (Uncontrolled Props)
    // ------------------------------------------------------------------
    defaultChecked: {
      control: 'boolean',
      description: '초기 체크 상태입니다.',
      table: {
        category: 'Control',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
      // checked가 정의되지 않은 경우에만 표시
      if: { arg: 'checked', eq: undefined },
    },
    // ------------------------------------------------------------------
    // 이벤트 핸들러
    // ------------------------------------------------------------------
    onCheckedChange: {
      action: 'checked change',
      description: '체크 상태가 변경될 때 호출되는 콜백 함수입니다.',
      table: {
        category: 'Events',
        type: { summary: '(checked: boolean | "indeterminate") => void' },
      },
    },
    // ------------------------------------------------------------------
    // 상태 속성
    // ------------------------------------------------------------------
    disabled: {
      control: 'boolean',
      description: '체크박스를 비활성화합니다.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    // ------------------------------------------------------------------
    // 기타 속성 (Storybook에서 불필요하거나 자동으로 처리되는 속성)
    // name, value, required등 input 관련 prop은 Controls 패널에서 숨깁니다.
    // 필요에 따라 'text' control로 변경하여 테스트할 수 있습니다.
    // ------------------------------------------------------------------
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// ------------------------------------------------------------------
// 상수 및 아이콘 정의
// ------------------------------------------------------------------
const CHECKED_COLOR = '#10b981';
const INDETERMINATE_COLOR = '#3b82f6';
const DEFAULT_BORDER_COLOR = '#9ca3af';

const IndicatorIcon: React.FC<{ state: CheckedState }> = ({ state }) => {
  if (state === 'indeterminate') {
    return <Minus size={16} color="#fff" />;
  }
  if (state === true) {
    return <Check size={16} color="#fff" />;
  }
  return null;
};

// ------------------------------------------------------------------
// 동적 스타일 계산 함수
// ------------------------------------------------------------------
interface DynamicStyles {
  rootStyle: React.CSSProperties;
  indicatorStyle: React.CSSProperties;
}

const getDynamicStyles = (currentState: CheckedState, isDisabled: boolean): DynamicStyles => {
  let currentBorderColor = DEFAULT_BORDER_COLOR;
  let currentBackgroundColor = '#fff';
  let currentOpacity = 1;
  let currentCursor = 'pointer';

  // 상태에 따른 색상 결정
  if (currentState === true) {
    currentBorderColor = CHECKED_COLOR;
    currentBackgroundColor = CHECKED_COLOR;
  } else if (currentState === 'indeterminate') {
    currentBorderColor = INDETERMINATE_COLOR;
    currentBackgroundColor = INDETERMINATE_COLOR;
  }

  // 비활성화 상태 처리
  if (isDisabled) {
    currentOpacity = 0.6;
    currentCursor = 'not-allowed';
    currentBorderColor = DEFAULT_BORDER_COLOR; // 비활성화 시 테두리 색상 고정
    if (currentState === true || currentState === 'indeterminate') {
        currentBackgroundColor = '#e5e7eb'; // 비활성화 시 배경색 흐리게
    }
  }

  const rootStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    cursor: currentCursor,
    opacity: currentOpacity,
    userSelect: 'none',
  };

  const indicatorStyle: React.CSSProperties = {
    width: '20px',
    height: '20px',
    border: `1px solid ${currentBorderColor}`,
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: currentBackgroundColor,
    transition: 'all 0.1s ease',
  };

  return { rootStyle, indicatorStyle };
};

// ------------------------------------------------------------------
// Stories 정의
// ------------------------------------------------------------------

// Basic (비제어 컴포넌트)
export const Basic: Story = {
  args: {
    defaultChecked: false, // 기본적으로 체크되지 않은 상태
    disabled: false,
  },
  render: (args) => {
    // props로 전달된 상태를 CheckedState로 보장합니다.
    const state = (args.checked ?? args.defaultChecked ?? false) as CheckedState;
    const { rootStyle, indicatorStyle } = getDynamicStyles(state, args.disabled!);

    return (
      <Checkbox.Root {...args} style={rootStyle}>
        <span style={indicatorStyle}>
          <Checkbox.Indicator>
            {/* IndicatorIcon에 보장된 상태 타입 전달 */}
            <IndicatorIcon state={state} />
          </Checkbox.Indicator>
        </span>
        <span>기본 체크박스</span>
      </Checkbox.Root>
    );
  },
};

// Checked (초기 체크 상태)
export const CheckedByDefault: Story = {
  args: {
    defaultChecked: true,
    disabled: false,
  },
  render: Basic.render,
};

// Indeterminate (부분 선택 상태, 제어 컴포넌트)
export const Indeterminate: Story = {
  render: () => {
    const [state, setState] = React.useState<CheckedState>('indeterminate');
    const disabled = false;

    // Indeterminate 스토리의 동적 스타일 계산
    const { rootStyle, indicatorStyle } = getDynamicStyles(state, disabled);

    return (
      <Checkbox.Root
        checked={state}
        onCheckedChange={(next) => {
          // Indeterminate 상태에서 클릭하면 true로 전환
          setState(state === 'indeterminate' ? true : next);
        }}
        style={rootStyle}
        disabled={disabled}
      >
        <span style={indicatorStyle}>
          <Checkbox.Indicator>
            {/* IndicatorIcon에 상태 전달 */}
            <IndicatorIcon state={state} />
          </Checkbox.Indicator>
        </span>
        <span>일부 항목 선택됨</span>
      </Checkbox.Root>
    );
  },
  // Controls 패널에서 defaultChecked/checked를 숨깁니다.
  parameters: {
    controls: { exclude: ['checked', 'defaultChecked', 'disabled'] },
  },
};

// Disabled (비활성화 상태)
export const Disabled: Story = {
  args: {
    defaultChecked: true,
    disabled: true, // 비활성화
  },
  render: Basic.render,
};

// Controlled (제어 컴포넌트)
export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = React.useState<CheckedState>(false);
    const disabled = false;

    const { rootStyle, indicatorStyle } = getDynamicStyles(checked, disabled);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <Checkbox.Root
          checked={checked}
          onCheckedChange={setChecked}
          style={rootStyle}
          disabled={disabled}
        >
          <span style={indicatorStyle}>
            <Checkbox.Indicator>
              <IndicatorIcon state={checked} />
            </Checkbox.Indicator>
          </span>
          <span>전체 선택 (현재 상태: {checked === true ? 'Checked' : checked === 'indeterminate' ? 'Indeterminate' : 'Unchecked'})</span>
        </Checkbox.Root>
        <p style={{marginTop: '10px'}}>
            <button onClick={() => setChecked(prev => !prev)} style={{padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px'}}>외부에서 상태 토글</button>
            <button onClick={() => setChecked('indeterminate')} style={{padding: '5px 10px', border: '1px solid #ccc', borderRadius: '4px', marginLeft: '10px'}}>부분 선택 설정</button>
        </p>
      </div>
    );
  },

  // Controls 패널에서 모든 control prop을 숨깁니다.
  parameters: {
    controls: { exclude: ['checked', 'defaultChecked', 'onCheckedChange', 'disabled'] },
  },
};