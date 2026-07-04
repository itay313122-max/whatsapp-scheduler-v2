// Minimal, BeReal-style monochrome palette: pure black ground, white ink,
// white primary buttons with black text, one gray for secondary text.
// No accent hue — the design stays stark on purpose. Semantic colors
// (danger/success) exist only for state, not decoration.
export const colors = {
  bg: '#000000',
  surface: '#161618',
  surfaceAlt: '#232326',
  border: '#2C2C2E',

  primary: '#FFFFFF', // filled buttons / emphasis
  onPrimary: '#000000', // text/icon on top of primary
  primaryDark: '#E6E6E6', // pressed/hover on primary

  text: '#FFFFFF',
  textMuted: '#8E8E93',

  danger: '#FF453A',
  success: '#32D74B',
  gold: '#FFD60A',
};

export default colors;
