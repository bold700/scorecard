import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
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
import { useState } from 'react'

function App() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
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

