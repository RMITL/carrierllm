export type ColorTokens = {
  primary: string;
  primary700: string;
  gray900: string;
  gray500: string;
  gray100: string;
  green: string;
  amber: string;
  red: string;
};

export type TypographyTokens = {
  fontFamily: string;
  h1Size: string;
  h1Weight: number;
  h2Size: string;
  h2Weight: number;
  bodySize: string;
  bodyWeight: number;
};

export type LayoutTokens = {
  spacingUnit: number;
  borderRadius: string;
  shadow: string;
};

export type ThemeTokens = {
  colors: ColorTokens;
  typography: TypographyTokens;
  layout: LayoutTokens;
};

export const tokens: ThemeTokens = {
  colors: {
    primary: '#1E6BF1',
    primary700: '#134BB0',
    gray900: '#2E2E2E',
    gray500: '#6E6E6E',
    gray100: '#F5F7FA',
    green: '#0EAD69',
    amber: '#F9A620',
    red: '#D7263D'
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h1Size: '32px',
    h1Weight: 700,
    h2Size: '24px',
    h2Weight: 600,
    bodySize: '16px',
    bodyWeight: 400
  },
  layout: {
    spacingUnit: 8,
    borderRadius: '8px',
    shadow: '0 8px 16px rgba(30, 107, 241, 0.08)'
  }
};

export const cssVariableMap: Record<string, string> = {
  '--color-primary': tokens.colors.primary,
  '--color-primary-700': tokens.colors.primary700,
  '--color-gray-900': tokens.colors.gray900,
  '--color-gray-500': tokens.colors.gray500,
  '--color-gray-100': tokens.colors.gray100,
  '--color-green': tokens.colors.green,
  '--color-amber': tokens.colors.amber,
  '--color-red': tokens.colors.red,
  '--font-family-base': tokens.typography.fontFamily,
  '--font-size-h1': tokens.typography.h1Size,
  '--font-size-h2': tokens.typography.h2Size,
  '--font-size-body': tokens.typography.bodySize,
  '--spacing-unit': `${tokens.layout.spacingUnit}px`,
  '--border-radius-base': tokens.layout.borderRadius,
  '--shadow-card': tokens.layout.shadow
};
