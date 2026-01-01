import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Divider,
  LinearProgress,
} from '@mui/material'
import { 
  SportsMma, 
  EmojiEvents, 
  TrendingUp, 
  Assessment,
  People,
  CheckCircle,
  Schedule,
} from '@mui/icons-material'
import { Match, Scorecard, Fighter } from '../types'
import { FighterAvatar } from '../components/FighterAvatar'

interface FighterStats {
  name: string
  wins: number
  losses: number
  draws: number
  totalPoints: number
  matchesPlayed: number
  averageScore: number
  winPercentage: number
}

export function DashboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const [tournamentName, setTournamentName] = useState<string>('')
  const [matches, setMatches] = useState<Match[]>([])
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [insights, setInsights] = useState({
    totalMatches: 0,
    completedMatches: 0,
    totalFighters: 0,
    totalRounds: 0,
    averageScore: 0,
    topFighters: [] as FighterStats[],
    mostDominantWins: [] as Array<{ match: Match; scorecard: Scorecard; margin: number }>,
  })

  useEffect(() => {
    // Load tournament info
    const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament)
      setTournamentName(tournament.name || 'Toernooi')
    }
    
    // Load fighters
    const savedFighters = localStorage.getItem(`tournament_${tournamentId}_fighters`)
    if (savedFighters) {
      const fightersData: Fighter[] = JSON.parse(savedFighters)
      setFighters(fightersData)
    }
    
    // Load matches
    const savedMatches = localStorage.getItem(`tournament_${tournamentId}_matches`)
    if (savedMatches) {
      const matchesData: Match[] = JSON.parse(savedMatches)
      setMatches(matchesData)
      calculateInsights(matchesData)
    }
  }, [tournamentId])

  const calculateInsights = (matchesData: Match[]) => {
    const statsMap = new Map<string, FighterStats>()
    const completedMatches: Array<{ match: Match; scorecard: Scorecard }> = []
    let totalScore = 0
    let totalRounds = 0

    // Initialize stats for all fighters
    fighters.forEach((fighter) => {
      statsMap.set(fighter.name, {
        name: fighter.name,
        wins: 0,
        losses: 0,
        draws: 0,
        totalPoints: 0,
        matchesPlayed: 0,
        averageScore: 0,
        winPercentage: 0,
      })
    })

    // Process each match
    matchesData.forEach((match) => {
      // Get official scorecard for this match
      let officialScorecard: Scorecard | null = null
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`scorecard_${match.id}_`)) {
          const scorecard: Scorecard = JSON.parse(localStorage.getItem(key)!)
          if (scorecard.isOfficial) {
            officialScorecard = scorecard
            break
          }
        }
      }

      // If no official scorecard, try to get any scorecard
      if (!officialScorecard) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(`scorecard_${match.id}_`)) {
            officialScorecard = JSON.parse(localStorage.getItem(key)!)
            break
          }
        }
      }

      if (officialScorecard && officialScorecard.winner) {
        completedMatches.push({ match, scorecard: officialScorecard })
        totalScore += officialScorecard.totalRed + officialScorecard.totalBlue
        totalRounds += match.rounds

        const redStats = statsMap.get(match.redFighter) || {
          name: match.redFighter,
          wins: 0,
          losses: 0,
          draws: 0,
          totalPoints: 0,
          matchesPlayed: 0,
          averageScore: 0,
          winPercentage: 0,
        }
        const blueStats = statsMap.get(match.blueFighter) || {
          name: match.blueFighter,
          wins: 0,
          losses: 0,
          draws: 0,
          totalPoints: 0,
          matchesPlayed: 0,
          averageScore: 0,
          winPercentage: 0,
        }

        redStats.matchesPlayed++
        blueStats.matchesPlayed++
        redStats.totalPoints += officialScorecard.totalRed
        blueStats.totalPoints += officialScorecard.totalBlue

        if (officialScorecard.winner === 'red') {
          redStats.wins++
          blueStats.losses++
        } else if (officialScorecard.winner === 'blue') {
          blueStats.wins++
          redStats.losses++
        } else {
          redStats.draws++
          blueStats.draws++
        }

        statsMap.set(match.redFighter, redStats)
        statsMap.set(match.blueFighter, blueStats)
      }
    })

    // Calculate averages and percentages
    const allStats: FighterStats[] = Array.from(statsMap.values()).map((stats) => ({
      ...stats,
      averageScore: stats.matchesPlayed > 0 ? stats.totalPoints / stats.matchesPlayed : 0,
      winPercentage: stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0,
    }))

    // Sort by wins, then total points
    allStats.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      return b.totalPoints - a.totalPoints
    })

    // Get top 3 fighters
    const topFighters = allStats.slice(0, 3)

    // Calculate most dominant wins
    const dominantWins = completedMatches
      .map(({ match, scorecard }) => {
        const margin = Math.abs(scorecard.totalRed - scorecard.totalBlue)
        return { match, scorecard, margin }
      })
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 3)

    const averageScore = completedMatches.length > 0 
      ? totalScore / (completedMatches.length * 2) 
      : 0

    setInsights({
      totalMatches: matchesData.length,
      completedMatches: completedMatches.length,
      totalFighters: fighters.length || statsMap.size,
      totalRounds,
      averageScore: Math.round(averageScore * 10) / 10,
      topFighters,
      mostDominantWins: dominantWins,
    })
  }

  const completionPercentage = insights.totalMatches > 0 
    ? (insights.completedMatches / insights.totalMatches) * 100 
    : 0

  return (
    <Container maxWidth="md" sx={{ py: 4, px: { xs: '16px 8px', sm: 3 } }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tournamentName || 'Toernooi'} - Statistieken en analyses van het toernooi
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
          {/* Overview Cards */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <SportsMma sx={{ mb: 0.75, color: 'primary.main', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.25, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                    {insights.totalMatches}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1.2 }}>
                    Totaal Wedstrijden
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <CheckCircle sx={{ mb: 0.75, color: 'success.main', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.25, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                    {insights.completedMatches}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1.2 }}>
                    Voltooid
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <People sx={{ mb: 0.75, color: 'info.main', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.25, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                    {insights.totalFighters}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1.2 }}>
                    Vechters
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Assessment sx={{ mb: 0.75, color: 'warning.main', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.25, fontSize: { xs: '0.95rem', sm: '1.1rem' } }}>
                    {insights.averageScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1.2 }}>
                    Gem. Score
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Progress Bar */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Voortgang Toernooi
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {insights.completedMatches}/{insights.totalMatches} wedstrijden
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={completionPercentage} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>

          {/* Top Fighters */}
          {insights.topFighters.length > 0 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <EmojiEvents sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="h6">
                    Top Vechters
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {insights.topFighters.map((fighter, index) => (
                    <Box key={fighter.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: index === 0 ? 'warning.main' : index === 1 ? 'grey.400' : 'warning.dark',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                            }}
                          >
                            {index + 1}
                          </Box>
                          <FighterAvatar name={fighter.name} size={32} color="red" />
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {fighter.name}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                            {fighter.wins}W - {fighter.losses}L
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {fighter.totalPoints} punten
                          </Typography>
                        </Box>
                      </Box>
                      {index < insights.topFighters.length - 1 && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}

          {/* Most Dominant Wins */}
          {insights.mostDominantWins.length > 0 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TrendingUp sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="h6">
                    Meest Dominante Overwinningen
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {insights.mostDominantWins.map(({ match, scorecard, margin }, index) => {
                    const winner = scorecard.winner === 'red' ? match.redFighter : match.blueFighter
                    const loser = scorecard.winner === 'red' ? match.blueFighter : match.redFighter
                    const winnerScore = scorecard.winner === 'red' ? scorecard.totalRed : scorecard.totalBlue
                    const loserScore = scorecard.winner === 'red' ? scorecard.totalBlue : scorecard.totalRed

                    return (
                      <Box key={match.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <FighterAvatar name={winner} size={24} color="red" />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {winner}
                              </Typography>
                              <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                                {winnerScore}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <FighterAvatar name={loser} size={24} color="blue" />
                              <Typography variant="body2" color="text.secondary">
                                {loser}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {loserScore}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ ml: 2, textAlign: 'right' }}>
                            <Typography variant="h6" color="error.main">
                              +{margin}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              verschil
                            </Typography>
                          </Box>
                        </Box>
                        {index < insights.mostDominantWins.length - 1 && <Divider sx={{ mt: 2 }} />}
                      </Box>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </Container>
  )
}
