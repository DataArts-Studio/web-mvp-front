export const designTokens = {
  color: {
    primary: '#2563EB',
    textPrimary: '#101828',
    textSecondary: '#4A5565',
    iconDefault: '#6B7280',
    errorText: '#D32F2F',
    errorIcon: '#DC2626',
    border: '#E5E7EB',
    surfaceSubtle: '#F3F4F6',
    surfaceHeader: '#F9FAFB',
    white: '#FFFFFF',
    black: '#000000',
  },
  typography: {
    button: {
      fontSize: '14px',
      fontWeight: 500,
    },
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
  },
  button: {
    radius: '6px',
    size: {
      small: {
        height: '32px',
        padding: '6px 12px',
      },
      medium: {
        height: '40px',
        padding: '8px 16px',
      },
      large: {
        height: '48px',
        padding: '12px 24px',
      },
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
