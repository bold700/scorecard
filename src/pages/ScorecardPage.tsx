import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Button,
  Stack,
  Grid,
  Stepper,
  Step,
  StepLabel,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material'
import { CheckCircle, ArrowBack, ArrowForward, Delete } from '@mui/icons-material'
import { Scorecard, ScoreEvent, Match, RoundScore } from '../types'
import { useAuthStore } from '../store/useAuthStore'
import { FighterAvatar } from '../components/FighterAvatar'
import { firebaseService } from '../lib/firebase'

export function ScorecardPage() {
  const { tournamentId, matchId, userId } = useParams<{
    tournamentId: string
    matchId: string
    userId: string
  }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [match, setMatch] = useState<Match | null>(null)
  const [scorecard, setScorecard] = useState<Scorecard | null>(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [completedRounds, setCompletedRounds] = useState<number[]>([])

  useEffect(() => {
    const loadMatch = async () => {
      // Load match from Firebase (with localStorage fallback)
      const matches = await firebaseService.getMatches(tournamentId!)
      const foundMatch = matches.find((m) => m.id === matchId)
      
      if (foundMatch) {
        setMatch(foundMatch)
        setCurrentRound(1)

        // Load or create scorecard for THIS user only
        const loadedScorecard = await firebaseService.getScorecard(matchId!, userId!)
        if (loadedScorecard) {
          setScorecard(loadedScorecard)
          // Load completed rounds
          const completed = loadedScorecard.rounds
            .filter((r: RoundScore) => r.redTotal > 0 || r.blueTotal > 0)
            .map((r: RoundScore) => r.round)
          setCompletedRounds(completed)
        } else {
          // Create new scorecard for this user
          const newScorecard: Scorecard = {
            matchId: matchId!,
            userId: userId!,
            isOfficial: false, // Users zijn geen official judges, alleen hun eigen scores
            rounds: Array.from({ length: foundMatch.rounds }, (_, i) => ({
              round: i + 1,
              redPoints: 0,
              bluePoints: 0,
              redDeductions: 0,
              blueDeductions: 0,
              redTotal: 0,
              blueTotal: 0,
            })),
            totalRed: 0,
            totalBlue: 0,
            winner: null,
            events: [],
          }
          setScorecard(newScorecard)
          await firebaseService.saveScorecard(newScorecard)
        }
      }
    }
    
    loadMatch()
  }, [tournamentId, matchId, userId, user])

  const handleScoreEvent = async (corner: 'red' | 'blue', type: 'point' | 'deduction', value: number) => {
    if (!scorecard || !match) return

    const event: ScoreEvent = {
      id: `event_${Date.now()}`,
      matchId: matchId!,
      userId: userId!,
      round: currentRound,
      corner,
      type,
      value,
      timestamp: Date.now(),
    }

    const updatedEvents = [...scorecard.events, event]
    const updatedRounds = calculateRounds(updatedEvents, match.rounds)
    const updatedScorecard: Scorecard = {
      ...scorecard,
      events: updatedEvents,
      rounds: updatedRounds,
      totalRed: updatedRounds.reduce((sum, r) => sum + r.redTotal, 0),
      totalBlue: updatedRounds.reduce((sum, r) => sum + r.blueTotal, 0),
      winner:
        updatedRounds.reduce((sum, r) => sum + r.redTotal, 0) >
        updatedRounds.reduce((sum, r) => sum + r.blueTotal, 0)
          ? 'red'
          : updatedRounds.reduce((sum, r) => sum + r.redTotal, 0) <
            updatedRounds.reduce((sum, r) => sum + r.blueTotal, 0)
          ? 'blue'
          : null,
    }

    setScorecard(updatedScorecard)
    // Save to Firebase
    await firebaseService.saveScorecard(updatedScorecard)
    // Also save to localStorage as backup
    localStorage.setItem(`scorecard_${matchId}_${userId}`, JSON.stringify(updatedScorecard))
  }

  const calculateRounds = (events: ScoreEvent[], totalRounds: number): RoundScore[] => {
    const rounds: RoundScore[] = Array.from({ length: totalRounds }, (_, i) => ({
      round: i + 1,
      redPoints: 0,
      bluePoints: 0,
      redDeductions: 0,
      blueDeductions: 0,
      redTotal: 0,
      blueTotal: 0,
    }))

    // First pass: count points (turf marks) and deductions
    events.forEach((event) => {
      const roundIndex = event.round - 1
      if (roundIndex >= 0 && roundIndex < rounds.length) {
        if (event.type === 'point') {
          // Turf marks - count who scores more
          if (event.corner === 'red') {
            rounds[roundIndex].redPoints += event.value
          } else {
            rounds[roundIndex].bluePoints += event.value
          }
        } else {
          // Deductions - count once per round
          if (event.corner === 'red') {
            rounds[roundIndex].redDeductions += Math.abs(event.value)
          } else {
            rounds[roundIndex].blueDeductions += Math.abs(event.value)
          }
        }
      }
    })

    // Second pass: Calculate round scores based on who has more points
    rounds.forEach((round) => {
      const pointDiff = round.redPoints - round.bluePoints
      
      if (pointDiff > 0) {
        // Red wins: Red gets 10, Blue gets 10 - difference
        round.redTotal = 10 - round.redDeductions
        round.blueTotal = Math.max(0, (10 - pointDiff) - round.blueDeductions)
      } else if (pointDiff < 0) {
        // Blue wins: Blue gets 10, Red gets 10 - difference
        round.blueTotal = 10 - round.blueDeductions
        round.redTotal = Math.max(0, (10 + pointDiff) - round.redDeductions) // pointDiff is negative
      } else {
        // Equal points: Both get 10
        round.redTotal = 10 - round.redDeductions
        round.blueTotal = 10 - round.blueDeductions
      }
      
      // Ensure totals don't go below 0
      round.redTotal = Math.max(0, round.redTotal)
      round.blueTotal = Math.max(0, round.blueTotal)
    })

    return rounds
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!scorecard || !match) return

    const updatedEvents = scorecard.events.filter((e) => e.id !== eventId)
    const updatedRounds = calculateRounds(updatedEvents, match.rounds)
    const updatedScorecard: Scorecard = {
      ...scorecard,
      events: updatedEvents,
      rounds: updatedRounds,
      totalRed: updatedRounds.reduce((sum, r) => sum + r.redTotal, 0),
      totalBlue: updatedRounds.reduce((sum, r) => sum + r.blueTotal, 0),
      winner:
        updatedRounds.reduce((sum, r) => sum + r.redTotal, 0) >
        updatedRounds.reduce((sum, r) => sum + r.blueTotal, 0)
          ? 'red'
          : updatedRounds.reduce((sum, r) => sum + r.redTotal, 0) <
            updatedRounds.reduce((sum, r) => sum + r.blueTotal, 0)
          ? 'blue'
          : null,
    }

    setScorecard(updatedScorecard)
    // Save to Firebase
    await firebaseService.saveScorecard(updatedScorecard)
    // Also save to localStorage as backup
    localStorage.setItem(`scorecard_${matchId}_${userId}`, JSON.stringify(updatedScorecard))
  }

  if (!match || !scorecard) {
    return (
      <Container>
        <Typography>Laden...</Typography>
      </Container>
    )
  }

  const currentRoundData = scorecard.rounds[currentRound - 1]

  return (
    <Container maxWidth="sm" sx={{ py: 2, pb: 4, px: 0 }}>
      {/* Round Stepper */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Stepper activeStep={currentRound - 1} alternativeLabel>
          {Array.from({ length: match.rounds }, (_, i) => (
            <Step key={i + 1} completed={completedRounds.includes(i + 1)}>
              <StepLabel
                onClick={() => setCurrentRound(i + 1)}
                sx={{ cursor: 'pointer' }}
                StepIconComponent={({ active, completed }) => (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: completed
                        ? 'primary.main'
                        : active
                        ? 'primary.main'
                        : 'action.disabledBackground',
                      color: completed || active ? 'primary.contrastText' : 'action.disabled',
                      fontWeight: active || completed ? 600 : 400,
                    }}
                  >
                    {completed ? <CheckCircle sx={{ fontSize: 20 }} /> : i + 1}
                  </Box>
                )}
              >
                Ronde {i + 1}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Navigation Buttons */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ArrowBack />}
              onClick={() => {
                if (currentRound > 1) {
                  setCurrentRound(currentRound - 1)
                }
              }}
              disabled={currentRound === 1}
              size="large"
            >
              Vorige
            </Button>
          </Grid>
          <Grid item xs={6}>
            {currentRound < match.rounds ? (
              <Button
                variant="contained"
                fullWidth
                endIcon={<ArrowForward />}
                onClick={() => {
                  const updatedCompleted = [...completedRounds, currentRound]
                  setCompletedRounds(updatedCompleted)
                  setCurrentRound(currentRound + 1)
                  // Save completed rounds
                  localStorage.setItem(`completed_rounds_${matchId}_${userId}`, JSON.stringify(updatedCompleted))
                }}
                size="large"
              >
                Ronde {currentRound + 1}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={() => {
                  // Mark final round as completed
                  const updatedCompleted = [...completedRounds, currentRound]
                  setCompletedRounds(updatedCompleted)
                  localStorage.setItem(`completed_rounds_${matchId}_${userId}`, JSON.stringify(updatedCompleted))
                  
                  // Mark match as completed
                  const savedMatches = localStorage.getItem(`tournament_${tournamentId}_matches`)
                  if (savedMatches) {
                    const matches: Match[] = JSON.parse(savedMatches)
                    const updatedMatches = matches.map((m) =>
                      m.id === matchId ? { ...m, status: 'completed' as const, completedAt: Date.now() } : m
                    )
                    localStorage.setItem(`tournament_${tournamentId}_matches`, JSON.stringify(updatedMatches))
                  }
                  
                  // Navigate back to tournament overview
                  navigate(`/tournament/${tournamentId}`)
                }}
                size="large"
              >
                Beëindigen
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Main Score Display */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 4,
          mb: 2,
        }}
      >
        {/* ROOD */}
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: '4rem',
              fontWeight: 700,
              color: 'error.main',
              lineHeight: 1,
              mb: 2,
            }}
          >
            {currentRoundData.redTotal}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <FighterAvatar name={match.redFighter} size={32} color="red" />
            <Typography
              variant="h5"
              sx={{
                color: 'text.primary',
                fontSize: '1.5rem',
                fontWeight: 600,
              }}
            >
              {match.redFighter}
            </Typography>
          </Box>
        </Box>

        {/* VS */}
        <Typography
          variant="h6"
          sx={{
            mx: 2,
            color: 'text.secondary',
            fontWeight: 400,
          }}
        >
          VS
        </Typography>

        {/* BLAUW */}
        <Box sx={{ flex: 1, textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: '4rem',
              fontWeight: 700,
              color: 'info.main',
              lineHeight: 1,
              mb: 2,
            }}
          >
            {currentRoundData.blueTotal}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <FighterAvatar name={match.blueFighter} size={32} color="blue" />
            <Typography
              variant="h5"
              sx={{
                color: 'text.primary',
                fontSize: '1.5rem',
                fontWeight: 600,
              }}
            >
              {match.blueFighter}
            </Typography>
          </Box>
        </Box>
      </Box>


      {/* Event Logging - Score Input */}
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Logging - Ronde {currentRound}
        </Typography>
            <Grid container spacing={2}>
              {/* ROOD Events - Left */}
              <Grid item xs={6}>
                <Typography variant="caption" color="error.main" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  ROOD
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    fullWidth
                    onClick={() => handleScoreEvent('red', 'point', 1)}
                    sx={{
                      minHeight: '56px',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    + 1 Punt
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="large"
                    fullWidth
                    onClick={() => handleScoreEvent('red', 'deduction', -1)}
                    sx={{
                      minHeight: '56px',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    -1 Aftrek
                  </Button>
                </Stack>
                <List dense sx={{ mt: 2 }}>
                  {scorecard.events
                    .filter((e) => e.round === currentRound && e.corner === 'red')
                    .reverse()
                    .map((event, index) => (
                      <Box key={event.id}>
                        <ListItem
                          sx={{ px: 0 }}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteEvent(event.id)}
                              color="error"
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {event.type === 'point' ? `+${event.value} Punt` : `-${Math.abs(event.value)} Aftrek`}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {new Date(event.timestamp).toLocaleTimeString('nl-NL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < scorecard.events.filter((e) => e.round === currentRound && e.corner === 'red').length - 1 && (
                          <Divider />
                        )}
                      </Box>
                    ))}
                </List>
              </Grid>

              {/* BLAUW Events - Right */}
              <Grid item xs={6}>
                <Typography variant="caption" color="info.main" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                  BLAUW
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="contained"
                    color="info"
                    size="large"
                    fullWidth
                    onClick={() => handleScoreEvent('blue', 'point', 1)}
                    sx={{
                      minHeight: '56px',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    + 1 Punt
                  </Button>
                  <Button
                    variant="outlined"
                    color="info"
                    size="large"
                    fullWidth
                    onClick={() => handleScoreEvent('blue', 'deduction', -1)}
                    sx={{
                      minHeight: '56px',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    -1 Aftrek
                  </Button>
                </Stack>
                <List dense sx={{ mt: 2 }}>
                  {scorecard.events
                    .filter((e) => e.round === currentRound && e.corner === 'blue')
                    .reverse()
                    .map((event, index) => (
                      <Box key={event.id}>
                        <ListItem
                          sx={{ px: 0 }}
                          secondaryAction={
                            <IconButton
                              edge="end"
                              aria-label="delete"
                              onClick={() => handleDeleteEvent(event.id)}
                              color="info"
                              size="small"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                {event.type === 'point' ? `+${event.value} Punt` : `-${Math.abs(event.value)} Aftrek`}
                              </Typography>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {new Date(event.timestamp).toLocaleTimeString('nl-NL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < scorecard.events.filter((e) => e.round === currentRound && e.corner === 'blue').length - 1 && (
                          <Divider />
                        )}
                      </Box>
                    ))}
                </List>
              </Grid>
            </Grid>
      </Box>


    </Container>
  )
}

