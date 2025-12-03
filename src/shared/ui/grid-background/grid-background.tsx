import React from 'react';

interface GridBackgroundProps {
  opacity?: string;
  size?: string;
  color?: string;
}

export const GridBackground = ({
  opacity = 'opacity-[0.03]',
  size = '80px 80px',
  color = '#0BB57F',
}: GridBackgroundProps) => {
  const gridStyle = {
    backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px),
                      linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
    backgroundSize: size,
  };

  return (
    <div
      className={`absolute inset-0 ${opacity}`}
      style={gridStyle}
      aria-hidden="true"
    />
  );
};
