import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Stack,
  Collapse,
  Button,
} from '@mui/material'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import { Match, Scorecard } from '../types'

export function DashboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const [tournamentName, setTournamentName] = useState<string>('')
  const [matches, setMatches] = useState<Match[]>([])
  const [matchResults, setMatchResults] = useState<Record<string, any>>({})
  const [expandedScorecards, setExpandedScorecards] = useState<Record<string, boolean>>({})

  useEffect(() => {
    // Load tournament info
    const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament)
      setTournamentName(tournament.name || 'Toernooi')
    }
    
    // Load matches
    const savedMatches = localStorage.getItem(`tournament_${tournamentId}_matches`)
    if (savedMatches) {
      const matchesData: Match[] = JSON.parse(savedMatches)
      setMatches(matchesData)

      // Load scorecards for each match
      const results: Record<string, any> = {}
      matchesData.forEach((match) => {
        const scorecards: Scorecard[] = []
        // Get all scorecards for this match
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(`scorecard_${match.id}_`)) {
            const scorecard = JSON.parse(localStorage.getItem(key)!)
            scorecards.push(scorecard)
          }
        }
        results[match.id] = {
          official: scorecards.filter((s) => s.isOfficial),
          public: scorecards.filter((s) => !s.isOfficial),
        }
      })
      setMatchResults(results)
    }
  }, [tournamentId])

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {tournamentName || 'Toernooi'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overzicht van alle wedstrijden en scores
        </Typography>
      </Box>

      {matches.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Nog geen wedstrijden
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {matches.map((match) => {
            const results = matchResults[match.id]
            const officialScores = results?.official || []
            const publicScores = results?.public || []

            return (
              <Card 
                key={match.id} 
                variant="outlined"
                sx={{ mb: 2 }}
              >
                <CardContent>
                  {officialScores.length > 0 ? (
                    <Stack spacing={3}>
                      {officialScores.map((scorecard: Scorecard, idx: number) => {
                        const scorecardKey = `${match.id}_${idx}`
                        const maxPossibleScore = match.rounds * 10
                        const winner = scorecard.winner
                        
                        return (
                          <Box key={idx}>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                display: 'block',
                                mb: 2,
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              Jurylid {idx + 1}
                            </Typography>
                            
                            {/* Score Display */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between',
                                px: 2,
                                py: 3,
                                mb: 1,
                              }}
                            >
                                  {/* ROOD */}
                                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography
                                      variant="overline"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'error.main',
                                        display: 'block',
                                        mb: 0.5,
                                      }}
                                    >
                                      ROOD
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                                      <Typography
                                        variant="h3"
                                        sx={{
                                          fontSize: '3.5rem',
                                          fontWeight: 700,
                                          color: 'error.main',
                                          lineHeight: 1,
                                        }}
                                      >
                                        {scorecard.totalRed}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: '0.875rem',
                                          fontWeight: 400,
                                          color: 'error.main',
                                          lineHeight: 1,
                                        }}
                                      >
                                        /{maxPossibleScore}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        color: 'text.primary',
                                        fontSize: '1rem',
                                        mb: winner === 'red' ? 0.5 : 0,
                                      }}
                                    >
                                      {match.redFighter}
                                    </Typography>
                                    {winner === 'red' && (
                                      <Chip
                                        label="Winnaar"
                                        color="success"
                                        size="small"
                                        sx={{
                                          mt: 0.5,
                                          fontSize: '0.7rem',
                                          height: '20px',
                                        }}
                                      />
                                    )}
                                  </Box>

                                  {/* VS */}
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      height: '2.5rem',
                                      mx: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="h6"
                                      sx={{
                                        color: 'text.secondary',
                                        fontWeight: 400,
                                      }}
                                    >
                                      VS
                                    </Typography>
                                  </Box>

                                  {/* BLAUW */}
                                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                                    <Typography
                                      variant="overline"
                                      sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'info.main',
                                        display: 'block',
                                        mb: 0.5,
                                      }}
                                    >
                                      BLAUW
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                                      <Typography
                                        variant="h3"
                                        sx={{
                                          fontSize: '3.5rem',
                                          fontWeight: 700,
                                          color: 'info.main',
                                          lineHeight: 1,
                                        }}
                                      >
                                        {scorecard.totalBlue}
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: '0.875rem',
                                          fontWeight: 400,
                                          color: 'info.main',
                                          lineHeight: 1,
                                        }}
                                      >
                                        /{maxPossibleScore}
                                      </Typography>
                                    </Box>
                                    <Typography
                                      variant="body1"
                                      sx={{
                                        color: 'text.primary',
                                        fontSize: '1rem',
                                        mb: winner === 'blue' ? 0.5 : 0,
                                      }}
                                    >
                                      {match.blueFighter}
                                    </Typography>
                                    {winner === 'blue' && (
                                      <Chip
                                        label="Winnaar"
                                        color="success"
                                        size="small"
                                        sx={{
                                          mt: 0.5,
                                          fontSize: '0.7rem',
                                          height: '20px',
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>

                                {/* Round Scores - Expandable */}
                                {scorecard.rounds && scorecard.rounds.length > 0 && (
                                  <Box sx={{ mt: 2 }}>
                                    <Button
                                      variant="text"
                                      size="small"
                                      onClick={() => {
                                        setExpandedScorecards((prev) => ({
                                          ...prev,
                                          [scorecardKey]: !prev[scorecardKey],
                                        }))
                                      }}
                                      endIcon={expandedScorecards[scorecardKey] ? <ExpandLess /> : <ExpandMore />}
                                      sx={{ color: 'text.secondary' }}
                                    >
                                      {expandedScorecards[scorecardKey] ? 'Verberg' : 'Toon'} ronde scores
                                    </Button>
                                    <Collapse in={expandedScorecards[scorecardKey]}>
                                      <Box sx={{ mt: 2 }}>
                                        <Grid container spacing={2}>
                                          {scorecard.rounds.map((round) => (
                                            <Grid item xs={12} key={round.round}>
                                              <Card 
                                                variant="outlined" 
                                                sx={{ 
                                                  p: 2,
                                                  bgcolor: 'background.paper',
                                                  borderColor: 'divider',
                                                }}
                                              >
                                                <Typography 
                                                  variant="subtitle2" 
                                                  color="text.secondary" 
                                                  sx={{ 
                                                    display: 'block', 
                                                    mb: 1.5,
                                                    fontWeight: 600,
                                                    fontSize: '0.75rem',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                  }}
                                                >
                                                  Ronde {round.round}
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Typography 
                                                      variant="overline" 
                                                      sx={{ 
                                                        fontSize: '0.65rem',
                                                        color: 'error.main',
                                                        fontWeight: 600,
                                                        display: 'block',
                                                        mb: 0.5,
                                                      }}
                                                    >
                                                      ROOD
                                                    </Typography>
                                                    <Typography 
                                                      variant="h5" 
                                                      color="error.main" 
                                                      sx={{ 
                                                        fontWeight: 700,
                                                        fontSize: '1.75rem',
                                                      }}
                                                    >
                                                      {round.redTotal}
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ mx: 3 }}>
                                                    <Typography 
                                                      variant="body2" 
                                                      color="text.secondary"
                                                      sx={{ fontWeight: 500 }}
                                                    >
                                                      VS
                                                    </Typography>
                                                  </Box>
                                                  <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Typography 
                                                      variant="overline" 
                                                      sx={{ 
                                                        fontSize: '0.65rem',
                                                        color: 'info.main',
                                                        fontWeight: 600,
                                                        display: 'block',
                                                        mb: 0.5,
                                                      }}
                                                    >
                                                      BLAUW
                                                    </Typography>
                                                    <Typography 
                                                      variant="h5" 
                                                      color="info.main" 
                                                      sx={{ 
                                                        fontWeight: 700,
                                                        fontSize: '1.75rem',
                                                      }}
                                                    >
                                                      {round.blueTotal}
                                                    </Typography>
                                                  </Box>
                                                </Box>
                                              </Card>
                                            </Grid>
                                          ))}
                                        </Grid>
                                      </Box>
                                    </Collapse>
                                  </Box>
                                )}
                            </Box>
                          )
                        })}
                      </Stack>
                  ) : (
                    <Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          px: 2,
                          py: 3,
                          mb: 1,
                        }}
                      >
                        {/* ROOD */}
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                          <Typography
                            variant="overline"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'error.main',
                              display: 'block',
                              mb: 0.5,
                            }}
                          >
                            ROOD
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                            <Typography
                              variant="h3"
                              sx={{
                                fontSize: '3.5rem',
                                fontWeight: 700,
                                color: 'error.main',
                                lineHeight: 1,
                              }}
                            >
                              0
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 400,
                                color: 'error.main',
                                lineHeight: 1,
                              }}
                            >
                              /{match.rounds * 10}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'text.primary',
                              fontSize: '1rem',
                            }}
                          >
                            {match.redFighter}
                          </Typography>
                        </Box>

                        {/* VS */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            height: '2.5rem',
                            mx: 2,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              color: 'text.secondary',
                              fontWeight: 400,
                            }}
                          >
                            VS
                          </Typography>
                        </Box>

                        {/* BLAUW */}
                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                          <Typography
                            variant="overline"
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: 'info.main',
                              display: 'block',
                              mb: 0.5,
                            }}
                          >
                            BLAUW
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5 }}>
                            <Typography
                              variant="h3"
                              sx={{
                                fontSize: '3.5rem',
                                fontWeight: 700,
                                color: 'info.main',
                                lineHeight: 1,
                              }}
                            >
                              0
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontSize: '0.875rem',
                                fontWeight: 400,
                                color: 'info.main',
                                lineHeight: 1,
                              }}
                            >
                              /{match.rounds * 10}
                            </Typography>
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              color: 'text.primary',
                              fontSize: '1rem',
                            }}
                          >
                            {match.blueFighter}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </Stack>
      )}
    </Container>
  )
}

