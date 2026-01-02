import { createTheme } from '@mui/material/styles'

// Material Design 3 Dark Theme
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6750A4', // M3 Primary
      light: '#EADDFF',
      dark: '#21005D',
    },
    secondary: {
      main: '#625B71',
      light: '#E8DEF8',
      dark: '#1D192B',
    },
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
      default: '#1C1B1F',
      paper: '#1C1B1F',
    },
    text: {
      primary: '#E6E1E5',
      secondary: '#CAC4D0',
    },
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
    h1: {
      fontSize: '2rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 400,
      lineHeight: 1.2,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.2,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: '48px', // Touch target size
          padding: '12px 24px',
          borderRadius: '12px',
          fontSize: '1rem',
          fontWeight: 500,
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
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          minHeight: '56px',
          minWidth: '56px',
        },
      },
    },
  },
})

