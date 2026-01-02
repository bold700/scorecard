import { Box, Typography, Card, CardContent, Stack } from '@mui/material'
import { Match, Scorecard, TournamentPhase } from '../types'
import { FighterAvatar } from './FighterAvatar'
import { useNavigate } from 'react-router-dom'

interface BracketVisualizationProps {
  matches: Match[]
  matchScorecards: Record<string, Scorecard[]>
  tournamentId: string
}

interface BracketMatch {
  match: Match
  scorecard?: Scorecard
  winner?: string
}

export function BracketVisualization({ matches, matchScorecards, tournamentId }: BracketVisualizationProps) {
  const navigate = useNavigate()

  // Group matches by phase
  const phases: TournamentPhase[] = ['kwartfinale', 'halve_finale', 'finale', 'bronzen_finale']
  const matchesByPhase = phases.reduce((acc, phase) => {
    acc[phase] = matches.filter(m => m.phase === phase)
    return acc
  }, {} as Record<TournamentPhase, Match[]>)

  // Get winner for a match
  const getMatchWinner = (match: Match): string | undefined => {
    const scorecards = matchScorecards[match.id] || []
    const officialScorecard = scorecards.find(s => s.isOfficial) || scorecards[0]
    if (officialScorecard && officialScorecard.winner) {
      return officialScorecard.winner === 'red' ? match.redFighter : match.blueFighter
    }
    return undefined
  }

  // Build bracket structure
  const buildBracket = () => {
    const bracket: Record<TournamentPhase, BracketMatch[]> = {
      kwartfinale: [],
      halve_finale: [],
      finale: [],
      bronzen_finale: [],
    }

    // Process each phase
    phases.forEach(phase => {
      const phaseMatches = matchesByPhase[phase]
      phaseMatches.forEach(match => {
        const scorecards = matchScorecards[match.id] || []
        const officialScorecard = scorecards.find(s => s.isOfficial) || scorecards[0]
        bracket[phase].push({
          match,
          scorecard: officialScorecard,
          winner: getMatchWinner(match),
        })
      })
    })

    return bracket
  }

  const bracket = buildBracket()

  // Check if there are any knockout matches
  const hasKnockoutMatches = phases.some(phase => bracket[phase].length > 0)
  if (!hasKnockoutMatches) {
    return null
  }

  const getPhaseLabel = (phase: TournamentPhase): string => {
    const labels: Record<TournamentPhase, string> = {
      kwartfinale: 'Kwartfinales',
      halve_finale: 'Halve Finales',
      finale: 'Finale',
      bronzen_finale: 'Bronzen Finale',
    }
    return labels[phase]
  }

  const handleMatchClick = (matchId: string) => {
    const savedUser = localStorage.getItem('auth_user')
    const user = savedUser ? JSON.parse(savedUser) : null
    if (user && user.id) {
      navigate(`/tournament/${tournamentId}/match/${matchId}/scorecard/${user.id}`)
    } else {
      navigate(`/tournament/${tournamentId}/match/${matchId}`)
    }
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Knockout Bracket
      </Typography>
      <Stack spacing={3}>
        {phases.map(phase => {
          if (bracket[phase].length === 0) return null

          return (
            <Box key={phase}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                {getPhaseLabel(phase)}
              </Typography>
              <Stack spacing={1.5} direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
                {bracket[phase].map(({ match, scorecard, winner }) => {
                  const redScore = scorecard?.totalRed || 0
                  const blueScore = scorecard?.totalBlue || 0
                  const isCompleted = !!winner

                  return (
                    <Card
                      key={match.id}
                      variant="outlined"
                      sx={{
                        minWidth: { xs: '100%', sm: 280 },
                        cursor: 'pointer',
                        border: isCompleted ? '2px solid' : '1px solid',
                        borderColor: isCompleted ? 'success.main' : 'divider',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                      onClick={() => handleMatchClick(match.id)}
                    >
                      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Stack spacing={1}>
                          {/* Red Fighter */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1,
                              borderRadius: 1,
                              bgcolor: winner === match.redFighter ? 'success.light' : 'transparent',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FighterAvatar name={match.redFighter} size={24} color="red" />
                              <Typography variant="body2" fontWeight={winner === match.redFighter ? 600 : 400}>
                                {match.redFighter}
                              </Typography>
                            </Box>
                            {scorecard && (
                              <Typography variant="body2" fontWeight={600}>
                                {redScore}
                              </Typography>
                            )}
                          </Box>

                          {/* VS */}
                          <Box sx={{ textAlign: 'center', py: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              VS
                            </Typography>
                          </Box>

                          {/* Blue Fighter */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1,
                              borderRadius: 1,
                              bgcolor: winner === match.blueFighter ? 'success.light' : 'transparent',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FighterAvatar name={match.blueFighter} size={24} color="blue" />
                              <Typography variant="body2" fontWeight={winner === match.blueFighter ? 600 : 400}>
                                {match.blueFighter}
                              </Typography>
                            </Box>
                            {scorecard && (
                              <Typography variant="body2" fontWeight={600}>
                                {blueScore}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  )
                })}
              </Stack>
            </Box>
          )
        })}
      </Stack>
    </Box>
  )
}
