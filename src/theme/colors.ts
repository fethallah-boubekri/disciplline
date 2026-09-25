// Single source of truth for the app's dark, premium visual identity.
// One accent color, red reserved for missed/negative, blue for "completed" in graphs.

export const colors = {
  bg: '#0B0B0F',
  bgElevated: '#141419',
  card: '#1B1B22',
  cardBorder: '#2A2A33',
  textPrimary: '#F5F5F7',
  textSecondary: '#9A9AA5',
  textMuted: '#5F5F6B',

  accent: '#7C5CFF', // primary brand accent (progress rings, CTAs, active tab)
  accentSoft: 'rgba(124, 92, 255, 0.15)',

  success: '#2ED573', // completed / perfect day
  danger: '#FF4757', // missed
  dangerSoft: 'rgba(255, 71, 87, 0.12)',
  warning: '#FFB020', // pending / medium priority

  chartCompleted: '#4E8CFF', // blue line
  chartMissed: '#FF4757', // red line
  chartExecution: '#7C5CFF',

  priorityLow: '#5F5F6B',
  priorityMedium: '#FFB020',
  priorityHigh: '#FF4757',
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

export const spacing = (n: number) => n * 4;

export const typography = {
  title: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 16, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  mono: { fontSize: 13, fontWeight: '600' as const },
};
