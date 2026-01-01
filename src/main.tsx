import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import App from './App.tsx'
import { theme } from './theme.ts'
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

