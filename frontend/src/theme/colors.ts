export const colors = {
  background: '#F3F5F8',
  surface: '#FFFFFF',
  surfaceMuted: '#F8F9FB',
  surfaceHover: '#F1F5FB',
  border: '#E2E6EC',
  borderStrong: '#C9D0DA',
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  placeholder: '#9CA3AF',
  primary: '#256ABF',
  primaryPressed: '#1C5CAB',
  primarySubtle: '#EAF2FD',
  primaryBorder: '#B7D3F6',
  onPrimary: '#FFFFFF',
  brandPanel: '#184F95',
  brandPanelText: '#CDE2FB',
  overlay: 'rgba(17, 24, 39, 0.45)',
  success: '#006300',
  successMark: '#0CA30C',
  successSubtle: '#E8F5E8',
  warning: '#9A5B00',
  warningMark: '#EDA100',
  warningSubtle: '#FDF3DC',
  danger: '#C62828',
  dangerSubtle: '#FDECEC',
  accentViolet: '#4A3AA7',
  accentVioletSubtle: '#EEECFA',
  accentOrange: '#B9471B',
  accentOrangeSubtle: '#FDEEE7',
  neutralMark: '#9CA3AF',
  neutralSubtle: '#EEF0F3',
  gridline: '#E5E7EB',
} as const;

/**
 * Categorical chart series in fixed order (validated for colour-vision
 * deficiency as an adjacent set). Never cycle or recolour by rank.
 */
export const chartSeries = ['#2A78D6', '#EB6834', '#1BAF7A'] as const;
