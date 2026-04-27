import React from 'react';

export const composeEventHandlers = <E extends React.SyntheticEvent>(
  originalHandler?: ((e: E) => void) | undefined,
  ourHandler?: (e: E) => void,
  options?: { checkDefaultPrevented?: boolean }
) => {
  return (e: E) => {
    originalHandler?.(e);
    if (options?.checkDefaultPrevented && e.defaultPrevented) return;
    ourHandler?.(e);
  };
};
