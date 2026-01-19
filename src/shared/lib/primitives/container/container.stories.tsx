import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Container } from './container';

const meta: Meta<typeof Container> = {
  title: 'Primitive Components/Container',
  component: Container,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    asChild: {
      control: 'boolean',
      description: 'Slot 패턴을 사용하여 자식 요소에 props를 전달합니다.',
    },
    className: {
      control: 'text',
      description: '추가할 CSS 클래스명입니다.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const boxStyle: React.CSSProperties = {
  padding: '24px',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  border: '1px dashed #9ca3af',
};

export const Default: Story = {
  args: {
    children: '기본 Container 컴포넌트입니다.',
    style: boxStyle,
  },
};

export const Nested: Story = {
  render: () => (
    <Container style={{ ...boxStyle, backgroundColor: '#dbeafe' }}>
      <p style={{ marginBottom: '16px' }}>외부 Container</p>
      <Container style={{ ...boxStyle, backgroundColor: '#fef3c7' }}>
        <p style={{ marginBottom: '16px' }}>내부 Container</p>
        <Container style={{ ...boxStyle, backgroundColor: '#dcfce7' }}>
          최하위 Container
        </Container>
      </Container>
    </Container>
  ),
};

export const AsChild: Story = {
  render: () => (
    <Container asChild>
      <section style={{ ...boxStyle, backgroundColor: '#fce7f3' }}>
        asChild를 사용하면 Container가 section 태그로 렌더링됩니다.
      </section>
    </Container>
  ),
};
