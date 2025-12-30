import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import { Navigation } from './components/Navigation'
import { HomePage } from './pages/HomePage'
import { TournamentPage } from './pages/TournamentPage'
import { MatchPage } from './pages/MatchPage'
import { ScorecardPage } from './pages/ScorecardPage'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tournament/:tournamentId" element={<TournamentPage />} />
          <Route path="/tournament/:tournamentId/match/:matchId" element={<MatchPage />} />
          <Route path="/tournament/:tournamentId/match/:matchId/scorecard/:userId" element={<ScorecardPage />} />
          <Route path="/tournament/:tournamentId/dashboard" element={<DashboardPage />} />
        </Routes>
      </Box>
    </Box>
  )
}

export default App

