import React from 'react';
import { Truck, Cloud, Home } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react';

import { Select } from '@/shared/ui/select';

const meta: Meta<typeof Select.Root> = {
  title: 'Primitive Components/Select',
  component: Select.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // ------------------------------------------------------------------
    // 제어 속성 (Controlled Props)
    // ------------------------------------------------------------------
    value: {
      control: 'text',
      description: '제어되는 Select의 현재 선택 값입니다.',
      table: {
        category: 'Control',
        type: { summary: 'string' },
      },
      // defaultValue가 정의되지 않은 경우에만 표시 (Controlled)
      if: { arg: 'defaultValue', eq: undefined },
    },
    // ------------------------------------------------------------------
    // 비제어 속성 (Uncontrolled Props)
    // ------------------------------------------------------------------
    defaultValue: {
      control: 'text',
      description: '초기 선택 값입니다. `value`가 없을 때 사용됩니다.',
      table: {
        category: 'Control',
        type: { summary: 'string' },
      },
      // value가 정의되지 않은 경우에만 표시 (Uncontrolled)
      if: { arg: 'value', eq: undefined },
    },
    // ------------------------------------------------------------------
    // 이벤트 핸들러
    // ------------------------------------------------------------------
    onValueChange: {
      action: 'value changed',
      description: '선택 값이 변경될 때 호출되는 콜백 함수입니다.',
      table: {
        category: 'Events',
        type: { summary: '(value: string) => void' },
      },
    },
    // ------------------------------------------------------------------
    // 상태 속성
    // ------------------------------------------------------------------
    disabled: {
      control: 'boolean',
      description: 'Select 컴포넌트 전체를 비활성화합니다.',
      table: {
        category: 'State',
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    // ------------------------------------------------------------------
    // 기타 속성 (Storybook에서 불필요하거나 자동으로 처리되는 속성)
    // ------------------------------------------------------------------
    children: { table: { disable: true } },
    className: { table: { disable: true } },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const triggerStyle: React.CSSProperties = {
  minWidth: 200,
  padding: '0.5rem 0.75rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  background: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
  cursor: 'pointer',
};

const contentStyle: React.CSSProperties = {
  marginTop: '0.35rem',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  background: '#fff',
  padding: '0.25rem',
  display: 'grid',
  gap: '0.25rem',
  width: '100%',
  maxWidth: 260,
};

const itemStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '0.375rem',
  cursor: 'pointer',
};

const iconItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.5rem 0.75rem',
  borderRadius: '0.375rem',
  cursor: 'pointer',
};

const renderItems = (items: { value: string; label: string }[]) =>
  items.map((item) => (
    <Select.Item
      key={item.value}
      value={item.value}
      style={{
        ...itemStyle,
        background: 'var(--hover-bg, #f9fafb)',
      }}
      onMouseEnter={(event) => event.currentTarget.style.setProperty('--hover-bg', '#f3f4f6')}
      onMouseLeave={(event) => event.currentTarget.style.setProperty('--hover-bg', '#f9fafb')}
    >
      {item.label}
    </Select.Item>
  ));

export const Basic: Story = {
  args: {
    // Storybook Controls에서 이 값을 수정할 수 있습니다.
    defaultValue: 'apple',
  },
  render: () => (
    <Select.Root defaultValue="apple" style={{ width: 260 }}>
      <Select.Trigger style={triggerStyle}>
        <Select.Value placeholder="선택하세요" />
        <span aria-hidden>▾</span>
      </Select.Trigger>
      <Select.Content style={contentStyle}>
        {renderItems([
          { value: 'apple', label: '사과' },
          { value: 'orange', label: '오렌지' },
          { value: 'banana', label: '바나나' },
        ])}
      </Select.Content>
    </Select.Root>
  ),
};

const renderIconItems = () => (
  <>
    <Select.Item value="home" style={iconItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
      <Home size={16} />
      <span>홈 (기본)</span>
    </Select.Item>
    <Select.Item value="delivery" style={iconItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
      <Truck size={16} color="#ef4444"/>
      <span>배송 중</span>
    </Select.Item>
    <Select.Item value="cloud" style={iconItemStyle} onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
      <Cloud size={16} color="#3b82f6"/>
      <span>클라우드 동기화</span>
    </Select.Item>
  </>
);

export const SelectWithIconItems: Story = {
  args: {
    defaultValue: 'home',
  },
  render: (args) => (
    <Select.Root {...args} style={{ width: 300 }}>
      <Select.Trigger style={triggerStyle}>
        <Select.Value placeholder="상태를 선택하세요" />
        <span aria-hidden>▾</span>
      </Select.Trigger>
      <Select.Content style={{ ...contentStyle, padding: '0.25rem' }}>
        {renderIconItems()}
      </Select.Content>
    </Select.Root>
  ),
};

export const ControlledWithCustomTrigger: Story = {
  render: () => {
    const [value, setValue] = React.useState('mon');
    return (
      <Select.Root value={value} onValueChange={setValue} style={{ width: 280 }}>
        <Select.Trigger asChild style={{ ...triggerStyle, background: '#f9fafb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '999px', background: '#34d399' }} />
            <Select.Value placeholder="요일 선택" />
          </div>
          <span aria-hidden>⌄</span>
        </Select.Trigger>
        <Select.Content style={contentStyle}>
          {renderItems([
            { value: 'mon', label: '월요일' },
            { value: 'tue', label: '화요일' },
            { value: 'wed', label: '수요일' },
          ])}
        </Select.Content>
        <p style={{ marginTop: '0.75rem', color: '#4b5563' }}>선택한 값: {value}</p>
      </Select.Root>
    );
  },
};

export const DisabledSelect: Story = {
  args: {
    defaultValue: 'orange',
    disabled: true,
  },
  render: (args) => (
    <Select.Root {...args} style={{ width: 260 }}>
      <Select.Trigger style={triggerStyle}>
        <Select.Value placeholder="선택하세요" />
        <span aria-hidden>▾</span>
      </Select.Trigger>
      <Select.Content style={contentStyle}>
        {renderItems([
          { value: 'apple', label: '사과' },
          { value: 'orange', label: '오렌지' },
          { value: 'banana', label: '바나나' },
        ])}
      </Select.Content>
    </Select.Root>
  ),
};

const renderItemsWithDisabled = (items: { value: string; label: string; disabled?: boolean }[]) =>
  items.map((item) => (
    <Select.Item
      key={item.value}
      value={item.value}
      disabled={item.disabled}
      style={{
        ...itemStyle,
        // 비활성화된 아이템에 대한 스타일 조정 (옵션)
        color: item.disabled ? '#9ca3af' : 'inherit',
        cursor: item.disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={(event) =>
        !item.disabled && event.currentTarget.style.setProperty('--hover-bg', '#f3f4f6')
      }
      onMouseLeave={(event) =>
        !item.disabled && event.currentTarget.style.setProperty('--hover-bg', '#f9fafb')
      }
    >
      {item.label}
    </Select.Item>
  ));

export const SelectWithDisabledItem: Story = {
  args: {
    defaultValue: 'orange',
  },
  render: (args) => (
    <Select.Root {...args} style={{ width: 260 }}>
      <Select.Trigger style={triggerStyle}>
        <Select.Value placeholder="선택하세요" />
        <span aria-hidden>▾</span>
      </Select.Trigger>
      <Select.Content style={contentStyle}>
        {renderItemsWithDisabled([
          { value: 'apple', label: '사과' },
          { value: 'orange', label: '오렌지', disabled: true },
          { value: 'banana', label: '바나나' },
        ])}
      </Select.Content>
    </Select.Root>
  ),
};