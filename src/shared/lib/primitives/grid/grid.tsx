import React from 'react';
import { Slot } from '@/shared/lib';

// ----------------------------------------------
// Configuration (Default CSS Variables)
// ----------------------------------------------
const DEFAULT_STYLE = {
  '--grid-max-width': '1200px',
  '--grid-gutter': '24px',
  '--grid-margin': '24px',
  '--grid-columns': '12',
} as React.CSSProperties;

// ----------------------------------------------
// Interfaces
// ----------------------------------------------
export interface GridRootProps extends React.ComponentProps<'div'> {
  asChild?: boolean;
}

export interface GridContainerProps extends React.ComponentProps<'div'> {
  asChild?: boolean;
  fluid?: boolean; // true면 max-width 제한 해제
}

export interface GridRowProps extends React.ComponentProps<'div'> {
  asChild?: boolean;
}

export interface GridColumnProps extends React.ComponentProps<'div'> {
  asChild?: boolean;
  span?: number; // 차지할 컬럼 수 (1 ~ 12)
  offset?: number; // 시작 전 비울 컬럼 수
}

// ----------------------------------------------
// Root (Wrapper)
// ----------------------------------------------
const GridRoot = ({ asChild, style, ...props }: GridRootProps) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      style={{
        width: '100%',
        position: 'relative',
        ...DEFAULT_STYLE, // 기본 변수 주입
        ...style, // 사용자 오버라이딩 허용
      }}
      {...props}
    />
  );
};
GridRoot.displayName = 'Grid.Root';

// ----------------------------------------------
// Container (실제 12컬럼 그리드가 적용되는 영역)
// ----------------------------------------------
const GridContainer = ({ asChild, fluid, style, ...props }: GridContainerProps) => {
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      data-fluid={fluid ? '' : undefined}
      style={{
        display: 'grid',
        width: '100%',
        // 12컬럼 그리드 표준 정의
        gridTemplateColumns: 'repeat(var(--grid-columns), 1fr)',
        columnGap: 'var(--grid-gutter)',
        // 중앙 정렬 및 좌우 패딩
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: 'var(--grid-margin)',
        paddingRight: 'var(--grid-margin)',
        // Fluid 옵션에 따라 최대 너비 제어
        maxWidth: fluid ? 'none' : 'var(--grid-max-width)',
        ...style,
      }}
      {...props}
    />
  );
};
GridContainer.displayName = 'Grid.Container';

// ----------------------------------------------
// Row (Subgrid)
// 그리드 내에서 중첩 그리드를 만들거나 행을 나눌 때 사용
// ----------------------------------------------
const GridRow = ({ asChild, style, ...props }: GridRowProps) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      style={{
        display: 'grid',
        // 지원하지 않는 브라우저를 위해 fallback으로
        // flex나 grid 재정의가 필요할 수 있음
        gridTemplateColumns: 'subgrid',
        // 전체 너비 차지
        gridColumn: '1 / -1',
        gap: 'inherit',
        ...style,
      }}
      {...props}
    />
  );
};
GridRow.displayName = 'Grid.Row';

// ----------------------------------------------
// Column (실제 컨텐츠가 들어가는 셀)
// ----------------------------------------------
const GridColumn = ({ asChild, span, offset, style, ...props }: GridColumnProps) => {
  const Comp = asChild ? Slot : 'div';

  // ----------------------------------------------
  // Span과 Offset 계산
  // span이 없으면 기본적으로 12칸(전체)을 차지하도록 설정 (모바일 우선)
  // ----------------------------------------------
  const gridColumnSpan = span ? `span ${span}` : '1 / -1';
  const gridColumnStart = offset ? `auto` : undefined;
  const marginLeft = offset
    ? `calc(((100% + var(--grid-gutter)) / var(--grid-columns)) * ${offset})`
    : undefined;

  return (
    <Comp
      style={{
        gridColumn: gridColumnSpan,
        gridColumnStart: gridColumnStart,
        marginLeft: marginLeft,
        minWidth: 0,
        ...style,
      }}
      {...props}
    />
  );
};
GridColumn.displayName = 'Grid.Column';

// ----------------------------------------------
// Debug Overlay (Visual Guide)
// 개발용 그리드 가이드라인
// ----------------------------------------------
const GridDebugOverlay = () => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          height: '100%',
          width: '100%',
          gridTemplateColumns: 'repeat(var(--grid-columns), 1fr)',
          columnGap: 'var(--grid-gutter)',
          paddingLeft: 'var(--grid-margin)',
          paddingRight: 'var(--grid-margin)',
          maxWidth: 'var(--grid-max-width)',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: '100%',
              backgroundColor: '#FF007A',
              opacity: 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
};

// ----------------------------------------------
// Export
// ----------------------------------------------
export const Grid = {
  Root: GridRoot,
  Container: GridContainer,
  Row: GridRow,
  Column: GridColumn,
  Debug: GridDebugOverlay,
};
