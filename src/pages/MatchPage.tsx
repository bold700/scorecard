import { useMemo, useState, useEffect } from 'react'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Grid,
} from '@mui/material'
import { PersonAdd } from '@mui/icons-material'
import { Match, Scorecard, User } from '../types'
import { useAuthStore } from '../store/useAuthStore'
import { firebaseService } from '../lib/firebase'
import { createAggregatedScorecard } from '../lib/scorecardAggregation'

export function MatchPage() {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [match, setMatch] = useState<Match | null>(null)
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [tempName, setTempName] = useState('')
  const [scorecards, setScorecards] = useState<Scorecard[]>([])
  const [expandedJudgeId, setExpandedJudgeId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const matches = await firebaseService.getMatches(tournamentId!)
      const foundMatch = matches.find((m) => m.id === matchId) || null
      setMatch(foundMatch)
      if (foundMatch) {
        const all = await firebaseService.getAllScorecardsForMatch(foundMatch.id)
        setScorecards(all as Scorecard[])
      }
    }
    load()
  }, [tournamentId, matchId])

  useEffect(() => {
    if (!matchId) return
    // Realtime updates zodat persoon A direct ziet wat B invult
    const unsubscribe = firebaseService.subscribeToScorecardsForMatch(matchId, (all) => {
      setScorecards(all as Scorecard[])
    })
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [matchId])

  const scoringScorecards = useMemo(() => {
    // Filter “lege” scorecards eruit zodat gemiddelde niet verdund wordt door null/0 entries
    return (scorecards || []).filter((sc) => {
      const hasTotals = (sc.totalRed || 0) > 0 || (sc.totalBlue || 0) > 0
      const hasEvents = Array.isArray((sc as any).events) && (sc as any).events.length > 0
      return hasTotals || hasEvents
    })
  }, [scorecards])

  const aggregated = useMemo(() => {
    if (!matchId) return null
    return createAggregatedScorecard(matchId, scoringScorecards) || null
  }, [matchId, scoringScorecards])

  const ensureUser = () => {
    let current = user
    if (!current) {
      const savedUser = localStorage.getItem('auth_user')
      current = savedUser ? JSON.parse(savedUser) : null
    }
    if (!current) {
      const newUser: User = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `user_${Date.now()}`,
        name: '',
        role: 'public_user',
      }
      localStorage.setItem('auth_user', JSON.stringify(newUser))
      const { setUser } = useAuthStore.getState()
      setUser(newUser)
      current = newUser
    }
    return current
  }

  const handleJoinAsJudge = () => {
    if (!match) return
    
    // Get or create user
    const u = ensureUser()
    if (!u.name || u.name.trim().length < 2) {
      setTempName(u.name || '')
      setNameDialogOpen(true)
      return
    }

    navigate(`/tournament/${tournamentId}/match/${matchId}/scorecard/${u.id}`)
  }

  const saveNameAndContinue = () => {
    const name = tempName.trim()
    if (name.length < 2) return
    const current = ensureUser()
    const updated: User = { ...current, name }
    localStorage.setItem('auth_user', JSON.stringify(updated))
    const { setUser } = useAuthStore.getState()
    setUser(updated)
    setNameDialogOpen(false)
    navigate(`/tournament/${tournamentId}/match/${matchId}/scorecard/${updated.id}`)
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
                  : 'Scores Bijhouden (Jury)'}
              </Button>
            </Box>

            {aggregated && match && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Gemiddelde (alle jury)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Gebaseerd op {scoringScorecards.length} scorecard(s)
                </Typography>

                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Rood {aggregated.totalRed}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      Blauw {aggregated.totalBlue}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    {aggregated.rounds.map((r) => (
                      <Grid item xs={12} key={r.round}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Ronde {r.round}
                          </Typography>
                          <Typography variant="body2">
                            {r.redTotal} - {r.blueTotal}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              </Box>
            )}

            {scorecards.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Ingevulde scorecards
                </Typography>
                <List>
                  {scorecards.map((sc) => {
                    const title = sc.judgeName ? sc.judgeName : `Jurylid ${sc.userId.slice(0, 6)}`
                    const isExpanded = expandedJudgeId === sc.userId
                    return (
                      <Box key={`${sc.matchId}_${sc.userId}`}>
                        <ListItem disablePadding>
                          <ListItemButton
                            onClick={() => {
                              setExpandedJudgeId(isExpanded ? null : sc.userId)
                            }}
                          >
                            <ListItemText
                              primary={title}
                              secondary={`Rood ${sc.totalRed} - Blauw ${sc.totalBlue}`}
                            />
                          </ListItemButton>
                          <Button
                            onClick={() => navigate(`/tournament/${tournamentId}/match/${matchId}/scorecard/${sc.userId}`)}
                            size="small"
                            sx={{ mr: 1 }}
                          >
                            Open
                          </Button>
                        </ListItem>

                        {isExpanded && sc.rounds?.length > 0 && (
                          <Box sx={{ pl: 2, pr: 2, pb: 2 }}>
                            <Card variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Ronde scores
                              </Typography>
                              <Grid container spacing={1}>
                                {sc.rounds.map((r) => (
                                  <Grid item xs={12} key={r.round}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="body2" color="text.secondary">
                                        Ronde {r.round}
                                      </Typography>
                                      <Typography variant="body2">
                                        {r.redTotal} - {r.blueTotal}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                ))}
                              </Grid>
                            </Card>
                          </Box>
                        )}

                        <Divider />
                      </Box>
                    )
                  })}
                </List>
              </Box>
            )}

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

      <Dialog open={nameDialogOpen} onClose={() => setNameDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Jouw naam</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Zo kunnen we duidelijk tonen wie welke score invult (en voorkom je dat je per ongeluk iemand anders overschrijft).
          </Typography>
          <TextField
            label="Naam"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNameDialogOpen(false)}>Annuleren</Button>
          <Button variant="contained" onClick={saveNameAndContinue} disabled={tempName.trim().length < 2}>
            Doorgaan
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

