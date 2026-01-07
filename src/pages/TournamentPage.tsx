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
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Collapse,
  Fab,
  Menu,
} from '@mui/material'
import { ExpandMore, ExpandLess, Delete } from '@mui/icons-material'
import { Add } from '@mui/icons-material'
import { Match, Scorecard, Fighter, TournamentType, TournamentPhase } from '../types'
import { FighterAvatar } from '../components/FighterAvatar'
import { BracketVisualization } from '../components/BracketVisualization'
import { firebaseService } from '../lib/firebase'
import { createAggregatedScorecard } from '../lib/scorecardAggregation'

export function TournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const [tournamentName, setTournamentName] = useState<string>('')
  const [tournamentRounds, setTournamentRounds] = useState<number>(3)
  const [tournamentType, setTournamentType] = useState<TournamentType>('round-robin')
  const [currentPhase, setCurrentPhase] = useState<TournamentPhase>('poule')
  const [pouleSize, setPouleSize] = useState<number>(4)
  const [poules, setPoules] = useState<string[][]>([])
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [matchScorecards, setMatchScorecards] = useState<Record<string, Scorecard[]>>({})
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({})
  const [openMatchDialog, setOpenMatchDialog] = useState(false)
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false)
  const [fabMenuAnchor, setFabMenuAnchor] = useState<null | HTMLElement>(null)
  const [manualMatch, setManualMatch] = useState({
    redFighter: '',
    blueFighter: '',
    rounds: 3,
  })
  const [generateRounds, setGenerateRounds] = useState(3)
  const [tempFighterName, setTempFighterName] = useState('')
  const [matchFilter, setMatchFilter] = useState<'all' | 'pending' | 'completed'>('all')

  useEffect(() => {
    const loadTournamentData = async () => {
      // Load tournament info from Firebase (with localStorage fallback)
      const tournament = await firebaseService.getTournament(tournamentId!)
      if (tournament) {
        setTournamentName(tournament.name || 'Toernooi')
        const rounds = tournament.rounds || 3
        setTournamentRounds(rounds)
        setGenerateRounds(rounds)
        const type = tournament.type || 'round-robin'
        setTournamentType(type)
        setCurrentPhase(tournament.currentPhase || (type === 'knockout' ? 'kwartfinale' : 'poule'))
        setPouleSize(tournament.pouleSize || 4)
        setPoules(tournament.poules || [])
        
        // Update old tournaments without type
        if (!tournament.type) {
          tournament.type = 'round-robin'
          tournament.currentPhase = 'poule'
          await firebaseService.saveTournament(tournament)
        }
      }
      
      // Load fighters from Firebase (with localStorage fallback)
      const fightersData = await firebaseService.getFighters(tournamentId!)
      if (fightersData) {
        setFighters(fightersData)
      }
      
      // Load matches from Firebase (with localStorage fallback)
      const matchesData = await firebaseService.getMatches(tournamentId!)
      if (matchesData) {
        setMatches(matchesData)

        // Load ALL scorecards for each match from Firebase
        const scorecards: Record<string, Scorecard[]> = {}
        for (const match of matchesData) {
          const allScorecards = await firebaseService.getAllScorecardsForMatch(match.id)
          scorecards[match.id] = allScorecards
        }
        setMatchScorecards(scorecards)
      }
    }

    loadTournamentData()
  }, [tournamentId])

  const handleDeleteFighter = async (fighterId: string) => {
    const updatedFighters = fighters.filter(f => f.id !== fighterId)
    setFighters(updatedFighters)
    await firebaseService.saveFighters(tournamentId!, updatedFighters)
    
    // Update tournament
    const tournament = await firebaseService.getTournament(tournamentId!)
    if (tournament) {
      tournament.fighters = updatedFighters.map(f => f.id)
      await firebaseService.saveTournament(tournament)
    }
    
    // Delete matches involving this fighter
    const deletedFighter = fighters.find(f => f.id === fighterId)
    const updatedMatches = matches.filter(m => 
      m.redFighter !== deletedFighter?.name &&
      m.blueFighter !== deletedFighter?.name
    )
    setMatches(updatedMatches)
    await firebaseService.saveMatches(tournamentId!, updatedMatches)
  }

  const handleAddTempFighter = async () => {
    if (!tempFighterName.trim()) return

    const fighter: Fighter = {
      id: `fighter_${Date.now()}`,
      name: tempFighterName.trim(),
      tournamentId: tournamentId!,
    }

    const updatedFighters = [...fighters, fighter]
    setFighters(updatedFighters)
    await firebaseService.saveFighters(tournamentId!, updatedFighters)
    
    // Update tournament
    const tournament = await firebaseService.getTournament(tournamentId!)
    if (tournament) {
      tournament.fighters = updatedFighters.map(f => f.id)
      await firebaseService.saveTournament(tournament)
    }
    
    setTempFighterName('')
  }

  const generatePoules = (fighterNames: string[], size: number): string[][] => {
    const shuffled = [...fighterNames].sort(() => Math.random() - 0.5)
    const poules: string[][] = []
    for (let i = 0; i < shuffled.length; i += size) {
      poules.push(shuffled.slice(i, i + size))
    }
    return poules
  }


  const handleGenerateMatches = async () => {
    if (fighters.length < 2) {
      alert('Voeg minimaal 2 vechters toe om wedstrijden te genereren.')
      return
    }

    const fighterNames = fighters.map(f => f.name)
    const newMatches: Match[] = []
    let updatedPoules: string[][] = []

    if (tournamentType === 'round-robin') {
      // Round-robin: iedereen tegen iedereen
      for (let i = 0; i < fighters.length; i++) {
        for (let j = i + 1; j < fighters.length; j++) {
          const matchExists = matches.some(m => 
            (m.redFighter === fighters[i].name && m.blueFighter === fighters[j].name) ||
            (m.redFighter === fighters[j].name && m.blueFighter === fighters[i].name)
          )
          
          if (!matchExists) {
            const match: Match = {
              id: `match_${Date.now()}_${i}_${j}`,
              tournamentId: tournamentId!,
              redFighter: fighters[i].name,
              blueFighter: fighters[j].name,
              weightClass: '',
              rounds: generateRounds,
              officialJudges: [],
              status: 'pending',
              createdAt: Date.now(),
              phase: 'poule',
            }
            newMatches.push(match)
          }
        }
      }
    } else if (tournamentType === 'poule-knockout') {
      // Poule + Knockout: eerst poules, dan knockout
      if (currentPhase === 'poule') {
        // Genereer poules
        updatedPoules = generatePoules(fighterNames, pouleSize)
        
        // Genereer wedstrijden binnen elke poule
        updatedPoules.forEach((poule, pouleIndex) => {
          for (let i = 0; i < poule.length; i++) {
            for (let j = i + 1; j < poule.length; j++) {
              const matchExists = matches.some(m => 
                (m.redFighter === poule[i] && m.blueFighter === poule[j] && m.pouleId === `poule_${pouleIndex}`) ||
                (m.redFighter === poule[j] && m.blueFighter === poule[i] && m.pouleId === `poule_${pouleIndex}`)
              )
              
              if (!matchExists) {
                const match: Match = {
                  id: `match_${Date.now()}_p${pouleIndex}_${i}_${j}`,
                  tournamentId: tournamentId!,
                  redFighter: poule[i],
                  blueFighter: poule[j],
                  weightClass: '',
                  rounds: generateRounds,
                  officialJudges: [],
                  status: 'pending',
                  createdAt: Date.now(),
                  phase: 'poule',
                  pouleId: `poule_${pouleIndex}`,
                }
                newMatches.push(match)
              }
            }
          }
        })
      }
    } else if (tournamentType === 'knockout') {
      // Direct knockout bracket
      const bracketMatches = generateKnockoutBracket(fighterNames)
      newMatches.push(...bracketMatches)
    }

    if (newMatches.length > 0) {
      const updatedMatches = [...matches, ...newMatches]
      setMatches(updatedMatches)
      await firebaseService.saveMatches(tournamentId!, updatedMatches)
      
      // Update tournament
      const tournament = await firebaseService.getTournament(tournamentId!)
      if (tournament) {
        tournament.matches = updatedMatches.map(m => m.id)
        tournament.rounds = generateRounds
        if (updatedPoules.length > 0) {
          tournament.poules = updatedPoules
        }
        await firebaseService.saveTournament(tournament)
      }
      
      if (updatedPoules.length > 0) {
        setPoules(updatedPoules)
      }
      
      setOpenGenerateDialog(false)
      setTempFighterName('')
    } else {
      alert('Alle mogelijke wedstrijden zijn al aangemaakt.')
      setOpenGenerateDialog(false)
    }
  }

  const handleCreateManualMatch = async () => {
    if (!manualMatch.redFighter || !manualMatch.blueFighter || manualMatch.redFighter === manualMatch.blueFighter) return
    const redName = manualMatch.redFighter.trim()
    const blueName = manualMatch.blueFighter.trim()
    if (!redName || !blueName || redName === blueName) return

    // Check if match already exists
    const matchExists = matches.some(m => 
      (m.redFighter === redName && m.blueFighter === blueName) ||
      (m.redFighter === blueName && m.blueFighter === redName)
    )

    if (matchExists) {
      alert('Deze wedstrijd bestaat al!')
      return
    }

    // Zorg dat beide vechters ook echt bestaan in de fighters-lijst (belangrijk voor Insights/standings)
    const ensureFighter = (name: string): Fighter | null => {
      const existing = fighters.find((f) => f.name.toLowerCase() === name.toLowerCase())
      if (existing) return existing
      return {
        id: `fighter_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        name,
        tournamentId: tournamentId!,
      }
    }

    const redF = ensureFighter(redName)
    const blueF = ensureFighter(blueName)
    const newFighters: Fighter[] = []
    if (redF && !fighters.some((f) => f.id === redF.id)) newFighters.push(redF)
    if (blueF && !fighters.some((f) => f.id === blueF.id)) newFighters.push(blueF)
    if (newFighters.length > 0) {
      const updatedFighters = [...fighters, ...newFighters]
      setFighters(updatedFighters)
      await firebaseService.saveFighters(tournamentId!, updatedFighters)
      const tournament = await firebaseService.getTournament(tournamentId!)
      if (tournament) {
        tournament.fighters = updatedFighters.map((f) => f.id)
        await firebaseService.saveTournament(tournament)
      }
    }

    const match: Match = {
      id: `match_${Date.now()}`,
      tournamentId: tournamentId!,
      redFighter: redName,
      blueFighter: blueName,
      weightClass: '',
      rounds: manualMatch.rounds,
      officialJudges: [],
      status: 'pending',
      createdAt: Date.now(),
    }

    const updatedMatches = [...matches, match]
    setMatches(updatedMatches)
    await firebaseService.saveMatches(tournamentId!, updatedMatches)
    
    // Update tournament
    const tournament = await firebaseService.getTournament(tournamentId!)
    if (tournament) {
      tournament.matches = updatedMatches.map(m => m.id)
      await firebaseService.saveTournament(tournament)
    }
    
    setManualMatch({ redFighter: '', blueFighter: '', rounds: tournamentRounds })
    setOpenMatchDialog(false)
  }

  const getPhaseLabel = (phase: TournamentPhase): string => {
    const labels: Record<TournamentPhase, string> = {
      poule: 'Poule Fase',
      kwartfinale: 'Kwartfinales',
      halve_finale: 'Halve Finales',
      finale: 'Finale',
      bronzen_finale: 'Bronzen Finale',
    }
    return labels[phase]
  }

  const calculatePouleStandings = (poule: string[], pouleMatches: Match[]): Array<{ name: string; wins: number; points: number; matchesPlayed: number }> => {
    const standings = new Map<string, { wins: number; points: number; matchesPlayed: number }>()
    
    poule.forEach(fighter => {
      standings.set(fighter, { wins: 0, points: 0, matchesPlayed: 0 })
    })

    pouleMatches.forEach(match => {
      const scorecards = matchScorecards[match.id] || []
      const officialScorecard = createAggregatedScorecard(match.id, scorecards) || scorecards[0]
      
      if (officialScorecard) {
        const redStanding = standings.get(match.redFighter)
        const blueStanding = standings.get(match.blueFighter)
        
        if (redStanding && blueStanding) {
          redStanding.matchesPlayed++
          blueStanding.matchesPlayed++
          redStanding.points += officialScorecard.totalRed
          blueStanding.points += officialScorecard.totalBlue
          
          if (officialScorecard.winner === 'red') {
            redStanding.wins++
          } else if (officialScorecard.winner === 'blue') {
            blueStanding.wins++
          }
        }
      }
    })

    return Array.from(standings.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins
        return b.points - a.points
      })
  }

  const checkPhaseComplete = (phase: TournamentPhase): boolean => {
    const phaseMatches = matches.filter(m => m.phase === phase)
    if (phaseMatches.length === 0) return false
    
    return phaseMatches.every(match => {
      const scorecards = matchScorecards[match.id] || []
      const officialScorecard = createAggregatedScorecard(match.id, scorecards) || scorecards[0]
      return officialScorecard && officialScorecard.winner !== null
    })
  }

  const advanceToNextPhase = async () => {
    if (tournamentType !== 'poule-knockout') return

    if (currentPhase === 'poule') {
      // Bereken poule winnaars
      const qualifiers: string[] = []
      
      poules.forEach((poule, pouleIndex) => {
        const pouleMatches = matches.filter(m => m.pouleId === `poule_${pouleIndex}`)
        const standings = calculatePouleStandings(poule, pouleMatches)
        
        // Top 2 van elke poule gaan door (of top 1 als er maar 1 poule is)
        const topCount = poules.length === 1 ? 1 : 2
        const topFighters = standings.slice(0, topCount).map(s => s.name)
        qualifiers.push(...topFighters)
      })

      // Genereer kwartfinales
      const nextPhase: TournamentPhase = qualifiers.length <= 4 ? 'halve_finale' : 'kwartfinale'
      const bracketMatches = generateKnockoutBracket(qualifiers)
      bracketMatches.forEach(m => {
        m.phase = nextPhase
      })

      const updatedMatches = [...matches, ...bracketMatches]
      setMatches(updatedMatches)
      setCurrentPhase(nextPhase)
      
      // Update tournament
      const tournament = await firebaseService.getTournament(tournamentId!)
      if (tournament) {
        tournament.matches = updatedMatches.map(m => m.id)
        tournament.currentPhase = nextPhase
        await firebaseService.saveTournament(tournament)
      }
      
      await firebaseService.saveMatches(tournamentId!, updatedMatches)
    } else if (currentPhase === 'kwartfinale') {
      // Winnaars van kwartfinales gaan door naar halve finales
      const quarterFinalMatches = matches.filter(m => m.phase === 'kwartfinale')
      const winners: string[] = []
      
      quarterFinalMatches.forEach(match => {
        const scorecards = matchScorecards[match.id] || []
        const officialScorecard = createAggregatedScorecard(match.id, scorecards) || scorecards[0]
        if (officialScorecard && officialScorecard.winner) {
          winners.push(officialScorecard.winner === 'red' ? match.redFighter : match.blueFighter)
        }
      })

      if (winners.length === 4) {
        const semiFinalMatches = generateKnockoutBracket(winners)
        semiFinalMatches.forEach(m => {
          m.phase = 'halve_finale'
        })

        const updatedMatches = [...matches, ...semiFinalMatches]
        setMatches(updatedMatches)
        setCurrentPhase('halve_finale')
        
        const tournament = await firebaseService.getTournament(tournamentId!)
        if (tournament) {
          tournament.matches = updatedMatches.map(m => m.id)
          tournament.currentPhase = 'halve_finale'
          await firebaseService.saveTournament(tournament)
        }
        
        await firebaseService.saveMatches(tournamentId!, updatedMatches)
      }
    } else if (currentPhase === 'halve_finale') {
      // Winnaars en verliezers van halve finales
      const semiFinalMatches = matches.filter(m => m.phase === 'halve_finale')
      const winners: string[] = []
      const losers: string[] = []
      
      semiFinalMatches.forEach(match => {
        const scorecards = matchScorecards[match.id] || []
        const officialScorecard = createAggregatedScorecard(match.id, scorecards) || scorecards[0]
        if (officialScorecard && officialScorecard.winner) {
          winners.push(officialScorecard.winner === 'red' ? match.redFighter : match.blueFighter)
          losers.push(officialScorecard.winner === 'red' ? match.blueFighter : match.redFighter)
        }
      })

      if (winners.length === 2 && losers.length === 2) {
        // Finale
        const finalMatch: Match = {
          id: `match_${Date.now()}_final`,
          tournamentId: tournamentId!,
          redFighter: winners[0],
          blueFighter: winners[1],
          weightClass: '',
          rounds: generateRounds,
          officialJudges: [],
          status: 'pending',
          createdAt: Date.now(),
          phase: 'finale',
          bracketPosition: 1,
        }

        // Bronzen finale
        const bronzeMatch: Match = {
          id: `match_${Date.now()}_bronze`,
          tournamentId: tournamentId!,
          redFighter: losers[0],
          blueFighter: losers[1],
          weightClass: '',
          rounds: generateRounds,
          officialJudges: [],
          status: 'pending',
          createdAt: Date.now(),
          phase: 'bronzen_finale',
          bracketPosition: 1,
        }

        const updatedMatches = [...matches, finalMatch, bronzeMatch]
        setMatches(updatedMatches)
        setCurrentPhase('finale')
        
        const tournament = await firebaseService.getTournament(tournamentId!)
        if (tournament) {
          tournament.matches = updatedMatches.map(m => m.id)
          tournament.currentPhase = 'finale'
          await firebaseService.saveTournament(tournament)
        }
        
        await firebaseService.saveMatches(tournamentId!, updatedMatches)
      }
    }
  }

  const generateKnockoutBracket = (fighterNames: string[]): Match[] => {
    const bracketMatches: Match[] = []
    let currentFighters = [...fighterNames]
    let phase: TournamentPhase = 'kwartfinale'
    
    // Bepaal start fase op basis van aantal vechters
    if (currentFighters.length <= 2) {
      phase = 'finale'
    } else if (currentFighters.length <= 4) {
      phase = 'halve_finale'
    } else if (currentFighters.length <= 8) {
      phase = 'kwartfinale'
    }

    let bracketPosition = 1
    // Genereer alleen de eerste ronde matches
    for (let i = 0; i < currentFighters.length; i += 2) {
      if (i + 1 < currentFighters.length) {
        const match: Match = {
          id: `match_${Date.now()}_${bracketPosition}`,
          tournamentId: tournamentId!,
          redFighter: currentFighters[i],
          blueFighter: currentFighters[i + 1],
          weightClass: '',
          rounds: generateRounds,
          officialJudges: [],
          status: 'pending',
          createdAt: Date.now(),
          phase,
          bracketPosition,
        }
        bracketMatches.push(match)
        bracketPosition++
      }
    }
    
    return bracketMatches
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {tournamentName || 'Toernooi'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
          <Chip 
            label={getPhaseLabel(currentPhase)} 
            color="primary" 
            size="small"
          />
          {tournamentType === 'poule-knockout' && currentPhase === 'poule' && checkPhaseComplete('poule') && (
            <Button
              variant="contained"
              size="small"
              onClick={advanceToNextPhase}
            >
              Naar volgende fase
            </Button>
          )}
          {tournamentType === 'poule-knockout' && currentPhase === 'kwartfinale' && checkPhaseComplete('kwartfinale') && (
            <Button
              variant="contained"
              size="small"
              onClick={advanceToNextPhase}
            >
              Naar halve finales
            </Button>
          )}
          {tournamentType === 'poule-knockout' && currentPhase === 'halve_finale' && checkPhaseComplete('halve_finale') && (
            <Button
              variant="contained"
              size="small"
              onClick={advanceToNextPhase}
            >
              Naar finale
            </Button>
          )}
        </Box>
      </Box>


      {/* Poule Standen voor poule-knockout */}
      {tournamentType === 'poule-knockout' && currentPhase === 'poule' && poules.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Poule Standen
          </Typography>
          <Grid container spacing={2}>
            {poules.map((poule, pouleIndex) => {
              const pouleMatches = matches.filter(m => m.pouleId === `poule_${pouleIndex}`)
              const standings = calculatePouleStandings(poule, pouleMatches)
              
              return (
                <Grid item xs={12} sm={6} key={pouleIndex}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                        Poule {pouleIndex + 1}
                      </Typography>
                      <Stack spacing={1}>
                        {standings.map((standing, index) => (
                          <Box key={standing.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" fontWeight={index < 2 ? 600 : 400}>
                                {index + 1}. {standing.name}
                              </Typography>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {standing.wins}W - {standing.points}P
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Box>
      )}

      {/* Bracket Visualization voor knockout fase */}
      {(tournamentType === 'poule-knockout' || tournamentType === 'knockout') && currentPhase !== 'poule' && (
        <BracketVisualization 
          matches={matches}
          matchScorecards={matchScorecards}
          tournamentId={tournamentId!}
        />
      )}

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Wedstrijden {currentPhase !== 'poule' && `- ${getPhaseLabel(currentPhase)}`}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label="Alle"
              onClick={() => setMatchFilter('all')}
              color={matchFilter === 'all' ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Nog te vechten"
              onClick={() => setMatchFilter('pending')}
              color={matchFilter === 'pending' ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
            <Chip
              label="Klaar"
              onClick={() => setMatchFilter('completed')}
              color={matchFilter === 'completed' ? 'primary' : 'default'}
              size="small"
              sx={{ cursor: 'pointer' }}
            />
          </Stack>
        </Box>
        {matches.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Nog geen wedstrijden. Maak er een aan!
          </Typography>
        ) : (
          <Stack spacing={2}>
              {matches
                .filter(match => {
                  // Filter by phase
                  const phaseMatch = match.phase === currentPhase || !match.phase
                  if (!phaseMatch) return false
                  
                  // Filter by status
                  if (matchFilter === 'all') return true
                  
                  if (matchFilter === 'pending') {
                    // Show matches without scores or with status pending
                    const scorecards = matchScorecards[match.id] || []
                    const displayScorecard = scorecards.find((s) => s.isOfficial) || scorecards[0]
                    return !displayScorecard || displayScorecard.winner === null
                  }
                  
                  if (matchFilter === 'completed') {
                    // Show matches with completed scores
                    const scorecards = matchScorecards[match.id] || []
                    const displayScorecard = scorecards.find((s) => s.isOfficial) || scorecards[0]
                    return displayScorecard && displayScorecard.winner !== null
                  }
                  
                  return true
                })
                .map((match) => {
                const scorecards = matchScorecards[match.id] || []
                // Create aggregated scorecard from all user scorecards
                const displayScorecard = createAggregatedScorecard(match.id, scorecards) || scorecards[0]
                const hasScores = displayScorecard && (displayScorecard.totalRed > 0 || displayScorecard.totalBlue > 0)
                const winner = displayScorecard?.winner
                const maxPossibleScore = match.rounds * 10 // 10 punten per ronde
                
                return (
                  <Card 
                    key={match.id} 
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => {
                      const savedUser = localStorage.getItem('auth_user')
                      const user = savedUser ? JSON.parse(savedUser) : null
                      if (user && user.id) {
                        navigate(`/tournament/${tournamentId}/match/${match.id}/scorecard/${user.id}`)
                      } else {
                        navigate(`/tournament/${tournamentId}/match/${match.id}`)
                      }
                    }}
                  >
                    <CardContent>
                      {/* Score Display or Status */}
                      {hasScores ? (
                        <Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              px: 2,
                              py: 3,
                              mb: 1,
                            }}
                          >
                            {/* ROOD */}
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                                <Typography
                                  variant="h3"
                                  sx={{
                                    fontSize: '3.5rem',
                                    fontWeight: 700,
                                    color: 'error.main',
                                    lineHeight: 1,
                                  }}
                                >
                                  {displayScorecard.totalRed}
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
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                                <FighterAvatar name={match.redFighter} size={28} color="red" />
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: 'text.primary',
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {match.redFighter}
                                </Typography>
                              </Box>
                              <Box sx={{ minHeight: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0.5 }}>
                                {winner === 'red' && (
                                  <Chip
                                    label="Winnaar"
                                    color="success"
                                    size="small"
                                    sx={{
                                      fontSize: '0.7rem',
                                      height: '20px',
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>

                            {/* VS - Aligned with scores */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 2,
                                alignSelf: 'center',
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
                              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                                <Typography
                                  variant="h3"
                                  sx={{
                                    fontSize: '3.5rem',
                                    fontWeight: 700,
                                    color: 'info.main',
                                    lineHeight: 1,
                                  }}
                                >
                                  {displayScorecard.totalBlue}
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
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                                <FighterAvatar name={match.blueFighter} size={28} color="blue" />
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: 'text.primary',
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {match.blueFighter}
                                </Typography>
                              </Box>
                              <Box sx={{ minHeight: '28px', display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 0.5 }}>
                                {winner === 'blue' && (
                                  <Chip
                                    label="Winnaar"
                                    color="success"
                                    size="small"
                                    sx={{
                                      fontSize: '0.7rem',
                                      height: '20px',
                                    }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </Box>

                          {/* Round Scores - Expandable */}
                          {displayScorecard && displayScorecard.rounds.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Button
                                variant="text"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedMatches((prev) => ({
                                    ...prev,
                                    [match.id]: !prev[match.id],
                                  }))
                                }}
                                endIcon={expandedMatches[match.id] ? <ExpandLess /> : <ExpandMore />}
                                sx={{ color: 'text.secondary' }}
                              >
                                {expandedMatches[match.id] ? 'Verberg' : 'Toon'} ronde scores
                              </Button>
                              <Collapse in={expandedMatches[match.id]}>
                                <Box sx={{ mt: 2 }}>
                                  <Grid container spacing={2}>
                                    {displayScorecard.rounds.map((round) => (
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
                      ) : (
                        <Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              px: 2,
                              py: 3,
                              mb: 1,
                            }}
                          >
                            {/* ROOD */}
                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, mb: 2 }}>
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
                                  /{maxPossibleScore}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                                <FighterAvatar name={match.redFighter} size={28} color="red" />
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: 'text.primary',
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {match.redFighter}
                                </Typography>
                              </Box>
                            </Box>

                            {/* VS */}
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 2,
                                alignSelf: 'center',
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
                              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 0.5, mb: 2 }}>
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
                                  /{maxPossibleScore}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                                <FighterAvatar name={match.blueFighter} size={28} color="blue" />
                                <Typography
                                  variant="h6"
                                  sx={{
                                    color: 'text.primary',
                                    fontSize: '1.25rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {match.blueFighter}
                                </Typography>
                              </Box>
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
      </Box>

      {/* Handmatig Wedstrijd Dialog */}
      <Dialog open={openMatchDialog} onClose={() => setOpenMatchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Handmatig Wedstrijd Toevoegen</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Rode vechter"
              value={manualMatch.redFighter}
              onChange={(e) => setManualMatch({ ...manualMatch, redFighter: e.target.value })}
              fullWidth
              required
              placeholder="Naam van de rode vechter"
            />
            <TextField
              label="Blauwe vechter"
              value={manualMatch.blueFighter}
              onChange={(e) => setManualMatch({ ...manualMatch, blueFighter: e.target.value })}
              fullWidth
              required
              placeholder="Naam van de blauwe vechter"
            />
            <TextField
              select
              label="Aantal rondes"
              value={manualMatch.rounds}
              onChange={(e) => setManualMatch({ ...manualMatch, rounds: Number(e.target.value) })}
              fullWidth
              required
            >
              <MenuItem value={3}>3 rondes</MenuItem>
              <MenuItem value={5}>5 rondes</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
          <Button 
            onClick={handleCreateManualMatch} 
            variant="contained"
            disabled={!manualMatch.redFighter.trim() || !manualMatch.blueFighter.trim() || manualMatch.redFighter.trim() === manualMatch.blueFighter.trim()}
            fullWidth
          >
            Toevoegen
          </Button>
          <Button 
            onClick={() => setOpenMatchDialog(false)}
            fullWidth
          >
            Annuleren
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAB voor wedstrijden toevoegen */}
      <Fab
        color="primary"
        aria-label="add match"
        sx={{ position: 'fixed', bottom: 80, right: 16, zIndex: 1000 }}
        onClick={(e) => setFabMenuAnchor(e.currentTarget)}
      >
        <Add />
      </Fab>

      {/* Menu voor FAB */}
      <Menu
        anchorEl={fabMenuAnchor}
        open={Boolean(fabMenuAnchor)}
        onClose={() => setFabMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            setManualMatch({ redFighter: '', blueFighter: '', rounds: tournamentRounds })
            setOpenMatchDialog(true)
            setFabMenuAnchor(null)
          }}
        >
          Handmatig wedstrijd toevoegen
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Herstel de laatste waarden
            const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
            if (savedTournament) {
              const tournament = JSON.parse(savedTournament)
              if (tournament.rounds) {
                setGenerateRounds(tournament.rounds)
              }
            }
            setOpenGenerateDialog(true)
            setFabMenuAnchor(null)
          }}
        >
          Wedstrijden genereren
        </MenuItem>
      </Menu>

      {/* Genereer Wedstrijden Dialog */}
      <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Wedstrijden Genereren</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Vechters toevoegen
              </Typography>
              <TextField
                label="Vechter naam"
                value={tempFighterName}
                onChange={(e) => setTempFighterName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTempFighter()
                  }
                }}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                onClick={handleAddTempFighter}
                disabled={!tempFighterName.trim()}
                fullWidth
                startIcon={<Add />}
                sx={{ mb: 2 }}
              >
                Toevoegen
              </Button>
              
              {fighters.length > 0 && (
                <Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {fighters.map((fighter) => (
                      <Chip
                        key={fighter.id}
                        label={fighter.name}
                        onDelete={() => handleDeleteFighter(fighter.id)}
                        deleteIcon={<Delete />}
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            <TextField
              select
              label="Aantal rondes per wedstrijd"
              value={generateRounds}
              onChange={(e) => setGenerateRounds(Number(e.target.value))}
              fullWidth
              required
            >
              <MenuItem value={3}>3 rondes</MenuItem>
              <MenuItem value={5}>5 rondes</MenuItem>
            </TextField>

            {fighters.length < 2 && (
              <Typography variant="body2" color="error">
                Voeg minimaal 2 vechters toe om wedstrijden te kunnen genereren.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
          <Button 
            onClick={handleGenerateMatches} 
            variant="contained"
            disabled={fighters.length < 2}
            fullWidth
          >
            Genereer alle wedstrijden
          </Button>
          <Button 
            onClick={() => setOpenGenerateDialog(false)} 
            fullWidth
          >
            Annuleren
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

