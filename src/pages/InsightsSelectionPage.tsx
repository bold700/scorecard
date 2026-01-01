import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import { Tournament } from '../types'

export function InsightsSelectionPage() {
  const navigate = useNavigate()
  const [tournaments, setTournaments] = useState<Tournament[]>([])

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = () => {
    const tournamentsList: Tournament[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('tournament_') && !key.includes('_matches') && !key.includes('_fighters')) {
        try {
          const tournament = JSON.parse(localStorage.getItem(key)!)
          if (tournament && tournament.id && tournament.name) {
            tournamentsList.push(tournament)
          }
        } catch (e) {
          // Skip invalid entries
        }
      }
    }
    tournamentsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    setTournaments(tournamentsList)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Selecteer een toernooi om de insights te bekijken
        </Typography>
      </Box>

      {tournaments.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nog geen toernooien beschikbaar
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {tournaments.map((tournament) => (
            <Card 
              key={tournament.id}
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                navigate(`/tournament/${tournament.id}/dashboard`)
              }}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {tournament.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(tournament.createdAt).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
