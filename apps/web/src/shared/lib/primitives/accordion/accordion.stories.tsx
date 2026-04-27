import React from 'react';

import { Accordion, AccordionRootProps } from '@/shared/lib/primitives/accordion/index';
import { ensureArray } from '@/shared/utils';
import type { Meta, StoryObj } from '@storybook/react';

// Storybook 메타데이터
const meta: Meta<typeof Accordion.Root> = {
  title: 'Primitive Components/Accordion',
  component: Accordion.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'radio',
      options: ['single', 'multiple'],
      description: '아코디언의 동작 방식 (하나만 열림 vs 여러 개 열림)',
    },
    defaultValue: {
      control: 'text',
      description: '초기 열려있을 아이템의 value (쉼표로 구분)',
      if: { arg: 'value', eq: undefined },
    },
    value: {
      control: 'text',
      description: '제어되는 아코디언의 현재 열린 아이템 value',
      if: { arg: 'defaultValue', eq: undefined },
    },
    onValueChange: {
      action: 'value changed',
      description: '아코디언의 열린 값 변경 시 호출되는 콜백',
    },
    collapsible: {
      control: 'boolean',
      description: 'type이 single일 때 열린 항목을 다시 클릭하여 닫을 수 있는지 여부',
      if: { arg: 'type', eq: 'single' },
    },
    children: { table: { disable: true } },
  },
};

export default meta;

type Story = StoryObj<typeof Accordion.Root>;

interface AccordionStoryProps extends AccordionRootProps {
  disabledItems?: string[];
}

const AccordionTemplate = (args: AccordionStoryProps) => {
  const parsedDefaultValue =
    typeof args.defaultValue === 'string'
      ? ensureArray(
          args.defaultValue
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      : args.defaultValue;

  const parsedValue =
    typeof args.value === 'string'
      ? ensureArray(
          args.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        )
      : args.value;

  return (
    <Accordion.Root
      {...args}
      defaultValue={parsedDefaultValue}
      value={parsedValue}
      style={{ width: 'clamp(300px, 80vw, 600px)', border: '1px solid #ccc', borderRadius: '8px' }}
    >
      <Accordion.Item value="item-1">
        <Accordion.Header>
          <Accordion.Trigger
            style={{
              padding: '15px',
              width: '100%',
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #eee',
            }}
          >
            섹션 1
            <span
              style={{
                transform: args.value?.includes('item-1') ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              ▼
            </span>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          첫 번째 섹션의 내용입니다. 여기에 더 많은 정보가 있습니다.
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="item-2" disabled={args.disabledItems?.includes('item-2')}>
        <Accordion.Header>
          <Accordion.Trigger
            style={{
              padding: '15px',
              width: '100%',
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #eee',
            }}
          >
            섹션 2
            <span
              style={{
                transform: args.value?.includes('item-2') ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              ▼
            </span>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          두 번째 섹션의 내용입니다. 이 섹션은 필요에 따라 비활성화될 수 있습니다.
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="item-3">
        <Accordion.Header>
          <Accordion.Trigger
            style={{
              padding: '15px',
              width: '100%',
              textAlign: 'left',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            섹션 3
            <span
              style={{
                transform: args.value?.includes('item-3') ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              ▼
            </span>
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Content style={{ padding: '15px' }}>
          세 번째 섹션의 내용입니다. 여기에도 중요한 정보가 포함될 수 있습니다.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  );
};

// 기본 아코디언 (multiple, 비제어)
export const Default: Story = {
  args: {
    type: 'multiple',
    defaultValue: 'item-1',
    collapsible: false,
  },
  render: AccordionTemplate,
};

// Single 타입 아코디언 (하나만 열림)
export const Single: Story = {
  args: {
    type: 'single',
    defaultValue: 'item-1',
    collapsible: false,
  },
  render: AccordionTemplate,
};

// Single & Collapsible 아코디언 (하나만 열리고, 다시 누르면 닫힘)
export const SingleCollapsible: Story = {
  args: {
    type: 'single',
    defaultValue: 'item-1',
    collapsible: true,
  },
  render: AccordionTemplate,
};

// 제어되는 아코디언 (value prop으로 외부에서 제어)
export const Controlled: Story = {
  args: {
    type: 'multiple',
    value: 'item-1, item-3',
  },
  render: AccordionTemplate,
};

// 비활성화된 아이템 포함 (multiple, 비제어)
export const WithDisabledItem: Story = {
  args: {
    type: 'multiple',
    defaultValue: 'item-1',
    disabledItems: ['item-2'],
  } as AccordionRootProps & { disabledItems?: string[] },
  render: (args) => {
    return AccordionTemplate(args);
  },
};
