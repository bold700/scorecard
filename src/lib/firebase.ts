// Firebase setup voor gedeelde toernooien
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Firebase config - moet worden aangepast met echte credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'demo',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo',
}

// Initialize Firebase
let app: any = null
let db: any = null
let auth: any = null
let isFirebaseConfigured = false

if (firebaseConfig.apiKey !== 'demo' && firebaseConfig.projectId !== 'demo') {
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
    isFirebaseConfigured = true
    console.log('Firebase initialized successfully', { projectId: firebaseConfig.projectId })
  } catch (error) {
    console.error('Firebase initialization failed:', error)
  }
} else {
  console.warn('Firebase not configured - using demo values. API Key:', firebaseConfig.apiKey, 'Project ID:', firebaseConfig.projectId)
}

// Helper om te checken of Firebase beschikbaar is
export const isFirebaseAvailable = () => isFirebaseConfigured && db !== null

// Firebase Firestore helpers
export const firebaseService = {
  // Tournaments
  async saveTournament(tournament: any) {
    // Remove undefined values before saving to Firebase
    const cleanTournament = Object.fromEntries(
      Object.entries(tournament).filter(([_, value]) => value !== undefined)
    )
    
    if (!isFirebaseAvailable()) {
      console.warn('Firebase not available, saving to localStorage only')
      // Fallback naar localStorage
      localStorage.setItem(`tournament_${tournament.id}`, JSON.stringify(tournament))
      return
    }
    
    try {
      console.log('Saving tournament to Firebase:', tournament.id)
      const tournamentRef = doc(db, 'tournaments', tournament.id)
      await setDoc(tournamentRef, cleanTournament)
      console.log('Tournament saved successfully to Firebase')
    } catch (error) {
      console.error('Error saving tournament to Firebase:', error)
      // Fallback naar localStorage
      localStorage.setItem(`tournament_${tournament.id}`, JSON.stringify(tournament))
    }
  },

  async getTournament(tournamentId: string) {
    if (!isFirebaseAvailable()) {
      // Fallback naar localStorage
      const saved = localStorage.getItem(`tournament_${tournamentId}`)
      return saved ? JSON.parse(saved) : null
    }
    
    try {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      const docSnap = await getDoc(tournamentRef)
      if (docSnap.exists()) {
        return docSnap.data()
      }
      // Fallback naar localStorage
      const saved = localStorage.getItem(`tournament_${tournamentId}`)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Error getting tournament:', error)
      const saved = localStorage.getItem(`tournament_${tournamentId}`)
      return saved ? JSON.parse(saved) : null
    }
  },

  async getAllTournaments(): Promise<any[]> {
    if (!isFirebaseAvailable()) {
      // Fallback naar localStorage
      const tournaments: any[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('tournament_') && !key.includes('_matches') && !key.includes('_fighters')) {
          try {
            const tournament = JSON.parse(localStorage.getItem(key)!)
            if (tournament && tournament.id && tournament.name) {
              tournaments.push(tournament)
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      }
      return tournaments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    }
    
    try {
      const tournamentsRef = collection(db, 'tournaments')
      const q = query(tournamentsRef, orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)
      const tournaments: any[] = []
      querySnapshot.forEach((doc) => {
        tournaments.push(doc.data())
      })
      return tournaments
    } catch (error) {
      console.error('Error getting tournaments:', error)
      // Fallback naar localStorage
      const tournaments: any[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('tournament_') && !key.includes('_matches') && !key.includes('_fighters')) {
          try {
            const tournament = JSON.parse(localStorage.getItem(key)!)
            if (tournament && tournament.id && tournament.name) {
              tournaments.push(tournament)
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      }
      return tournaments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    }
  },

  subscribeToTournaments(callback: (tournaments: any[]) => void) {
    if (!isFirebaseAvailable()) {
      // Fallback: poll localStorage
      const checkLocalStorage = () => {
        const tournaments: any[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith('tournament_') && !key.includes('_matches') && !key.includes('_fighters')) {
            try {
              const tournament = JSON.parse(localStorage.getItem(key)!)
              if (tournament && tournament.id && tournament.name) {
                tournaments.push(tournament)
              }
            } catch (e) {
              // Skip invalid entries
            }
          }
        }
        callback(tournaments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)))
      }
      checkLocalStorage()
      const interval = setInterval(checkLocalStorage, 2000) // Poll elke 2 seconden
      return () => clearInterval(interval)
    }
    
    try {
      const tournamentsRef = collection(db, 'tournaments')
      const q = query(tournamentsRef, orderBy('createdAt', 'desc'))
      return onSnapshot(q, (querySnapshot) => {
        const tournaments: any[] = []
        querySnapshot.forEach((doc) => {
          tournaments.push(doc.data())
        })
        callback(tournaments)
      })
    } catch (error) {
      console.error('Error subscribing to tournaments:', error)
      return () => {}
    }
  },

  async deleteTournament(tournamentId: string) {
    if (!isFirebaseAvailable()) {
      // Fallback naar localStorage
      localStorage.removeItem(`tournament_${tournamentId}`)
      localStorage.removeItem(`tournament_${tournamentId}_matches`)
      localStorage.removeItem(`tournament_${tournamentId}_fighters`)
      return
    }
    
    try {
      await deleteDoc(doc(db, 'tournaments', tournamentId))
    } catch (error) {
      console.error('Error deleting tournament:', error)
      // Fallback naar localStorage
      localStorage.removeItem(`tournament_${tournamentId}`)
      localStorage.removeItem(`tournament_${tournamentId}_matches`)
      localStorage.removeItem(`tournament_${tournamentId}_fighters`)
    }
  },

  // Matches
  async saveMatches(tournamentId: string, matches: any[]) {
    if (!isFirebaseAvailable()) {
      localStorage.setItem(`tournament_${tournamentId}_matches`, JSON.stringify(matches))
      return
    }
    
    try {
      const matchesRef = doc(db, 'tournaments', tournamentId, 'matches', 'all')
      await setDoc(matchesRef, { matches, updatedAt: Date.now() })
    } catch (error) {
      console.error('Error saving matches:', error)
      localStorage.setItem(`tournament_${tournamentId}_matches`, JSON.stringify(matches))
    }
  },

  async getMatches(tournamentId: string): Promise<any[]> {
    if (!isFirebaseAvailable()) {
      const saved = localStorage.getItem(`tournament_${tournamentId}_matches`)
      return saved ? JSON.parse(saved) : []
    }
    
    try {
      const matchesRef = doc(db, 'tournaments', tournamentId, 'matches', 'all')
      const docSnap = await getDoc(matchesRef)
      if (docSnap.exists()) {
        return docSnap.data().matches || []
      }
      const saved = localStorage.getItem(`tournament_${tournamentId}_matches`)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error getting matches:', error)
      const saved = localStorage.getItem(`tournament_${tournamentId}_matches`)
      return saved ? JSON.parse(saved) : []
    }
  },

  // Fighters
  async saveFighters(tournamentId: string, fighters: any[]) {
    if (!isFirebaseAvailable()) {
      localStorage.setItem(`tournament_${tournamentId}_fighters`, JSON.stringify(fighters))
      return
    }
    
    try {
      const fightersRef = doc(db, 'tournaments', tournamentId, 'fighters', 'all')
      await setDoc(fightersRef, { fighters, updatedAt: Date.now() })
    } catch (error) {
      console.error('Error saving fighters:', error)
      localStorage.setItem(`tournament_${tournamentId}_fighters`, JSON.stringify(fighters))
    }
  },

  async getFighters(tournamentId: string): Promise<any[]> {
    if (!isFirebaseAvailable()) {
      const saved = localStorage.getItem(`tournament_${tournamentId}_fighters`)
      return saved ? JSON.parse(saved) : []
    }
    
    try {
      const fightersRef = doc(db, 'tournaments', tournamentId, 'fighters', 'all')
      const docSnap = await getDoc(fightersRef)
      if (docSnap.exists()) {
        return docSnap.data().fighters || []
      }
      const saved = localStorage.getItem(`tournament_${tournamentId}_fighters`)
      return saved ? JSON.parse(saved) : []
    } catch (error) {
      console.error('Error getting fighters:', error)
      const saved = localStorage.getItem(`tournament_${tournamentId}_fighters`)
      return saved ? JSON.parse(saved) : []
    }
  },

  // Scorecards
  async saveScorecard(scorecard: any) {
    // Filter out undefined values
    const cleanedScorecard = Object.fromEntries(
      Object.entries(scorecard).filter(([, value]) => value !== undefined)
    )
    
    if (!isFirebaseAvailable()) {
      localStorage.setItem(`scorecard_${scorecard.matchId}_${scorecard.userId}`, JSON.stringify(scorecard))
      return
    }
    
    try {
      const scorecardRef = doc(db, 'scorecards', `${scorecard.matchId}_${scorecard.userId}`)
      await setDoc(scorecardRef, cleanedScorecard)
    } catch (error) {
      console.error('Error saving scorecard:', error)
      localStorage.setItem(`scorecard_${scorecard.matchId}_${scorecard.userId}`, JSON.stringify(scorecard))
    }
  },

  async getScorecard(matchId: string, userId: string): Promise<any | null> {
    if (!isFirebaseAvailable()) {
      const saved = localStorage.getItem(`scorecard_${matchId}_${userId}`)
      return saved ? JSON.parse(saved) : null
    }
    
    try {
      const scorecardRef = doc(db, 'scorecards', `${matchId}_${userId}`)
      const docSnap = await getDoc(scorecardRef)
      if (docSnap.exists()) {
        return docSnap.data()
      }
      const saved = localStorage.getItem(`scorecard_${matchId}_${userId}`)
      return saved ? JSON.parse(saved) : null
    } catch (error) {
      console.error('Error getting scorecard:', error)
      const saved = localStorage.getItem(`scorecard_${matchId}_${userId}`)
      return saved ? JSON.parse(saved) : null
    }
  },

  async getAllScorecardsForMatch(matchId: string): Promise<any[]> {
    if (!isFirebaseAvailable()) {
      // Fallback naar localStorage
      const scorecards: any[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`scorecard_${matchId}_`)) {
          try {
            const scorecard = JSON.parse(localStorage.getItem(key)!)
            scorecards.push(scorecard)
          } catch (e) {
            // Skip invalid entries
          }
        }
      }
      return scorecards
    }
    
    try {
      const scorecardsRef = collection(db, 'scorecards')
      const querySnapshot = await getDocs(scorecardsRef)
      const scorecards: any[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        if (data.matchId === matchId) {
          scorecards.push(data)
        }
      })
      
      // Also check localStorage for any missing ones
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`scorecard_${matchId}_`)) {
          try {
            const scorecard = JSON.parse(localStorage.getItem(key)!)
            // Only add if not already in Firebase results
            if (!scorecards.find(s => s.userId === scorecard.userId)) {
              scorecards.push(scorecard)
            }
          } catch (e) {
            // Skip invalid entries
          }
        }
      }
      
      return scorecards
    } catch (error) {
      console.error('Error getting scorecards:', error)
      // Fallback naar localStorage
      const scorecards: any[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(`scorecard_${matchId}_`)) {
          try {
            const scorecard = JSON.parse(localStorage.getItem(key)!)
            scorecards.push(scorecard)
          } catch (e) {
            // Skip invalid entries
          }
        }
      }
      return scorecards
    }
  },
}

export { db, auth, app }