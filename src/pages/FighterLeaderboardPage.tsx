import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Grid,
} from '@mui/material'
import { EmojiEvents } from '@mui/icons-material'
import { Fighter, Match, Scorecard } from '../types'
import { FighterAvatar } from '../components/FighterAvatar'

interface FighterStats {
  fighter: Fighter
  wins: number
  losses: number
  draws: number
  totalPoints: number
  matchesPlayed: number
  winPercentage: number
  rank: number
}

export function FighterLeaderboardPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const [tournamentName, setTournamentName] = useState<string>('')
  const [fighterStats, setFighterStats] = useState<FighterStats[]>([])

  useEffect(() => {
    // Load tournament info
    const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament)
      setTournamentName(tournament.name || 'Toernooi')
    }

    // Load fighters
    const savedFighters = localStorage.getItem(`tournament_${tournamentId}_fighters`)
    if (!savedFighters) {
      setFighterStats([])
      return
    }

    const fighters: Fighter[] = JSON.parse(savedFighters)

    // Load matches
    const savedMatches = localStorage.getItem(`tournament_${tournamentId}_matches`)
    if (!savedMatches) {
      setFighterStats(
        fighters.map((fighter) => ({
          fighter,
          wins: 0,
          losses: 0,
          draws: 0,
          totalPoints: 0,
          matchesPlayed: 0,
          winPercentage: 0,
          rank: 0,
        }))
      )
      return
    }

    const matches: Match[] = JSON.parse(savedMatches)

    // Calculate stats for each fighter
    // Use fighter name as key since matches store fighter names, not IDs
    const statsMap = new Map<string, FighterStats>()

    // Initialize stats for all fighters from the fighters list
    fighters.forEach((fighter) => {
      statsMap.set(fighter.name, {
        fighter,
        wins: 0,
        losses: 0,
        draws: 0,
        totalPoints: 0,
        matchesPlayed: 0,
        winPercentage: 0,
        rank: 0,
      })
    })

    // Also add fighters that appear in matches but aren't in the fighters list
    matches.forEach((match) => {
      if (!statsMap.has(match.redFighter)) {
        statsMap.set(match.redFighter, {
          fighter: {
            id: `temp_${match.redFighter}`,
            name: match.redFighter,
            tournamentId: tournamentId!,
          },
          wins: 0,
          losses: 0,
          draws: 0,
          totalPoints: 0,
          matchesPlayed: 0,
          winPercentage: 0,
          rank: 0,
        })
      }
      if (!statsMap.has(match.blueFighter)) {
        statsMap.set(match.blueFighter, {
          fighter: {
            id: `temp_${match.blueFighter}`,
            name: match.blueFighter,
            tournamentId: tournamentId!,
          },
          wins: 0,
          losses: 0,
          draws: 0,
          totalPoints: 0,
          matchesPlayed: 0,
          winPercentage: 0,
          rank: 0,
        })
      }
    })

    // Process each match
    matches.forEach((match) => {
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

      if (!officialScorecard || !officialScorecard.winner) {
        // Match not completed or no winner
        return
      }

      const redStats = statsMap.get(match.redFighter)
      const blueStats = statsMap.get(match.blueFighter)

      if (redStats && blueStats) {
        // Update matches played
        redStats.matchesPlayed++
        blueStats.matchesPlayed++

        // Update points
        redStats.totalPoints += officialScorecard.totalRed
        blueStats.totalPoints += officialScorecard.totalBlue

        // Update wins/losses/draws
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
      }
    })

    // Calculate win percentage and create array
    const stats: FighterStats[] = Array.from(statsMap.values()).map((stat) => {
      stat.winPercentage =
        stat.matchesPlayed > 0 ? (stat.wins / stat.matchesPlayed) * 100 : 0
      return stat
    })

    // Sort by: wins (desc), then total points (desc), then win percentage (desc)
    stats.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
      return b.winPercentage - a.winPercentage
    })

    // Assign ranks
    stats.forEach((stat, index) => {
      stat.rank = index + 1
    })

    setFighterStats(stats)
  }, [tournamentId])

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'silver'
    if (rank === 3) return '#CD7F32' // Bronze
    return 'default'
  }

  const getRankIcon = (rank: number) => {
    if (rank <= 3) return <EmojiEvents sx={{ fontSize: 20 }} />
    return null
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Vechters Scoreboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tournamentName || 'Toernooi'}
        </Typography>
      </Box>

      {fighterStats.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Nog geen vechters of wedstrijden om te ranken.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {fighterStats.map((stat) => (
            <Card
              key={stat.fighter.id}
              sx={{
                borderLeft: stat.rank <= 3 ? `4px solid ${getRankColor(stat.rank)}` : 'none',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  {/* Rank */}
                  <Grid item xs={1}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 700,
                          color: stat.rank <= 3 ? getRankColor(stat.rank) : 'text.primary',
                        }}
                      >
                        {stat.rank}
                      </Typography>
                      {getRankIcon(stat.rank)}
                    </Box>
                  </Grid>

                  {/* Avatar and Name */}
                  <Grid item xs={4}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FighterAvatar name={stat.fighter.name} size={48} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {stat.fighter.name}
                        </Typography>
                        {stat.matchesPlayed > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {stat.matchesPlayed} {stat.matchesPlayed === 1 ? 'wedstrijd' : 'wedstrijden'}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>

                  {/* Stats */}
                  <Grid item xs={7}>
                    <Grid container spacing={2}>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {stat.wins}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Gewonnen
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                            {stat.losses}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Verloren
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                            {stat.totalPoints}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Punten
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {stat.winPercentage.toFixed(0)}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Win %
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  )
}
