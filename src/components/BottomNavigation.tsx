import { useNavigate, useLocation } from 'react-router-dom'
import { BottomNavigation as MuiBottomNavigation, BottomNavigationAction, Paper, Fab } from '@mui/material'
import { SportsMma, Add, Insights } from '@mui/icons-material'
import { useState, useEffect } from 'react'

interface BottomNavigationProps {
  onNewTournamentClick?: () => void
}

export function BottomNavigation({ onNewTournamentClick }: BottomNavigationProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [value, setValue] = useState(0)

  useEffect(() => {
    // Set active tab based on current route
    if (location.pathname === '/') {
      setValue(0)
    } else if (location.pathname.includes('/dashboard') || location.pathname === '/insights') {
      setValue(1)
    } else {
      setValue(-1) // No match, don't highlight any tab
    }
  }, [location.pathname])

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    const pathParts = location.pathname.split('/')
    const tournamentId = pathParts[1] === 'tournament' && pathParts[2] ? pathParts[2] : null

    switch (newValue) {
      case 0:
        setValue(0)
        navigate('/')
        break
      case 1:
        // Navigate to dashboard/insights
        if (tournamentId) {
          setValue(1)
          navigate(`/tournament/${tournamentId}/dashboard`)
        } else {
          // Navigate to insights selection page
          setValue(1)
          navigate('/insights')
        }
        break
    }
  }

  return (
    <>
      {/* FAB Button for creating new tournament */}
      {location.pathname === '/' && (
        <Fab
          color="primary"
          aria-label="add tournament"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => onNewTournamentClick?.()}
        >
          <Add />
        </Fab>
      )}

      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
        <MuiBottomNavigation value={value} onChange={handleChange} showLabels>
          <BottomNavigationAction label="Toernooien" icon={<SportsMma />} />
          <BottomNavigationAction label="Insights" icon={<Insights />} />
        </MuiBottomNavigation>
      </Paper>
    </>
  )
}
