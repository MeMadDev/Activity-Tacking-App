const tintColorLight = '#6C63FF'; // Modern Violet
const tintColorDark = '#8B85FF';

// Brand & Category Colors
const brandColors = {
  primary: '#6C63FF',
  secondary: '#3F3D56',
  success: '#00B894',
  danger: '#FF7675',
  warning: '#FDCB6E',
  info: '#74B9FF',

  // Category Specific
  food: '#00B894', // Green
  fitness: '#0984E3', // Blue
  consumption: '#D63031', // Red
  note: '#FDCB6E', // Yellow
};

export default {
  light: {
    text: '#2D3436',
    textSecondary: '#636E72',
    background: '#F9F9FB', // Very light grey/white
    card: '#FFFFFF',
    tint: tintColorLight,
    tabIconDefault: '#B2B2B2',
    tabIconSelected: tintColorLight,
    border: '#E0E0E0',
    ...brandColors,
  },
  dark: {
    text: '#DFE6E9',
    textSecondary: '#B2BEC3',
    background: '#121212',
    card: '#1E1E1E',
    tint: tintColorDark,
    tabIconDefault: '#636E72',
    tabIconSelected: tintColorDark,
    border: '#333333',
    ...brandColors,
  },
  // Export brand colors directly for usage
  brand: brandColors,
};
