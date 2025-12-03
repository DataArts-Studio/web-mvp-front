import React from 'react';

import Image from 'next/image';

import { cn } from '@/shared';

// ------------------------------------------------------------------
// Interfaces Export
// ------------------------------------------------------------------
export interface GridBackgroundRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface GridBackgroundGridProps extends React.HTMLAttributes<HTMLDivElement> {
  opacity?: string;
  size?: string;
  color?: string;
}

export interface BaseDecorationProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  width: number;
  height: number;
  alt?: string;
  imageClassName?: string;
}

// ------------------------------------------------------------------
// Core Component Implementations (Root, Grid, Gradient)
// ------------------------------------------------------------------
const GridBackgroundRoot = ({ children, className, ...props }: GridBackgroundRootProps) => {
  return (
    <div
      className={cn('bg-bg-1 relative size-full min-h-screen overflow-hidden', className)}
      data-name="Grid-Layout-Root"
      {...props}
    >
      {children}
    </div>
  );
};

const GridBackgroundGrid = ({
  opacity = 'opacity-[0.03]',
  size = '80px 80px',
  color = '#0BB57F',
  className,
  style,
  ...props
}: GridBackgroundGridProps) => {
  const gridStyle = {
    backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px),
                      linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
    backgroundSize: size,
    ...style,
  };

  return (
    <div
      className={cn('pointer-events-none absolute inset-0', opacity, className)}
      style={gridStyle}
      aria-hidden="true"
      {...props}
    />
  );
};

const GridBackgroundGradient = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0BB57F]/5 via-transparent to-transparent',
        className
      )}
      {...props}
    />
  );
};

// ------------------------------------------------------------------
// Decoration Components (Base & Presets)
// ------------------------------------------------------------------
/**
 * [BaseDecoration]
 * 공통 장식 컴포넌트입니다.
 * Arrow, Circle 외에 다른 커스텀 이미지를 넣고 싶을 때 직접 사용합니다.
 */
const BaseDecoration = ({
  className,
  src,
  width,
  height,
  alt = "Decoration",
  imageClassName,
  ...props
}: BaseDecorationProps) => {
  return (
    <div
      className={cn("pointer-events-none absolute select-none", className)}
      {...props}
    >
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        className={cn("absolute top-0 left-0", imageClassName)}
      />
    </div>
  );
};

/**
 * [Preset] ArrowDecoration
 * BaseDecoration을 사용하여 미리 정의된 화살표 장식입니다.
 */
const GridBackgroundArrowDecoration = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <BaseDecoration
      src="/backgrounds/arrow.svg"
      width={37.5}
      height={37.5}
      alt="Arrow Decoration"
      className={cn("top-[460px] left-[calc(80%-153px)] z-10 h-[50px] w-[50px]", className)}
      imageClassName="z-10"
      {...props}
    />
  );
};

/**
 * [Preset] CircleDecoration
 * BaseDecoration을 사용하여 미리 정의된 원형 장식입니다.
 */
const GridBackgroundCircleDecoration = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {  return (
    <BaseDecoration
      src="/backgrounds/circular.svg"
      width={1137.1}
      height={972.6}
      alt="Circular Decoration"
      className={cn("top-[84px] left-[calc(60%+5px)] z-0 h-[972px] w-[972px] opacity-30", className)}
      imageClassName="z-10"
      {...props}
    />
  );
};

// ------------------------------------------------------------------
// Export (Namespace)
// ------------------------------------------------------------------
export const GridBackground = {
  Root: GridBackgroundRoot,
  Grid: GridBackgroundGrid,
  Decoration: BaseDecoration,
  ArrowDecoration: GridBackgroundArrowDecoration,
  CircleDecoration: GridBackgroundCircleDecoration,
  Gradient: GridBackgroundGradient,
};
