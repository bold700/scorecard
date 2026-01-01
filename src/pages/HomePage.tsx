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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Delete } from '@mui/icons-material'
import { useAuthStore } from '../store/useAuthStore'
import { Tournament } from '../types'

interface HomePageProps {
  createDialogOpen: boolean
  setCreateDialogOpen: (open: boolean) => void
}

export function HomePage({ createDialogOpen, setCreateDialogOpen }: HomePageProps) {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [existingTournaments, setExistingTournaments] = useState<Tournament[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null)
  const [tournamentName, setTournamentName] = useState('')

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = () => {
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
  }

  const handleCreateTournament = () => {
    if (!tournamentName.trim()) return

    // Create tournament (in real app, this would be saved to Firebase)
    const tournamentId = `tournament_${Date.now()}`
    // Save tournament info to localStorage
    const tournament = {
      id: tournamentId,
      name: tournamentName,
      createdAt: Date.now(),
      createdBy: user?.id || 'anonymous',
      fighters: [],
      matches: [],
      rounds: 3,
    }
    localStorage.setItem(`tournament_${tournamentId}`, JSON.stringify(tournament))
    
    // Reset form
    setTournamentName('')
    setCreateDialogOpen(false)
    
    // Refresh tournaments list
    loadTournaments()
    navigate(`/tournament/${tournamentId}`)
  }

  const handleDeleteTournament = (tournament: Tournament, e: React.MouseEvent) => {
    e.stopPropagation()
    setTournamentToDelete(tournament)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteTournament = () => {
    if (!tournamentToDelete) return

    // Delete tournament and all related data
    localStorage.removeItem(`tournament_${tournamentToDelete.id}`)
    localStorage.removeItem(`tournament_${tournamentToDelete.id}_matches`)
    localStorage.removeItem(`tournament_${tournamentToDelete.id}_fighters`)
    
    // Delete all scorecards for matches in this tournament
    const savedMatches = localStorage.getItem(`tournament_${tournamentToDelete.id}_matches`)
    if (savedMatches) {
      const matches = JSON.parse(savedMatches)
      matches.forEach((match: any) => {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(`scorecard_${match.id}_`)) {
            localStorage.removeItem(key)
          }
        }
      })
    }

    // Remove from list
    loadTournaments()
    setDeleteDialogOpen(false)
    setTournamentToDelete(null)
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Toernooien
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overzicht van alle toernooien
        </Typography>
      </Box>

      {existingTournaments.length > 0 ? (
        <Stack spacing={2}>
          {existingTournaments.map((tournament) => (
            <Card 
              key={tournament.id}
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/tournament/${tournament.id}`)}
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
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteTournament(tournament, e)
                    }}
                    color="error"
                    sx={{ ml: 1 }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nog geen toernooien. Maak er een aan met de knop hieronder.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Create Tournament Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nieuw Toernooi Aanmaken</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Toernooi naam"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              fullWidth
              required
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && tournamentName.trim()) {
                  handleCreateTournament()
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Annuleren</Button>
          <Button
            onClick={handleCreateTournament}
            disabled={!tournamentName.trim()}
            variant="contained"
          >
            Aanmaken
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Toernooi Verwijderen</DialogTitle>
        <DialogContent>
          <Typography>
            Weet je zeker dat je "{tournamentToDelete?.name}" wilt verwijderen? 
            Alle wedstrijden, vechters en scores worden ook verwijderd. Deze actie kan niet ongedaan worden gemaakt.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Annuleren</Button>
          <Button onClick={confirmDeleteTournament} color="error" variant="contained">
            Verwijderen
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  )
}

