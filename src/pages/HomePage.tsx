import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Stack,
} from '@mui/material'
import { Add, Dashboard } from '@mui/icons-material'
import { useAuthStore } from '../store/useAuthStore'

export function HomePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [tournamentName, setTournamentName] = useState('')
  const [userName, setUserName] = useState('')

  const handleCreateTournament = () => {
    if (!tournamentName.trim() || !userName.trim()) return

    // Create user
    const newUser: typeof user = {
      id: `user_${Date.now()}`,
      name: userName,
      role: 'organizer',
    }
    setUser(newUser)

    // Create tournament (in real app, this would be saved to Firebase)
    const tournamentId = `tournament_${Date.now()}`
    // Save tournament info to localStorage
    const tournament = {
      id: tournamentId,
      name: tournamentName,
      createdAt: Date.now(),
      createdBy: newUser.id,
      fighters: [],
      matches: [],
      rounds: 3,
    }
    localStorage.setItem(`tournament_${tournamentId}`, JSON.stringify(tournament))
    navigate(`/tournament/${tournamentId}`)
  }

  const handleJoinAsPublic = () => {
    if (!userName.trim()) return

    const newUser: typeof user = {
      id: `user_${Date.now()}`,
      name: userName,
      role: 'public_user',
    }
    setUser(newUser)
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Scorecard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Digitale scorecard voor vechtsportwedstrijden
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={3}>
            <TextField
              label="Jouw naam"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Toernooi naam"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              fullWidth
              required
              disabled={!userName.trim()}
            />

            <Button
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={handleCreateTournament}
              disabled={!tournamentName.trim() || !userName.trim()}
              fullWidth
            >
              Toernooi Aanmaken
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Of</Typography>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Dashboard />}
              onClick={handleJoinAsPublic}
              disabled={!userName.trim()}
              fullWidth
            >
              Meedoen als Publiek
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

