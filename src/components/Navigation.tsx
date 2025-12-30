import { useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material'
import { ArrowBack, Home } from '@mui/icons-material'

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
        <IconButton
          edge="start"
          color="inherit"
          onClick={() => navigate('/')}
          sx={{ mr: 1 }}
        >
          <Home />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Scorecard
        </Typography>
      </Toolbar>
    </AppBar>
  )
}

