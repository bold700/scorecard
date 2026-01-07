import { useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, IconButton, Box, Menu, MenuItem, ListItemIcon, ListItemText, useMediaQuery } from '@mui/material'
import { ArrowBack, DarkMode, LightMode, SettingsBrightness } from '@mui/icons-material'
import { useMemo, useState } from 'react'
import { useThemeStore, type ThemePreference } from '../store/useThemeStore'

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const preference = useThemeStore((s) => s.preference)
  const setPreference = useThemeStore((s) => s.setPreference)
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })
  const resolvedMode = useMemo(() => (preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference), [preference, prefersDark])
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const showBackButton = location.pathname !== '/'

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        {showBackButton && (
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
        )}
        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          color="inherit"
          aria-label="thema"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          {resolvedMode === 'dark' ? <DarkMode /> : <LightMode />}
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {(
            [
              { value: 'system', label: 'Systeem', icon: <SettingsBrightness fontSize="small" /> },
              { value: 'light', label: 'Licht', icon: <LightMode fontSize="small" /> },
              { value: 'dark', label: 'Donker', icon: <DarkMode fontSize="small" /> },
            ] as Array<{ value: ThemePreference; label: string; icon: JSX.Element }>
          ).map((opt) => (
            <MenuItem
              key={opt.value}
              selected={preference === opt.value}
              onClick={() => {
                setPreference(opt.value)
                setAnchorEl(null)
              }}
            >
              <ListItemIcon>{opt.icon}</ListItemIcon>
              <ListItemText>{opt.label}</ListItemText>
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  )
}

