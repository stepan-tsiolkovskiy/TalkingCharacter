export const Colors = {
  background: {
    primary: '#1a1a2e',
    secondary: '#16213e',
  },
  accent: {
    primary: '#4ECDC4',
    danger: '#E74C3C',
    success: '#2ECC71',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255,255,255,0.4)',
    muted: 'rgba(255,255,255,0.2)',
  },
  character: {
    pulse: '#4ECDC4',
  },
} as const

export const Typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 48,
  },
  letterSpacing: {
    wide: 2,
    wider: 4,
  },
} as const

export const Layout = {
  character: {
    size: 320,
    borderRadius: 160,
  },
  button: {
    size: 64,
    borderRadius: 32,
    gap: 32,
  },
  indicator: {
    width: 200,
    height: 4,
    borderRadius: 2,
  },
} as const
