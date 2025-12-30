import { useState, useEffect } from 'react'
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
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material'
import { Add, Dashboard } from '@mui/icons-material'
import { useAuthStore } from '../store/useAuthStore'
import { Tournament } from '../types'

export function HomePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [tournamentName, setTournamentName] = useState('')
  const [userName, setUserName] = useState('')
  const [existingTournaments, setExistingTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    // Load all tournaments from localStorage
    const tournaments: Tournament[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('tournament_') && !key.includes('_matches') && !key.includes('_fighters')) {
        try {
          const tournament = JSON.parse(localStorage.getItem(key)!)
          if (tournament && tournament.id && tournament.name) {
            tournaments.push(tournament)
          }
        } catch (e) {
          // Skip invalid entries
        }
      }
    }
    // Sort by creation date (newest first)
    tournaments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    setExistingTournaments(tournaments)
  }, [])

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
    // Refresh tournaments list
    setExistingTournaments([tournament, ...existingTournaments])
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

      {existingTournaments.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Bestaande Toernooien
            </Typography>
            <List>
              {existingTournaments.map((tournament, index) => (
                <Box key={tournament.id}>
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => navigate(`/tournament/${tournament.id}`)}>
                      <ListItemText
                        primary={tournament.name}
                        secondary={new Date(tournament.createdAt).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < existingTournaments.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      <Card sx={{ mt: 3 }}>
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

