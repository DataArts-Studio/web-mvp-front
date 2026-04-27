import type { Meta, StoryObj } from '@storybook/react';
import { LoadingSpinner } from './loading-spinner';

const meta: Meta<typeof LoadingSpinner> = {
  title: 'Shared/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: '스피너 크기',
    },
    text: {
      control: 'text',
      description: '로딩 텍스트',
    },
    fullScreen: {
      control: 'boolean',
      description: '전체 화면 오버레이 모드',
    },
    showDefaultText: {
      control: 'boolean',
      description: '기본 "로딩 중..." 텍스트 표시 여부',
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingSpinner>;

export const Default: Story = {
  args: {
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
  },
};

export const WithText: Story = {
  args: {
    size: 'md',
    text: '로딩 중...',
  },
};

export const WithLongText: Story = {
  args: {
    size: 'lg',
    text: '데이터를 불러오는 중입니다',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="sm" showDefaultText={false} />
        <span className="typo-caption text-text-3">sm (64px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="md" showDefaultText={false} />
        <span className="typo-caption text-text-3">md (120px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" showDefaultText={false} />
        <span className="typo-caption text-text-3">lg (160px)</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="xl" showDefaultText={false} />
        <span className="typo-caption text-text-3">xl (200px)</span>
      </div>
    </div>
  ),
};

export const FullScreen: Story = {
  args: {
    size: 'lg',
    text: '잠시만 기다려주세요...',
    fullScreen: true,
  },
  parameters: {
    layout: 'fullscreen',
  },
};
