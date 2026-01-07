export type UserRole = 'organizer' | 'official_judge' | 'public_user'

export interface User {
  id: string
  name: string
  role: UserRole
  email?: string
}

export interface Fighter {
  id: string
  name: string
  tournamentId: string
}

export type TournamentType = 'round-robin' | 'poule-knockout' | 'knockout'
export type TournamentPhase = 'poule' | 'kwartfinale' | 'halve_finale' | 'finale' | 'bronzen_finale'

export interface Tournament {
  id: string
  name: string
  createdAt: number
  createdBy: string
  fighters: string[] // Fighter IDs
  matches: string[] // Match IDs
  rounds: number // Default number of rounds for matches
  type: TournamentType
  currentPhase: TournamentPhase
  pouleSize?: number // Aantal vechters per poule
  poules?: string[][] // Array van poules, elke poule bevat fighter names
}

export interface Match {
  id: string
  tournamentId: string
  redFighter: string
  blueFighter: string
  weightClass: string
  rounds: number // 3 or 5
  officialJudges: string[] // User IDs
  status: 'pending' | 'active' | 'completed'
  createdAt: number
  startedAt?: number
  completedAt?: number
  phase?: TournamentPhase
  pouleId?: string // Voor poule wedstrijden
  bracketPosition?: number // Voor knockout bracket positie
}

export interface ScoreEvent {
  id: string
  matchId: string
  userId: string
  round: number
  corner: 'red' | 'blue'
  type: 'point' | 'deduction'
  value: number // +1 for point, -1 for deduction
  timestamp: number
}

export interface RoundScore {
  round: number
  redPoints: number
  bluePoints: number
  redDeductions: number
  blueDeductions: number
  redTotal: number
  blueTotal: number
}

export interface Scorecard {
  matchId: string
  userId: string
  isOfficial: boolean
  judgeName?: string
  ownerUid?: string
  createdAt?: number
  updatedAt?: number
  rounds: RoundScore[]
  totalRed: number
  totalBlue: number
  winner: 'red' | 'blue' | null
  events: ScoreEvent[] // Chronological events for undo
}

export interface MatchResult {
  matchId: string
  officialScores: Scorecard[]
  publicScores: Scorecard[]
  finalRedScore: number
  finalBlueScore: number
  winner: 'red' | 'blue' | null
  completedAt: number
}

