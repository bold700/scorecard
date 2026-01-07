import { Routes, Route } from 'react-router-dom'
import { Alert, Box, Collapse } from '@mui/material'
import { Navigation } from './components/Navigation'
import { BottomNavigation } from './components/BottomNavigation'
import { HomePage } from './pages/HomePage'
import { TournamentPage } from './pages/TournamentPage'
import { MatchPage } from './pages/MatchPage'
import { ScorecardPage } from './pages/ScorecardPage'
import { DashboardPage } from './pages/DashboardPage'
import { FighterLeaderboardPage } from './pages/FighterLeaderboardPage'
import { InsightsSelectionPage } from './pages/InsightsSelectionPage'
import { LeaderboardSelectionPage } from './pages/LeaderboardSelectionPage'
import { useEffect, useState } from 'react'
import { getFirebaseStatus } from './lib/firebase'

function App() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  // Poll status so UI can reflect async Firebase errors without wiring a full event bus.
  const [, setFirebaseTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setFirebaseTick((t) => t + 1), 2000)
    return () => window.clearInterval(id)
  }, [])

  const firebaseStatus = getFirebaseStatus()
  const recentError =
    firebaseStatus.lastError && Date.now() - firebaseStatus.lastError.at < 2 * 60 * 1000
  const showFirebaseAlert = !firebaseStatus.available || Boolean(recentError)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <Collapse in={showFirebaseAlert} unmountOnExit>
        <Alert severity="warning" sx={{ borderRadius: 0 }}>
          Firebase synchronisatie is niet actief of heeft een fout gegeven. De app gebruikt nu (ook) lokale opslag.{' '}
          {firebaseStatus.lastError?.code ? `(${firebaseStatus.lastError.code}) ` : ''}
          {firebaseStatus.lastError?.message ? firebaseStatus.lastError.message : ''}
        </Alert>
      </Collapse>
      <Box component="main" sx={{ flexGrow: 1, pb: 7 }}>
        <Routes>
          <Route path="/" element={<HomePage createDialogOpen={createDialogOpen} setCreateDialogOpen={setCreateDialogOpen} />} />
          <Route path="/insights" element={<InsightsSelectionPage />} />
          <Route path="/leaderboard-select" element={<LeaderboardSelectionPage />} />
          <Route path="/tournament/:tournamentId" element={<TournamentPage />} />
          <Route path="/tournament/:tournamentId/match/:matchId" element={<MatchPage />} />
          <Route path="/tournament/:tournamentId/match/:matchId/scorecard/:userId" element={<ScorecardPage />} />
          <Route path="/tournament/:tournamentId/dashboard" element={<DashboardPage />} />
          <Route path="/tournament/:tournamentId/leaderboard" element={<FighterLeaderboardPage />} />
        </Routes>
      </Box>
      <BottomNavigation onNewTournamentClick={() => setCreateDialogOpen(true)} />
    </Box>
  )
}

export default App

