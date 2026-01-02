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
import { Match, Scorecard, Fighter } from '../types'
import { FighterAvatar } from '../components/FighterAvatar'

export function TournamentPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const [tournamentName, setTournamentName] = useState<string>('')
  const [tournamentRounds, setTournamentRounds] = useState<number>(3)
  const [fighters, setFighters] = useState<Fighter[]>([])
  const [newFighterName, setNewFighterName] = useState('')
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

  useEffect(() => {
    // Load tournament info
    const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament)
      setTournamentName(tournament.name || 'Toernooi')
      const rounds = tournament.rounds || 3
      setTournamentRounds(rounds)
      setGenerateRounds(rounds)
    }
    
    // Load fighters
    const savedFighters = localStorage.getItem(`tournament_${tournamentId}_fighters`)
    if (savedFighters) {
      const fightersData: Fighter[] = JSON.parse(savedFighters)
      setFighters(fightersData)
    }
    
    // In real app, fetch matches from Firebase
    // For now, load from localStorage
    const savedMatches = localStorage.getItem(`tournament_${tournamentId}_matches`)
    if (savedMatches) {
      const matchesData: Match[] = JSON.parse(savedMatches)
      setMatches(matchesData)

      // Load scorecards for each match
      const scorecards: Record<string, Scorecard[]> = {}
      matchesData.forEach((match) => {
        const matchScorecards: Scorecard[] = []
        // Get all scorecards for this match
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(`scorecard_${match.id}_`)) {
            const scorecard = JSON.parse(localStorage.getItem(key)!)
            matchScorecards.push(scorecard)
          }
        }
        scorecards[match.id] = matchScorecards
      })
      setMatchScorecards(scorecards)
    }
  }, [tournamentId])

  const handleDeleteFighter = (fighterId: string) => {
    const updatedFighters = fighters.filter(f => f.id !== fighterId)
    setFighters(updatedFighters)
    localStorage.setItem(`tournament_${tournamentId}_fighters`, JSON.stringify(updatedFighters))
    
    // Update tournament
    const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament)
      tournament.fighters = updatedFighters.map(f => f.id)
      localStorage.setItem(`tournament_${tournamentId}`, JSON.stringify(tournament))
    }
    
    // Delete matches involving this fighter
    const updatedMatches = matches.filter(m => 
      m.redFighter !== fighters.find(f => f.id === fighterId)?.name &&
      m.blueFighter !== fighters.find(f => f.id === fighterId)?.name
    )
    setMatches(updatedMatches)
    localStorage.setItem(`tournament_${tournamentId}_matches`, JSON.stringify(updatedMatches))
  }

  const handleAddTempFighter = () => {
    if (!tempFighterName.trim()) return

    const fighter: Fighter = {
      id: `fighter_${Date.now()}`,
      name: tempFighterName.trim(),
      tournamentId: tournamentId!,
    }

    const updatedFighters = [...fighters, fighter]
    setFighters(updatedFighters)
    localStorage.setItem(`tournament_${tournamentId}_fighters`, JSON.stringify(updatedFighters))
    
    // Update tournament
    const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament)
      tournament.fighters = updatedFighters.map(f => f.id)
      localStorage.setItem(`tournament_${tournamentId}`, JSON.stringify(tournament))
    }
    
    setTempFighterName('')
  }

  const handleGenerateMatches = () => {
    if (fighters.length < 2) {
      alert('Voeg minimaal 2 vechters toe om wedstrijden te genereren.')
      return
    }

    // Generate all possible matches (round-robin: each fighter vs each other fighter)
    const newMatches: Match[] = []
    
    for (let i = 0; i < fighters.length; i++) {
      for (let j = i + 1; j < fighters.length; j++) {
        // Check if match already exists
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
          }
          newMatches.push(match)
        }
      }
    }

    if (newMatches.length > 0) {
      const updatedMatches = [...matches, ...newMatches]
      setMatches(updatedMatches)
      localStorage.setItem(`tournament_${tournamentId}_matches`, JSON.stringify(updatedMatches))
      
      // Update tournament
      const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
      if (savedTournament) {
        const tournament = JSON.parse(savedTournament)
        tournament.matches = updatedMatches.map(m => m.id)
        tournament.rounds = generateRounds
        localStorage.setItem(`tournament_${tournamentId}`, JSON.stringify(tournament))
      }
      
      setOpenGenerateDialog(false)
      setTempFighterName('')
    } else {
      alert('Alle mogelijke wedstrijden zijn al aangemaakt.')
      setOpenGenerateDialog(false)
    }
  }

  const handleCreateManualMatch = () => {
    if (!manualMatch.redFighter || !manualMatch.blueFighter || manualMatch.redFighter === manualMatch.blueFighter) return

    // Check if match already exists
    const matchExists = matches.some(m => 
      (m.redFighter === manualMatch.redFighter && m.blueFighter === manualMatch.blueFighter) ||
      (m.redFighter === manualMatch.blueFighter && m.blueFighter === manualMatch.redFighter)
    )

    if (matchExists) {
      alert('Deze wedstrijd bestaat al!')
      return
    }

    const match: Match = {
      id: `match_${Date.now()}`,
      tournamentId: tournamentId!,
      redFighter: manualMatch.redFighter,
      blueFighter: manualMatch.blueFighter,
      weightClass: '',
      rounds: manualMatch.rounds,
      officialJudges: [],
      status: 'pending',
      createdAt: Date.now(),
    }

    const updatedMatches = [...matches, match]
    setMatches(updatedMatches)
    localStorage.setItem(`tournament_${tournamentId}_matches`, JSON.stringify(updatedMatches))
    
    // Update tournament
    const savedTournament = localStorage.getItem(`tournament_${tournamentId}`)
    if (savedTournament) {
      const tournament = JSON.parse(savedTournament)
      tournament.matches = updatedMatches.map(m => m.id)
      localStorage.setItem(`tournament_${tournamentId}`, JSON.stringify(tournament))
    }
    
    setManualMatch({ redFighter: '', blueFighter: '', rounds: tournamentRounds })
    setOpenMatchDialog(false)
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, pb: 10 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {tournamentName || 'Toernooi'}
        </Typography>
      </Box>


      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Wedstrijden
        </Typography>
        {matches.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Nog geen wedstrijden. Maak er een aan!
          </Typography>
        ) : (
          <Stack spacing={2}>
              {matches.map((match) => {
                const scorecards = matchScorecards[match.id] || []
                // Get the first official scorecard or first scorecard
                const displayScorecard = scorecards.find((s) => s.isOfficial) || scorecards[0]
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

