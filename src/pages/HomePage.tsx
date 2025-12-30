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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import { Add, Dashboard, Delete } from '@mui/icons-material'
import { useAuthStore } from '../store/useAuthStore'
import { Tournament } from '../types'

export function HomePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [tournamentName, setTournamentName] = useState('')
  const [userName, setUserName] = useState('')
  const [existingTournaments, setExistingTournaments] = useState<Tournament[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null)

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
    setExistingTournaments(existingTournaments.filter(t => t.id !== tournamentToDelete.id))
    setDeleteDialogOpen(false)
    setTournamentToDelete(null)
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
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => handleDeleteTournament(tournament, e)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
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

