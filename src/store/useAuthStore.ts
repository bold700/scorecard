import { create } from 'zustand'
import { User } from '../types'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    // Load user from localStorage on init
    const saved = localStorage.getItem('auth_user')
    return saved ? JSON.parse(saved) : null
  })(),
  setUser: (user) => {
    set({ user })
    // Persist to localStorage
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('auth_user')
    }
  },
  isAuthenticated: () => get().user !== null,
}))

