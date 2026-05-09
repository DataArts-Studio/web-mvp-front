export const designTokens = {
  color: {
    primary: 'var(--color-primary)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    iconDefault: 'var(--color-icon-default)',
    errorText: 'var(--color-error-text)',
    errorIcon: 'var(--color-error-icon)',
    border: 'var(--color-border)',
    surfaceSubtle: 'var(--color-surface-subtle)',
    surfaceHeader: 'var(--color-surface-header)',
    white: 'var(--color-white)',
    black: 'var(--color-black)',
  },
  typography: {
    button: {
      fontSize: 'var(--text-sm)',
      fontWeight: 'var(--font-weight-medium)',
    },
  },
  spacing: {
    1: 'calc(var(--spacing) * 1)',
    2: 'calc(var(--spacing) * 2)',
    3: 'calc(var(--spacing) * 3)',
    4: 'calc(var(--spacing) * 4)',
    5: 'calc(var(--spacing) * 5)',
    6: 'calc(var(--spacing) * 6)',
    8: 'calc(var(--spacing) * 8)',
    10: 'calc(var(--spacing) * 10)',
    12: 'calc(var(--spacing) * 12)',
  },
  button: {
    radius: 'var(--radius-button)',
    size: {
      small: {
        height: 'var(--height-button-sm)',
        padding: 'calc(var(--spacing) * 1.5) calc(var(--spacing) * 3)',
      },
      medium: {
        height: 'var(--height-button-md)',
        padding: 'calc(var(--spacing) * 2) calc(var(--spacing) * 4)',
      },
      large: {
        height: 'var(--height-button-lg)',
        padding: 'calc(var(--spacing) * 3) calc(var(--spacing) * 6)',
      },
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
