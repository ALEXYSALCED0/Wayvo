/**
 * Wayvo Design System - Typography
 * Source of Truth: Rubik font family and Stitch text scales
 */

export const fontFamilies = {
  regular: 'Rubik_400Regular',
  medium: 'Rubik_500Medium',
  semiBold: 'Rubik_600SemiBold',
  bold: 'Rubik_700Bold',
} as const;

export const typography = {
  displayLg: {
    fontFamily: fontFamilies.bold,
    fontSize: 34,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  displaySm: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  headlineLg: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    lineHeight: 32,
  },
  headlineLgMobile: {
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    lineHeight: 28,
  },
  headlineMd: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 20,
    lineHeight: 26,
  },
  bodyLg: {
    fontFamily: fontFamilies.regular,
    fontSize: 17,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  labelMd: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  labelSm: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    lineHeight: 16,
  },
} as const;
