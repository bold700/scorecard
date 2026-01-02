import { Scorecard } from '../types'

/**
 * Berekent de winnaar op basis van meerdere scorecards (juryleden)
 * Gebruikt meerderheid van stemmen: wie heeft de meeste stemmen voor winnaar?
 */
export function calculateWinnerFromScorecards(scorecards: Scorecard[]): 'red' | 'blue' | null {
  if (scorecards.length === 0) return null
  
  // Filter alleen scorecards met een winnaar
  const completedScorecards = scorecards.filter(s => s.winner !== null)
  if (completedScorecards.length === 0) return null
  
  let redVotes = 0
  let blueVotes = 0
  
  completedScorecards.forEach(scorecard => {
    if (scorecard.winner === 'red') {
      redVotes++
    } else if (scorecard.winner === 'blue') {
      blueVotes++
    }
  })
  
  // Meerderheid bepaalt de winnaar
  if (redVotes > blueVotes) {
    return 'red'
  } else if (blueVotes > redVotes) {
    return 'blue'
  }
  
  // Gelijk aantal stemmen = gelijkspel
  return null
}

/**
 * Berekent gemiddelde scores op basis van meerdere scorecards
 */
export function calculateAverageScores(scorecards: Scorecard[]): { totalRed: number; totalBlue: number } {
  if (scorecards.length === 0) {
    return { totalRed: 0, totalBlue: 0 }
  }
  
  const totalRed = scorecards.reduce((sum, s) => sum + s.totalRed, 0)
  const totalBlue = scorecards.reduce((sum, s) => sum + s.totalBlue, 0)
  
  return {
    totalRed: Math.round((totalRed / scorecards.length) * 10) / 10,
    totalBlue: Math.round((totalBlue / scorecards.length) * 10) / 10,
  }
}

/**
 * Maakt een geaggregeerde "official" scorecard op basis van alle ingevulde scorecards
 */
export function createAggregatedScorecard(
  matchId: string,
  scorecards: Scorecard[]
): Scorecard | null {
  if (scorecards.length === 0) return null
  
  // Bepaal winnaar op basis van meerderheid van stemmen
  const winner = calculateWinnerFromScorecards(scorecards)
  
  // Bereken gemiddelde scores
  const avgScores = calculateAverageScores(scorecards)
  
  // Neem de eerste scorecard als basis voor rounds structuur
  const baseScorecard = scorecards[0]
  
  // Bereken gemiddelde per ronde
  const aggregatedRounds = baseScorecard.rounds.map((round, index) => {
    let totalRedPoints = 0
    let totalBluePoints = 0
    let totalRedDeductions = 0
    let totalBlueDeductions = 0
    
    scorecards.forEach(scorecard => {
      const roundData = scorecard.rounds[index]
      if (roundData) {
        totalRedPoints += roundData.redPoints
        totalBluePoints += roundData.bluePoints
        totalRedDeductions += roundData.redDeductions
        totalBlueDeductions += roundData.blueDeductions
      }
    })
    
    const count = scorecards.length
    const avgRedPoints = Math.round((totalRedPoints / count) * 10) / 10
    const avgBluePoints = Math.round((totalBluePoints / count) * 10) / 10
    const avgRedDeductions = Math.round((totalRedDeductions / count) * 10) / 10
    const avgBlueDeductions = Math.round((totalBlueDeductions / count) * 10) / 10
    
    // Bepaal ronde winnaar op basis van gemiddelde punten
    let redTotal = 10
    let blueTotal = 10
    
    if (avgRedPoints > avgBluePoints) {
      const diff = avgRedPoints - avgBluePoints
      blueTotal = 10 - diff
    } else if (avgBluePoints > avgRedPoints) {
      const diff = avgBluePoints - avgRedPoints
      redTotal = 10 - diff
    }
    
    // Pas aftrekken toe
    redTotal = Math.max(0, redTotal - avgRedDeductions)
    blueTotal = Math.max(0, blueTotal - avgBlueDeductions)
    
    return {
      round: round.round,
      redPoints: avgRedPoints,
      bluePoints: avgBluePoints,
      redDeductions: avgRedDeductions,
      blueDeductions: avgBlueDeductions,
      redTotal: Math.round(redTotal * 10) / 10,
      blueTotal: Math.round(blueTotal * 10) / 10,
    }
  })
  
  return {
    matchId,
    userId: 'aggregated', // Special ID voor geaggregeerde scorecard
    isOfficial: true,
    rounds: aggregatedRounds,
    totalRed: avgScores.totalRed,
    totalBlue: avgScores.totalBlue,
    winner,
    events: [], // Geen events voor geaggregeerde scorecard
  }
}
