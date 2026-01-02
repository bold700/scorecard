import { useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, IconButton, Box } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'

export function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()

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
      </Toolbar>
    </AppBar>
  )
}

