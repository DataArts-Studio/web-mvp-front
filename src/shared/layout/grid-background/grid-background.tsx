import React from 'react';

import Image from 'next/image';
import { motion } from 'framer-motion';

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
      aria-hidden="true"
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
  alt = "",
  imageClassName,
  ...props
}: BaseDecorationProps) => {
  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={cn("pointer-events-none absolute select-none", className)}
      {...props}
    >
      <Image
        src={src}
        width={width}
        height={height}
        alt={alt}
        aria-hidden="true"
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
    <motion.div
      aria-hidden="true"
      role="presentation"
      initial={{ opacity: 0, x: -20, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className={cn("pointer-events-none absolute select-none top-1/2 left-[calc(80%-153px)] z-10 h-[50px] w-[50px] -translate-y-1/2", className)}
      {...props}
    >
      <Image
        src="/backgrounds/arrow.svg"
        width={37.5}
        height={37.5}
        alt=""
        aria-hidden="true"
        className="absolute top-0 left-0 z-10"
      />
    </motion.div>
  );
};

/**
 * [Preset] CircleDecoration
 * BaseDecoration을 사용하여 미리 정의된 원형 장식입니다.
 */
const GridBackgroundCircleDecoration = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <motion.div
      aria-hidden="true"
      role="presentation"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.3, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={cn("pointer-events-none absolute select-none top-1/2 left-[calc(60%+5px)] z-0 h-[972px] w-[972px] -translate-y-1/2", className)}
      {...props}
    >
      <Image
        src="/backgrounds/circular.svg"
        width={1137.1}
        height={972.6}
        alt=""
        aria-hidden="true"
        className="absolute top-0 left-0 z-10"
      />
    </motion.div>
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
