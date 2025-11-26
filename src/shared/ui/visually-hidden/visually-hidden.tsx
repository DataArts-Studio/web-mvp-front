'use client';

import React from 'react';

const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  // 구형 브라우저(IE 등)를 위한 폴백
  clip: 'rect(0, 0, 0, 0)',
  // 최신 표준 속성 (React 스타일 객체용)
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  border: 0,
};

interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLElement> {
  ref?: React.Ref<HTMLElement>;
  element?: keyof HTMLElementTagNameMap;
}

const VisuallyHidden = ({
  element = 'span',
  ref,
  style,
  children,
  ...props
}: VisuallyHiddenProps): React.JSX.Element => {
  return React.createElement(
    element,
    {
      ref,
      style: { ...visuallyHiddenStyles, ...style },
      ...props,
    },
    children
  );
};

export { VisuallyHidden, visuallyHiddenStyles };
export type { VisuallyHiddenProps };
