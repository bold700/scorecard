import React, { useEffect, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline, useMediaQuery } from '@mui/material'
import App from './App.tsx'
import { getAppTheme, materialTokens, type ColorMode } from './theme.ts'
import { useThemeStore } from './store/useThemeStore'
import './index.css'

// Fix for GitHub Pages client-side routing
// Redirect to index.html if path contains /?/
const pathname = window.location.pathname
if (pathname.includes('/?/')) {
  const newPathname = pathname.replace('/?/', '/').replace(/~and~/g, '&')
  const search = window.location.search.replace(/~and~/g, '&')
  const hash = window.location.hash
  window.history.replaceState({}, '', newPathname + search + hash)
}

// Get base path from vite config (for GitHub Pages)
const base = import.meta.env.BASE_URL || '/'

function AppWithTheme() {
  const preference = useThemeStore((s) => s.preference)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })
  const resolvedMode: ColorMode = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference

  const theme = useMemo(() => getAppTheme(resolvedMode), [resolvedMode])

  useEffect(() => {
    // Update browser UI color (Android/Chrome) to match mode background
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      // M3 guidance: browser chrome matcht beter met surface/container dan met pure background.
      meta.setAttribute('content', materialTokens[resolvedMode].surface)
    }
  }, [resolvedMode])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={base}>
      <AppWithTheme />
    </BrowserRouter>
  </React.StrictMode>,
)

