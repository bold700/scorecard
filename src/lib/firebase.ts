// Firebase setup - voorbereid voor toekomstige realtime updates
// Voor nu gebruiken we localStorage als fallback

// Firebase config - moet worden aangepast met echte credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'demo',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'demo',
}

// Initialize Firebase only if config is valid
let db: any = null
let auth: any = null

// Initialize Firebase synchronously (will fail gracefully if not configured)
if (firebaseConfig.apiKey !== 'demo') {
  try {
    const { initializeApp } = require('firebase/app')
    const { getFirestore } = require('firebase/firestore')
    const { getAuth } = require('firebase/auth')
    
    const app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    auth = getAuth(app)
  } catch (error) {
    // Firebase not configured or not available - using localStorage fallback
    console.warn('Firebase not available, using localStorage fallback')
  }
}

export { db, auth }

