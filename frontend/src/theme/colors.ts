/**
 * Wayvo Design System - Color Palette
 * Source of Truth: Google Stitch Project "Wayvo AI Travel Architect"
 * Primary Brand: Havelock Blue (#669bcb / #28628f)
 */

export const colors = {
  // Brand & Primary
  primary: '#004a75',
  primaryVariant: '#28628f',
  primaryContainer: '#669bcb',
  primaryFixed: '#cee5ff',
  primaryFixedDim: '#97ccfe',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#003150',

  // Secondary
  secondary: '#2d6196',
  secondaryContainer: '#92c1fd',
  secondaryFixed: '#d2e4ff',
  secondaryFixedDim: '#a0caff',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#154f83',

  // Tertiary
  tertiary: '#174781',
  tertiaryContainer: '#7098d7',
  tertiaryFixed: '#d5e3ff',
  tertiaryFixedDim: '#a7c8ff',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#002f5f',

  // Surfaces & Backgrounds
  background: '#f9f9ff',
  surface: '#f3f8fb',
  surfaceDim: '#e3eef6',
  surfaceBright: '#f9f9ff',
  surfaceVariant: '#d4e3ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f0f3ff',
  surfaceContainer: '#e6eeff',
  surfaceContainerHigh: '#dde9ff',
  surfaceContainerHighest: '#d4e3ff',

  // Borders & Outlines
  border: '#cde2f0',
  outline: '#71787f',
  outlineVariant: '#c1c7d0',

  // Typography & Content
  onSurface: '#001c3a',
  onSurfaceVariant: '#41474f',
  onBackground: '#001c3a',
  textDark: '#253146',
  textMuted: '#71787f',

  // Status & Semantic Colors
  statusSuccess: '#4caf50',
  statusWarning: '#ffc107',
  statusError: '#ba1a1a',
  statusPending: '#9e9e9e',

  // Error Containers
  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  // UI specifics
  cardBg: '#ffffff',
  havelockBlue: '#669bcb',
  divider: '#e0e7ed',
  backdrop: 'rgba(0, 28, 58, 0.4)',
} as const;

export type ColorKeys = keyof typeof colors;
