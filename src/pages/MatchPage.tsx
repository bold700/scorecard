import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material'
import { PersonAdd } from '@mui/icons-material'
import { Match, User } from '../types'
import { useAuthStore } from '../store/useAuthStore'

export function MatchPage() {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [match, setMatch] = useState<Match | null>(null)

  useEffect(() => {
    // Load match from localStorage
    const savedMatches = localStorage.getItem(`tournament_${tournamentId}_matches`)
    if (savedMatches) {
      const matches: Match[] = JSON.parse(savedMatches)
      const foundMatch = matches.find((m) => m.id === matchId)
      if (foundMatch) {
        setMatch(foundMatch)
      }
    }
  }, [tournamentId, matchId])

  const handleJoinAsJudge = () => {
    if (!match) return
    
    // Get or create user
    let userId = user?.id
    if (!userId) {
      // Check if user exists in localStorage
      const savedUser = localStorage.getItem('auth_user')
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser)
        userId = parsedUser.id
      } else {
        // Create a new user ID
        userId = `user_${Date.now()}`
        const newUser: User = {
          id: userId,
          name: 'Publiek',
          role: 'public_user',
        }
        localStorage.setItem('auth_user', JSON.stringify(newUser))
        // Also update the store
        const { setUser } = useAuthStore.getState()
        setUser(newUser)
      }
    }
    
    navigate(`/tournament/${tournamentId}/match/${matchId}/scorecard/${userId}`)
  }

  if (!match) {
    return (
      <Container>
        <Typography>Wedstrijd niet gevonden</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {match.redFighter} vs {match.blueFighter}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={match.weightClass} size="small" />
          <Chip label={`${match.rounds} rondes`} size="small" />
          <Chip
            label={match.status === 'active' ? 'Actief' : match.status === 'completed' ? 'Voltooid' : 'Wachtend'}
            color={match.status === 'active' ? 'success' : 'default'}
            size="small"
          />
        </Stack>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Scorecard
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={handleJoinAsJudge}
                fullWidth
                size="large"
              >
                {user?.role === 'organizer' || user?.role === 'official_judge'
                  ? 'Scores Bijhouden (Officieel)'
                  : 'Scores Bijhouden (Publiek)'}
              </Button>
            </Box>

            {match.officialJudges.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Officiële Juryleden
                </Typography>
                <List>
                  {match.officialJudges.map((judgeId) => (
                    <ListItem key={judgeId} disablePadding>
                      <ListItemButton
                        onClick={() =>
                          navigate(`/tournament/${tournamentId}/match/${matchId}/scorecard/${judgeId}`)
                        }
                      >
                        <ListItemText primary={`Jurylid ${judgeId}`} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  )
}

