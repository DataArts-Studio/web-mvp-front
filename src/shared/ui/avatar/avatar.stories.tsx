import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from '@/shared/ui';
import Image from 'next/image';

// ------------------------------------------------------------------
// 테스트용 이미지 URL (실제 프로젝트에서는 CDN 또는 public 폴더 경로 사용)
// ------------------------------------------------------------------
const VALID_IMAGE_URL = 'https://i.pravatar.cc/150?img=68';
const INVALID_IMAGE_URL = 'invalid-path-to-trigger-error';

// ------------------------------------------------------------------
// Meta Data
// ------------------------------------------------------------------
const meta: Meta<typeof Avatar.Root> = {
  title: 'Primitive Components/Avatar',
  component: Avatar.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type AvatarRootProps = React.ComponentProps<typeof Avatar.Root>;
type Story = StoryObj<AvatarRootProps & AvatarStoryProps>;

// ------------------------------------------------------------------
// Templates
// ------------------------------------------------------------------
interface AvatarStoryProps {
  imageUrl: string;
  size: 'sm' | 'md' | 'lg';
  fallbackText: string;
  isNextImage?: boolean;
}

const sizeMap = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-16 h-16 text-lg',
  lg: 'w-24 h-24 text-xl',
};

const AvatarTemplate = ({
  imageUrl,
  size,
  fallbackText,
  isNextImage
}: AvatarStoryProps) => {

  const sizeClass = sizeMap[size];

  // 실제 이미지 컴포넌트 (Next.js Image 또는 기본 img)
  const ImageComponent = isNextImage ? (
    <Image
      src={imageUrl}
      alt="User Avatar"
      width={150}
      height={150}
      className="w-full h-full object-cover"
      priority
    />
  ) : (
    <img
      src={imageUrl}
      alt="User Avatar"
      className="w-full h-full object-cover"
    />
  );

  return (
    <Avatar.Root className={`${sizeClass} rounded-full overflow-hidden shadow-md bg-gray-100`}>
      <Avatar.Image>
        {/* Slot 패턴: ImageComponent가 Slot의 children으로 전달됨 */}
        {ImageComponent}
      </Avatar.Image>

      <Avatar.Fallback className={`${sizeClass} flex items-center justify-center bg-gray-500 text-white font-semibold`}>
        {fallbackText}
      </Avatar.Fallback>
    </Avatar.Root>
  );
};

// ------------------------------------------------------------------
// Stories
// ------------------------------------------------------------------
//  기본 (로드 성공) 스토리
export const DefaultLoaded: Story = {
  args: {
    imageUrl: VALID_IMAGE_URL,
    size: 'md',
    fallbackText: 'JD',
  } as AvatarStoryProps, // 타입 단언
  render: AvatarTemplate,
};

// 로드 실패/에러 (Fallback 표시) 스토리
export const FallbackVisible: Story = {
  args: {
    imageUrl: INVALID_IMAGE_URL, // 고의적으로 로드 에러 유발
    size: 'md',
    fallbackText: 'SK',
  } as AvatarStoryProps,
  render: AvatarTemplate,
};

// 작은 크기 (Small Size)
export const SmallSize: Story = {
  args: {
    imageUrl: VALID_IMAGE_URL,
    size: 'sm',
    fallbackText: 'MD',
  } as AvatarStoryProps,
  render: AvatarTemplate,
};

// Next.js Image 통합 스토리 (Slot 테스트)
export const WithNextJsImage: Story = {
  args: {
    imageUrl: VALID_IMAGE_URL,
    size: 'lg',
    fallbackText: 'NX',
    isNextImage: true,
  } as AvatarStoryProps,
  render: AvatarTemplate,
};