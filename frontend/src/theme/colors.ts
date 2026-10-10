/**
 * One accent (sky blue) on neutral greys. Red is reserved for errors and
 * destructive actions; multiple hues appear only inside charts.
 */
export const colors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  surfaceHover: '#F0F9FF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  placeholder: '#94A3B8',
  // Sky 700 for filled controls and links: white text on it clears 5.9:1.
  primary: '#0369A1',
  primaryPressed: '#075985',
  primarySubtle: '#E0F2FE',
  primaryBorder: '#BAE6FD',
  primaryStrongText: '#0C4A6E',
  onPrimary: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.45)',
  danger: '#B91C1C',
  dangerSubtle: '#FEF2F2',
  neutralSubtle: '#F1F5F9',
  gridline: '#E5E7EB',
} as const;

/**
 * Categorical chart series in fixed order, validated all-pairs for
 * colour-vision deficiency. Values are always labelled beside the marks.
 */
export const chartSeries = ['#0EA5E9', '#F59E0B', '#8B5CF6'] as const;
