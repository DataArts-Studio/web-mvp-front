import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './grid';

const meta: Meta<typeof Grid.Root> = {
  title: 'Primitive Components/Grid',
  component: Grid.Root,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const columnStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#dbeafe',
  borderRadius: '4px',
  textAlign: 'center',
  fontSize: '14px',
  fontWeight: 500,
};

export const Default: Story = {
  render: () => (
    <Grid.Root style={{ padding: '24px' }}>
      <Grid.Container>
        {Array.from({ length: 12 }).map((_, i) => (
          <Grid.Column key={i} span={1}>
            <div style={columnStyle}>{i + 1}</div>
          </Grid.Column>
        ))}
      </Grid.Container>
    </Grid.Root>
  ),
};

export const VariousColumns: Story = {
  render: () => (
    <Grid.Root style={{ padding: '24px' }}>
      <Grid.Container style={{ rowGap: '16px' }}>
        <Grid.Column span={12}>
          <div style={columnStyle}>span=12</div>
        </Grid.Column>
        <Grid.Column span={6}>
          <div style={columnStyle}>span=6</div>
        </Grid.Column>
        <Grid.Column span={6}>
          <div style={columnStyle}>span=6</div>
        </Grid.Column>
        <Grid.Column span={4}>
          <div style={columnStyle}>span=4</div>
        </Grid.Column>
        <Grid.Column span={4}>
          <div style={columnStyle}>span=4</div>
        </Grid.Column>
        <Grid.Column span={4}>
          <div style={columnStyle}>span=4</div>
        </Grid.Column>
      </Grid.Container>
    </Grid.Root>
  ),
};

export const WithOffset: Story = {
  render: () => (
    <Grid.Root style={{ padding: '24px' }}>
      <Grid.Container style={{ rowGap: '16px' }}>
        <Grid.Column span={4}>
          <div style={columnStyle}>span=4</div>
        </Grid.Column>
        <Grid.Column span={4} offset={4}>
          <div style={{ ...columnStyle, backgroundColor: '#fef3c7' }}>span=4, offset=4</div>
        </Grid.Column>
        <Grid.Column span={6} offset={3}>
          <div style={{ ...columnStyle, backgroundColor: '#dcfce7' }}>span=6, offset=3</div>
        </Grid.Column>
      </Grid.Container>
    </Grid.Root>
  ),
};

export const WithDebugOverlay: Story = {
  render: () => (
    <Grid.Root style={{ padding: '24px', minHeight: '300px' }}>
      <Grid.Debug />
      <Grid.Container style={{ rowGap: '16px' }}>
        <Grid.Column span={4}>
          <div style={{ ...columnStyle, backgroundColor: 'rgba(219, 234, 254, 0.9)' }}>span=4</div>
        </Grid.Column>
        <Grid.Column span={4}>
          <div style={{ ...columnStyle, backgroundColor: 'rgba(219, 234, 254, 0.9)' }}>span=4</div>
        </Grid.Column>
        <Grid.Column span={4}>
          <div style={{ ...columnStyle, backgroundColor: 'rgba(219, 234, 254, 0.9)' }}>span=4</div>
        </Grid.Column>
      </Grid.Container>
    </Grid.Root>
  ),
};
