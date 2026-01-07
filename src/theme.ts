import { alpha, createTheme } from '@mui/material/styles'

// Material Design 3 (Custom) - gebaseerd op Google Material Theme Builder export (seed: #9BDD85)
// NB: we mappen de M3 tokens naar MUI palette waar mogelijk.
// Rood/blauw “corner” kleuren (error/info) laten we bewust zoals ze waren om de score UI consistent te houden.

export type ColorMode = 'light' | 'dark'

export const materialTokens = {
  light: {
    primary: '#416835',
    onPrimary: '#FFFFFF',
    primaryContainer: '#C1EFAE',
    onPrimaryContainer: '#2A4F1F',
    secondary: '#54634D',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D7E8CC',
    onSecondaryContainer: '#3D4B37',
    tertiary: '#386668',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#BCEBEE',
    onTertiaryContainer: '#1E4E50',
    background: '#F8FAF0',
    onBackground: '#191D17',
    surface: '#F8FAF0',
    onSurface: '#191D17',
    surfaceVariant: '#DFE4D7',
    onSurfaceVariant: '#43483F',
    outline: '#73796E',
    outlineVariant: '#C3C8BC',
    inverseSurface: '#2E322B',
    inverseOnSurface: '#EFF2E8',
    surfaceContainer: '#ECEFE5',
    surfaceContainerLow: '#F2F5EB',
    surfaceContainerHigh: '#E6E9DF',
    surfaceContainerHighest: '#E1E4DA',
  },
  dark: {
    primary: '#A6D394',
    onPrimary: '#13380A',
    primaryContainer: '#2A4F1F',
    onPrimaryContainer: '#C1EFAE',
    secondary: '#BBCBB1',
    onSecondary: '#273421',
    secondaryContainer: '#3D4B37',
    onSecondaryContainer: '#D7E8CC',
    tertiary: '#A0CFD1',
    onTertiary: '#003739',
    tertiaryContainer: '#1E4E50',
    onTertiaryContainer: '#BCEBEE',
    background: '#11140F',
    onBackground: '#E1E4DA',
    surface: '#11140F',
    onSurface: '#E1E4DA',
    surfaceVariant: '#43483F',
    onSurfaceVariant: '#C3C8BC',
    outline: '#8D9387',
    outlineVariant: '#43483F',
    inverseSurface: '#E1E4DA',
    inverseOnSurface: '#2E322B',
    surfaceContainer: '#1D211B',
    surfaceContainerLow: '#191D17',
    surfaceContainerHigh: '#272B25',
    surfaceContainerHighest: '#32362F',
  },
} as const

export function getAppTheme(mode: ColorMode) {
  const t = materialTokens[mode]

  return createTheme({
    palette: {
      mode,
      primary: {
        main: t.primary,
        contrastText: t.onPrimary,
      },
      secondary: {
        main: t.secondary,
        contrastText: t.onSecondary,
      },
      // Corner kleuren voor score UI
      error: {
        main: '#BA1A1A', // Red fighter color
        light: '#FFDAD6',
        dark: '#410002',
      },
      info: {
        main: '#2196F3', // Blue fighter color - brighter for better visibility
        light: '#64B5F6',
        dark: '#1976D2',
      },
      background: {
        default: t.background, // M3 background
        paper: t.surfaceContainer, // M3 surfaceContainer (voor Cards/Papers)
      },
      text: {
        primary: t.onSurface,
        secondary: t.onSurfaceVariant,
      },
      divider: t.outlineVariant,
    },
    typography: {
      fontFamily: [
        'Roboto',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: { fontSize: '2rem', fontWeight: 400, lineHeight: 1.2 },
      h2: { fontSize: '1.75rem', fontWeight: 400, lineHeight: 1.2 },
      h3: { fontSize: '1.5rem', fontWeight: 400, lineHeight: 1.2 },
      h4: { fontSize: '1.25rem', fontWeight: 400, lineHeight: 1.2 },
      h5: { fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.2 },
      h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.2 },
      body1: { fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.43 },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: t.background,
            color: t.onBackground,
          },
        },
      },
      // M3 top app bar gebruikt surface/containers, niet primary.
      MuiAppBar: {
        defaultProps: {
          color: 'transparent',
        },
        styleOverrides: {
          root: {
            backgroundColor: t.surfaceContainer,
            color: t.onSurface,
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: '48px',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: 500,
          },
          contained: {
            // M3 “filled button” ~ primaryContainer
            backgroundColor: t.primaryContainer,
            color: t.onPrimaryContainer,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: alpha(t.primaryContainer, 0.92),
              boxShadow: 'none',
            },
          },
          outlined: {
            borderColor: t.outline,
            '&:hover': {
              borderColor: t.outline,
              backgroundColor: alpha(t.primary, mode === 'dark' ? 0.08 : 0.06),
            },
          },
          text: {
            '&:hover': {
              backgroundColor: alpha(t.primary, mode === 'dark' ? 0.08 : 0.06),
            },
          },
          sizeLarge: {
            minHeight: '56px',
            padding: '16px 32px',
            fontSize: '1.125rem',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            padding: '16px',
            backgroundImage: 'none',
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            minHeight: '56px',
            minWidth: '56px',
            backgroundColor: t.primaryContainer,
            color: t.onPrimaryContainer,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: alpha(t.primaryContainer, 0.92),
              boxShadow: 'none',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  })
}

